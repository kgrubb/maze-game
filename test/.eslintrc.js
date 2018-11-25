module.exports = {
  'env': {
    'browser': true,
    'es6': true,
    'mocha': true,
  },
  'rules': {
    // mocha discourages the use of lambda functions 😢
    // https://mochajs.org/#arrow-functions
    'func-names': 0,
    'prefer-arrow-callback': 0,
  },
};
