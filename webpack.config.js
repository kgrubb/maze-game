const path = require('path');
const glob = require('glob');

// Create a glob of all js entry points
const entryGlob = glob.sync('./scripts/index.js');

// Dynamically fetch all entries in provided glob
const entries = Object.assign({}, entryGlob.reduce((obj, item) => {
  const key = path.basename(item, '.js');
  // overwrite array indices with new key
  // eslint-disable-next-line no-param-reassign
  obj[key] = ['babel-polyfill', item];
  return obj;
}, {}));

module.exports = {
  mode: 'production',
  devtool: 'source-map',
  entry: entries,
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
  },
  resolve: {
    extensions: [
      '.js',
    ],
  },
  module: {
    rules: [{
      test: /\.js$/,
      include: path.resolve(__dirname, 'scripts'),
      use: [{
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-env'],
          plugins: [
            '@babel/plugin-syntax-object-rest-spread',
          ],
        },
      }],
    }],
  },
};
