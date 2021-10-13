import axios from 'axios';
import { joinURL, normalizeURL, withQuery } from 'ufo';

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
      ...options,
    });
  }

  /**
   * Query the Plone REST-API.
   *
   * This is the base for all requests to the Plone REST-API.
   * We do some URL normalization and then call the api.
   *
   * @param {string} path The relative path to search within.
   * @param {object} options API options.
   * @returns The raw API response in JSON format.
   */
  async query(path, options = {}) {
    path = normalizeURL(path);

    // Add api options as query params
    path = withQuery(path, options);
    try {
      const result = await this.$http.get(path);
      return result?.data;
    } catch (e) {
      return {
        error: e,
      };
    }
  }

  /**
   * Search for content.
   * @param {string} path The relative path to search within.
   * @param {object} searchOptions Search options.
   * @returns A list of search results
   */
  async search(path = '', searchOptions = {}) {
    let url = path;
    if (!url.endsWith('@search')) {
      // Ensure the @search endpoint is used.
      url = joinURL(path, '@search');
    }
    return await this.query(url, searchOptions);
  }

  /**
   * Get all available Plone content.
   *
   * @param {string} path The relative path to the API endpoint to use as base.
   * @param {object} queryParams Optional REST-API and query params for the search.
   * @param {object} options Optional batch URL for batched results.
   * @returns List of URLs.
   */
  async fetchItems(path = '', queryParams = {}, options = {}) {
    let response;

    if (options?.batchURL) {
      response = await this.query(options.batchURL);
    } else {
      const queryOptions = {
        metadata_fields: 'modified',
        ...queryParams,
      };
      response = await this.search(path, queryOptions);
    }
    if (!options?.items) {
      options.items = [];
    }
    options.items = options.items.concat(
      response?.items.map((item) => {
        // TODO: replace all URLs starting with baseURL
        item['@id'] = item['@id'].replace(this.baseURL, '') || '/';
        return item;
      })
    );

    if (response.batching && response.batching.next) {
      options.batchURL = response.batching.next;
      return await this.fetchItems(path, queryParams, options);
    }
    return [...new Set(options.items)];
  }
}

module.exports = PloneClient;
