const configureCoreJs = require('core-js/configurator')

// Storybook's browser polyfills must retain React Native's Promise. Replacing
// it makes the legacy queueMicrotask shim and core-js Promise call each other.
if (typeof global.Promise === 'function') {
  configureCoreJs({ useNative: ['Promise'] })
}
