---
title: 'Setup'
description: ''
position: 102
category: 'Getting started'
---

## Installation

To install the Plone JS SDK add `@cusy/plone-js` as a dependency to your project:

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

The Plone Restful-API is available by default in Plone version 5 or newer, but not activated.
Please refer to your Plone manual on how to activate the add-on.

Some features may require the installation of additional Plone Add-ons.
Cusy provides several add-ons which extend or patch the Restful-API, e.g.:

- [cusy.restapi.patches](https://github.com/cusyio/cusy.restapi.patches): Patches and fixes for plone.restapi which are not yet released.
- [cusy.restapi.info](https://github.com/cusyio/cusy.restapi.info): Site and content info for plone.restapi.
- [cusy.restapi.easyform](https://github.com/cusyio/cusy.restapi.easyform): EasyForm integration for plone.restapi.
