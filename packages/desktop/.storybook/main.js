const path = require('path');
const webpack = require('webpack');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');

module.exports = {
  core: {
    builder: 'webpack5',
  },
  staticDirs: [
    { from: '../src/renderer/fonts', to: '/fonts' },
    { from: '../src/renderer/static/images', to: '/images' }
  ],
  "stories": [
    "../src/**/*.stories.tsx",
    "../src/**/*.stories.cy.tsx",
  ],
  "addons": [
    "@storybook/addon-links",
    "@storybook/addon-essentials"
  ],
  "webpackFinal": async (config, { configType }) => {
    config.resolve.fallback = {
      "fs": false,
      "tls": false,
      "net": false,
      "path": false,
      "zlib": false,
      "http": false,
      "https": false,
      "stream": false,
      "crypto": false,
      "process": false,
    };
    config.resolve.alias = {
      ...config.resolve.alias,
      fs: path.resolve(__dirname, 'fsMock.js'),
      'electron-store-webpack-wrapper': path.resolve(__dirname, 'electronStoreMock.js'),
      net: path.resolve(__dirname, 'netMock.js')
    };
    config.module.rules.push({
      test: /\.scss$/,
      use: ['style-loader', 'css-loader', 'sass-loader'],
      include: path.resolve(__dirname, '../')
    });
    config.plugins.push(
      new webpack.ProvidePlugin({
          Buffer: ['buffer', 'Buffer'],
      })
    )
    config.plugins.push(new NodePolyfillPlugin())
    return config;
  }
}
