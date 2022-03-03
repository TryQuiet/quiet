const { startDevServer } = require('@cypress/webpack-dev-server')
const getCompareSnapshotsPlugin = require('cypress-visual-regression/dist/plugin');
// const webpackPreprocessor = require('@cypress/webpack-preprocessor')

const webpackConfig = require('./webpack')
module.exports = (on, config) => {
  on('dev-server:start', (options) => {
    return startDevServer({ options, webpackConfig })
  })
  getCompareSnapshotsPlugin(on, config);

  on('file:preprocessor', () => {
    console.log('processing file')
  })

  return config
}