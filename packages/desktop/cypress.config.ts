import { defineConfig } from "cypress";
// import webpackConfig from "./webpack/webpack.config.renderer.dev";
// import webpackConfig from "./cypress/plugins/webpack"
// const { startDevServer } = require('@cypress/webpack-dev-server')
// const getCompareSnapshotsPlugin = require('cypress-visual-regression/dist/plugin');
// import getCompareSnapshotsPlugin from 'cypress-visual-regression/dist/plugin'

// const webpackConfig = require('./webpack')
import webpackConfig from "./cypress/webpack.config"

export default defineConfig({
  screenshotsFolder: "./cypress/snapshots/actual",
  trashAssetsBeforeRuns: true,
  video: false,

  component: {
    // devServer (cypressDevServerConfig, devServerConfig) {
    //   return startDevServer({ options, webpackConfig })
    // },
    setupNodeEvents(on, config) {
      // getCompareSnapshotsPlugin(on, config)
      on('before:browser:launch', (browser, launchOptions) => {
        if (browser.name === 'electron' && browser.isHeadless) {
          launchOptions.preferences.width = 1400
          launchOptions.preferences.height = 1200
        }
        return launchOptions
      })
    
      return config
    },
    specPattern: "src/**/*spec.{js,jsx,ts,tsx}",
    excludeSpecPattern: ["**/__snapshots__/*", "**/__image_snapshots__/*"],
    devServer: {
      framework: "react",
      bundler: "webpack",
      webpackConfig,
    },
  },

  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
