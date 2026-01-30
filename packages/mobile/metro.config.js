const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */

const path = require('path')

const watchFolders = [
  path.resolve(__dirname, '../identity'),
  path.resolve(__dirname, '../state-manager'),
  path.resolve(__dirname, '../backend'),
  path.resolve(__dirname, '../logger'),
  path.resolve(__dirname, '../common'),
  path.resolve(__dirname, '../types'),
  path.resolve(__dirname, '../eslint-config-custom'),
]

// Find the project and workspace directories
const projectRoot = __dirname;
// This can be replaced with `find-yarn-workspace-root`
const monorepoRoot = path.resolve(projectRoot, '../..');


const extraNodeModules = {
  '@quiet/identity': path.resolve(__dirname, '../identity'),
  '@quiet/state-manager': path.resolve(__dirname, '../state-manager'),
  '@quiet/backend': path.resolve(__dirname, '../backend'),
  '@quiet/logger': path.resolve(__dirname, '../logger'),
  '@quiet/common': path.resolve(__dirname, '../common'),
  '@quiet/types': path.resolve(__dirname, '../types'),
  '@quiet/eslint-config': path.resolve(__dirname, '../eslint-config-custom'),
  ...require('node-libs-react-native'),
}

const config = {
  resolver: {
    extraNodeModules: new Proxy(extraNodeModules, {
      get: (target, name) =>
        // redirects dependencies referenced from common packages to local node_modules
        name in target ? target[name] : path.join(process.cwd(), `node_modules/${name}`),
    }),
  },
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: false,
      },
    }),
  },
  watchFolders: watchFolders
}

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
