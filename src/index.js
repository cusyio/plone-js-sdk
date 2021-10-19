import axios from 'axios';
import axiosRetry from 'axios-retry';
import {
  cacheAdapterEnhancer,
  throttleAdapterEnhancer,
} from 'axios-extensions';
import { joinURL, normalizeURL, withQuery } from 'ufo';
import LRUCache from 'lru-cache';

/**
 * Cache time should be 5 minutes by default.
 */
const CACHE_TIME = 1000 * 60 * 5;

/**
 * Create a new default LRU cache with a maximum age of 5 minutes.
 */
const defaultCache = new LRUCache({ maxAge: CACHE_TIME });

/**
 * Generate a new delay for the next request based on the exponential backoff method.
 *
 * @param {number} retryNumber The current retry.
 * @param {object} error The error object.
 * @returns {number} A new delay in ms for the next request.
 */
function customExponentialDelay(retryNumber = 0) {
  const delay = Math.pow(2, retryNumber) * 100;
  const randomSum = delay * 0.8 * Math.random();
  return delay + randomSum;
}

/**
 * Check if the request to the Plone backend should be retried.
 *
 * @param {object} error The error information from the request.
 * @returns {boolean} Whether or not the request should be retried.
 */
function isPloneError(error) {
  /**
   * Those errors can occur when clients close the connection.
   *
   * This usually means that Plone is under heavy load.
   */
  const ploneErrors = ['ECONNABORTED', 'ECONNRESET', 'EPIPE', 'ECANCELED'];
  if (error?.code && ploneErrors.includes(error.code)) {
    return true;
  }

  /**
   * Use the default `isNetworkOrIdempotentRequestError` callback.
   *
   * This one retries if it is a network error or a 5xx error on an
   * idempotent request (GET, HEAD, OPTIONS, PUT or DELETE).
   */
  return axiosRetry.isNetworkOrIdempotentRequestError(error);
}

/**
 * Default options for the PloneClient.
 */
const defaultOptions = {
  // Is the caching adapter enabled?
  enableCaching: false,
  // Is the retry plugin enabled?
  enableRetry: true,
  // Additional axios instance options.
  axiosOptions: {},
};

/**
 * The Plone JS client.
 */
class PloneClient {
  /**
   * Create a new Plone client.
   *
   * @param {String} url The Plone backend url to use.
   * @param {Array} options Additional options to configure Axios.
   */
  constructor(url, options = {}) {
    const clientOptions = {
      ...defaultOptions,
      ...options,
    };
    this.baseURL = url;

    // Create a new axios http client.
    this.$http = axios.create({
      baseURL: this.baseURL,
      withCredentials: false,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      timeout: 20000,
      // The adapters will always be available.
      // You can configure if the caching adapter is enabled by default
      // using the `enableCaching` option.
      adapter: throttleAdapterEnhancer(
        cacheAdapterEnhancer(axios.defaults.adapter, {
          enabledByDefault: clientOptions.enableCaching,
          defaultCache,
        })
      ),
      // Pass additional options for the axios instance.
      ...clientOptions.axiosOptions,
    });

    /**
     * Activate axios-retry plugin if requested.
     *
     * We use a custom retry condition callback which handles Plone errors and
     * falls back to the default callback.
     *
     * We also use the `exponentialDelay` function for an exponential backoff retry
     * delay between requests. See
     * https://developers.google.com/analytics/devguides/reporting/core/v3/errors#backoff
     * for details.
     */
    if (clientOptions?.enableRetry) {
      axiosRetry(this.$http, {
        retries: 3,
        retryCondition: isPloneError,
        retryDelay: customExponentialDelay,
      });
    }
  }

  /**
   * Query the Plone REST-API.
   *
   * This is the base for all requests to the Plone REST-API.
   * We do some URL normalization and then call the api.
   *
   * @param {string} path The relative path to search within.
   * @param {object} query API query options.
   * @param {object} options Additional axios options for the request.
   * @returns {object} A search result object.
   */
  async query(path, query = {}, options = {}) {
    path = normalizeURL(path);

    // Add api query options as query params
    path = withQuery(path, query);
    const result = await this.$http.get(path, options);
    return result?.data;
  }

  /**
   * Search for content using the built-in `search` endpoint.
   *
   * @param {string} path The relative path to search within.
   * @param {object} query API query options.
   * @param {object} options Additional axios options for the request.
   * @returns {object} A search result object with items.
   */
  async search(path = '', query = {}, options = {}) {
    let url = path;
    if (!url.endsWith('@search')) {
      // Ensure the @search endpoint is used.
      url = joinURL(path, '@search');
    }
    return await this.query(url, query, options);
  }

  /**
   * Get all available Plone content.
   *
   * @param {string} path The relative path to the API endpoint to use as base.
   * @param {object} query Optional REST-API and query params for the search.
   * @param {object} batch Optional batch information.
   * @param {object} options Additional axios options for the request.
   * @returns {array} List of items.
   */
  async fetchItems(path = '', query = {}, batch = {}, options = {}) {
    let response;

    const queryOptions = {
      metadata_fields: 'modified',
      ...query,
    };

    if (batch?.batchURL) {
      response = await this.query(batch.batchURL, queryOptions, options);
    } else {
      response = await this.search(path, queryOptions, options);
    }
    if (!batch?.items) {
      batch.items = [];
    }
    batch.items = batch.items.concat(
      this.makeAllURLsRelative(response?.items || [])
    );

    if (response.batching && response.batching.next) {
      batch.batchURL = response.batching.next;
      return await this.fetchItems(path, query, batch, options);
    }
    return [...new Set(batch.items)];
  }

  /**
   * Get a collection with all it’s dynamic items.
   *
   * @param {string} path The relative path to the collection item.
   * @param {object} query API query options.
   * @param {object} options Additional axios options for the request.
   * @returns {object} The collection with all resolved result items.
   */
  async fetchCollection(path = '', query = {}, options = {}) {
    const response = await this.query(path, query, options);
    let items;
    if (response?.batching) {
      items = await this.fetchItems(
        path,
        query,
        {
          batchURL: response.batching.next,
          items: response?.items || [],
        },
        options
      );
    }
    return {
      ...response,
      items,
    };
  }

  /**
   * Ensure all URLs are relative to the base URL.
   *
   * @param {array} items A list of Plone items.
   * @returns {array} A list of Plone items with relative URLs.
   */
  makeAllURLsRelative(items) {
    if (!items) {
      return;
    }
    return items.map((item) => {
      // TODO: replace all URLs starting with baseURL
      item['@id'] = item['@id'].replace(this.baseURL, '') || '/';
      return item;
    });
  }
}

module.exports = PloneClient;
