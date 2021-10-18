---
title: 'API Reference'
description: ''
position: 201
category: 'API'
---

## `async query()`

Query the Plone REST-API.

- **Arguments**:
  - `path` (type: `string`) The relative path to search within.
  - `query` (type: `object`) API query options.
  - `options` (type: `object`) Additional axios options for the request.
- **Returns**: `string` The raw API response in JSON format.

This is the base for all requests to the Plone REST-API.
We do some URL normalization and then call the api.

You can use the `query` method to access all available endpoints (also your custom ones) from the Plone API.

<alert type="info">

More information about reading resources is available at the [plone.restapi content manipulation documentation](https://plonerestapi.readthedocs.io/en/latest/content.html#reading-a-resource-with-get).

</alert>

### Example: Get one content item

```js
import PloneClient from '@cusy/plone-js';
const client = new PloneClient('http://localhost:8080/Plone');
const path = 'my/path/to/content';
const queryOptions = {
  expand: 'breadcrumbs,navigation,translations',
};
const item = await client.query(path, queryOptions);
```

### Example: Query a custom endpoint

```js
import PloneClient from '@cusy/plone-js';
const client = new PloneClient('http://localhost:8080/Plone');
const path = 'my/path/to/content/@my-service';
const serviceInfo = await client.query(path);
```

## `async search()`

Search for content using the built-in `search` endpoint.

- **Arguments**:
  - `path` (type: `string`) The relative path to search within.
  - `query` (type: `object`) API query options.
  - `options` (type: `object`) Additional axios options for the request.
- **Returns**: `string` The raw API response in JSON format.

<alert type="info">

More information about the `search` endpoint is available at the [plone.restapi search documentation](https://plonerestapi.readthedocs.io/en/latest/searching.html).

</alert>

### Example: Search for all content

```js
import PloneClient from '@cusy/plone-js';
const client = new PloneClient('http://localhost:8080/Plone');
const results = await client.search('/');
```

### Example: Get the 5 recent news items

```js
import PloneClient from '@cusy/plone-js';
const client = new PloneClient('http://localhost:8080/Plone');
const query = {
  b_size: 5,
  metadata_fields: ['effective'],
  portal_type: ['News Item'],
  sort_on: 'effective',
  sort_order: 'descending',
};

const results = await client.search('/', query);
const newsItems = result.items;
```

## `async fetchItems()`

Get all available Plone content.

- **Arguments**:
  - `path` (type: `string`) The relative path to the API endpoint to use as base.
  - `query` (type: `object`) Optional REST-API and query params for the search.
  - `batch` (type: `object`) Optional batch information.
  - `options` (type: `object`) Additional axios options for the request.
- **Returns**: `array` List of items.

### Example: Get all Plone content with full metadata

Each item in the `ploneRoutes` list contains the full metadata information.
This can be usefull when generating static pages and you don’t want to query the API for every page again and again.

```js
import PloneClient from '@cusy/plone-js';
const client = new PloneClient('http://localhost:8080/Plone');
const queryOptions = {
  sort_on: 'path',
  sort_order: 'ascending',
  expand: 'breadcrumbs,translations,contentinfo',
  fullobjects: '1',
};

const ploneRoutes = await client.fetchItems('/', queryOptions);

const mappedRoutes = ploneRoutes.map((item) => {
  return {
    url: item['@id'],
    payload: item,
  };
});
```

## `async fetchCollection()`

Get a collection with all it’s dynamic items.

- **Arguments**:
  - `path` (type: `string`) The relative path to the collection item.
  - `query` (type: `object`) API query options.
  - `options` (type: `object`) Additional axios options for the request.
- **Returns**: `array` List of items.

A Plone collection (or any content implementing the collection behavior) is a content item in Plone which provides the results of a pre-defined search.

Plone provides various settings for the visual representation of the search results.
But those all refer to the Plone backend and have no effect on the Restful-API.

The Restful-API automatically batches the returned results (see [“Batching” in the plone.restapi documentation](https://plonerestapi.readthedocs.io/en/latest/batching.html)).

In order to be able to provide a custom batched representation in your application this method gets **all** items and resolves the Plone batching.
You can customize the returned metadata with the `query` option (see [“Retrieving additional metadata” in the plone.restapi documentation](https://plonerestapi.readthedocs.io/en/latest/searching.html#retrieving-additional-metadata)).

### Example: Get all items for a collection

By default each item in the results contains the summary information.
Those are currenly:

- `@id`
- `@type`
- `description`
- `review_state`
- `title`

```js
import PloneClient from '@cusy/plone-js';
const client = new PloneClient('http://localhost:8080/Plone');
const collection = await client.fetchCollection('/path/to/collection');
const collectioResults = collection.items;
```

### Example: Get all items for a collection with all metadata

By providing a custom query we can adjust the collection results.

In this example we return all available metadata for the items.
You could also return the full objects including all components (by providing `fullobjects: 1` in the query).
Please note that this would be significantly slower, as this requires more processing on the backend and might not be neccessary in most cases.

```js
import PloneClient from '@cusy/plone-js';
const client = new PloneClient('http://localhost:8080/Plone');
const collection = await client.fetchCollection('/path/to/collection', {
  metadata_fields: ['_all'],
});
const collectioResults = collection.items;
```
