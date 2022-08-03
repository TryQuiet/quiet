/**
 * Metro configuration for React Native
 * https://github.com/facebook/react-native
 *
 * @format
 */

const blacklist = require('metro-config/src/defaults/exclusionList');

const path = require('path');

 const watchFolders = [
   path.resolve(__dirname, '../identity'),
   path.resolve(__dirname, '../state-manager'),
   path.resolve(__dirname, '../backend'),
   path.resolve(__dirname, '../logger'),
   path.resolve(__dirname, '../testcafe-browser-provider-electron')
 ]

 const extraNodeModules = {
   '@quiet/identity': path.resolve(__dirname, '../identity'),
   '@quiet/state-manager': path.resolve(__dirname, '../state-manager'),
   '@quiet/backend': path.resolve(__dirname, '../backend'),
   '@quiet/logger': path.resolve(__dirname, '../logger'),
   ...require('node-libs-react-native')
 }

module.exports = {
  resolver: {
    blacklistRE: blacklist([
      /..\/state-manager\/lib\/utils\/tests\/.*/,
      /\/nodejs-assets\/.*/,
      /\/android\/.*/,
      /\/ios\/.*/,
    ]),
    sourceExts: ['jsx', 'js', 'ts', 'tsx'],
     extraNodeModules: new Proxy(extraNodeModules, {
       get: (target, name) =>
         //redirects dependencies referenced from common packages to local node_modules
         name in target ? target[name] : path.join(process.cwd(), `node_modules/${name}`)
     })
  },
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
  watchFolders
};
