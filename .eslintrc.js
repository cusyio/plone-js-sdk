module.exports = {
  parser: 'babel-eslint',
  extends: ['prettier'],
  plugins: ['prettier'],
  env: {
    mocha: true,
    node: true
  },
  rules: {
    strict: 0,
    'comma-dangle': 0,
    'prettier/prettier': 'error'
  }
};
