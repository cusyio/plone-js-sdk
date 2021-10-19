import theme from '@nuxt/content-theme-docs';

export default theme({
  docs: {
    primaryColor: '#0095D3',
  },
  hooks: {
    render: {
      route(url, result) {
        result.html = result.html.replace(/<base [^>]*>/, '');
      },
    },
  },
  loading: { color: '#0095D3' },
  pwa: {
    manifest: {
      name: 'Plone JS SDK',
    },
  },
  router: {
    base: '/plone-js-sdk/',
  },
  target: 'static',
});
