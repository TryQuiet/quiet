const { startDevServer } = require('@cypress/webpack-dev-server')
const webpackConfig = require('./webpack')

module.exports = (on, config) => {
  on('dev-server:start', (options) => {
    return startDevServer({ options, webpackConfig })
  })

  return config
}