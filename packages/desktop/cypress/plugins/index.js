// const { startDevServer } = require('@cypress/webpack-dev-server')
// const getCompareSnapshotsPlugin = require('cypress-visual-regression/dist/plugin');

// const webpackConfig = require('./webpack')
// module.exports = (on, config) => {
//   on('dev-server:start', (options) => {
//     return startDevServer({ options, webpackConfig })
//   })
//   getCompareSnapshotsPlugin(on, config);

//   on('before:browser:launch', (browser, launchOptions) => {
//     if (browser.name === 'electron' && browser.isHeadless) {
//       launchOptions.preferences.width = 1400
//       launchOptions.preferences.height = 1200
//     }
//     return launchOptions
//   })

//   return config
// }