---
title: 'Basic Usage'
description: ''
position: 103
category: 'Getting started'
---

You can import `@cusy/plone-js` into your JavaScript module and instantiate a new Plone client:

```js
import PloneClient from '@cusy/plone-js';

const client = new PloneClient('http://localhost:8080/Plone');

// Fetch Plone content from the API
const getContent = async (path = '', query = {}) => {
  const queryOptions = {
    expand: 'breadcrumbs,navigation,translations',
    ...query,
  };

  try {
    return await client.query(path, queryOptions);
  } catch {
    return {};
  }
};
```
