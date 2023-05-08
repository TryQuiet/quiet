/**
 * Metro configuration for React Native
 * https://github.com/facebook/react-native
 *
 * @format
 */

const blacklist = require('metro-config/src/defaults/exclusionList')

const path = require('path')

const watchFolders = [
  path.resolve(__dirname, '../identity'),
  path.resolve(__dirname, '../state-manager'),
  path.resolve(__dirname, '../backend'),
  path.resolve(__dirname, '../logger'),
  path.resolve(__dirname, '../common'),
  path.resolve(__dirname, '../types')
]

const extraNodeModules = {
  '@quiet/identity': path.resolve(__dirname, '../identity'),
  '@quiet/state-manager': path.resolve(__dirname, '../state-manager'),
  '@quiet/backend': path.resolve(__dirname, '../backend'),
  '@quiet/logger': path.resolve(__dirname, '../logger'),
  '@quiet/common': path.resolve(__dirname, '../common'),
  '@quiet/types': path.resolve(__dirname, '../types'),
  ...require('node-libs-react-native')
}

module.exports = {
  resolver: {
    blacklistRE: blacklist([/\/nodejs-assets\/.*/, /\/android\/.*/, /\/ios\/.*/]),
    extraNodeModules: new Proxy(extraNodeModules, {
      get: (target, name) =>
        // redirects dependencies referenced from common packages to local node_modules
        name in target ? target[name] : path.join(process.cwd(), `node_modules/${name}`)
    })
  },
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true
      }
    })
  },
  sourceExts: ['js', 'jsx', 'ts', 'tsx'],
  watchFolders
}
