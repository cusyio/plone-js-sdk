---
title: 'Configuration'
description: ''
position: 104
category: 'Getting started'
---

## Client initialization

The client constructor takes up to 2 arguments, `url` (required) and `options`.
Although it is possible to change some settings later during runtime, it is not recommended as the client initializes a custom axios instance based on the initial provided settings.

### url

- Type: `String`
- `required`

The endpoint of your Plone API.

```javascript
import PloneClient from '@cusy/plone-js';

const client = new PloneClient('http://localhost:8080/Plone');
```

### options (optional)

- Type: `Object`
- Default: `{}`

Additional options to configure the client.
If no options are given, the following defaults will be used:

- `enableCaching`: `false`
- `enableRetry`: `true`
- `axiosOptions`: `{}`

## Options

### enableCaching

- Type: `Boolean`
- Default: `false`

Is the caching adapter enabled by default for all requests?

The client configures two adapters from [`axios-extensions`](https://github.com/kuitos/axios-extensions) (`cacheAdapterEnhancer` and `throttleAdapterEnhancer`).
The `cacheAdapterEnhancer` will only be enabled by default if `enableCaching` is set to `true`.

The cache time is set to 5 minutes and can currently not be changed.
The caching adapter works on both server and client, but is most usefull on server side when generating a static version of your Plone page, where a lot of identical requests might happen in a short amount of time.

If the cache adapter is not enabled for all requests you can still cache requests by setting the `cache` option to `true` for a specific request.

## enableRetry

- Type: `Boolean`
- Default: `true`

Defines if the [`axios-retry`](https://github.com/softonic/axios-retry) instance uses the retry plugin.

The plugin uses the following configuration:

- `retries`: `3`
- `retryCondition`: `isPloneError`
- `retryDelay`: `customExponentialDelay`

We use a custom retry condition function (`isPloneError`) which checks for additional network errors your Plone instance can throw when it’s under heavy load.
Those errors are `ECONNABORTED`, `ECONNRESET`, `EPIPE` and `ECANCELED`.

The function then falls back to the default of `isNetworkOrIdempotentRequestError` for all other errors.

The available exponential delay `axios-retry` ships with didn’t bring the desired results and in some cases increased load on the server.
The custom function we provide increases the delay.

### axiosOptions

- Type: `Object`
- Default: `{}`

Provide additional axios instance options.

You cann pass additional options for the axios instance.
Those options are applied last so you can overwrite any defaults we use for the http client.

You can also pass axios options for each individual request.
