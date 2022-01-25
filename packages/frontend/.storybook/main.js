const path = require('path');

module.exports = {
  "stories": [
    "../src/**/*.stories.mdx",
    "../src/**/*.stories.@(js|jsx|ts|tsx)",
  ],
  "addons": [
    "@storybook/addon-links",
    "@storybook/addon-essentials"
  ],
  "webpackFinal": async (config, { configType }) => {
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
    return config;
  }
}
