---
title: 'Setup'
description: ''
position: 102
category: 'Getting started'
---

## Installation

Add `@cusy/plone-js` dependency to your project:

<code-group>
  <code-block label="Yarn" active>

```bash
yarn add @cusy/plone-js
```

  </code-block>
  <code-block label="NPM">

```bash
npm install @cusy/plone-js
```

  </code-block>
</code-group>

You can now import  `@cusy/plone-js` into your JavaScript module and instantiate a new Plone client:

```js
import PloneClient from '@cusy/plone-js';

const client = new PloneClient('http://localhost:8080/Plone');

// Fetch Plone content from the API
const getContent = async (path = '', options = {}) => {
  const searchOptions = {
    expand: 'breadcrumbs,translations,contentinfo',
    ...options,
  };

  try {
    return await client.query(path, searchOptions);
  } catch {
    return {};
  }
};
```
