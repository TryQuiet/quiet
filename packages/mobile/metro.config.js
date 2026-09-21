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
    resolveRequest: (context, moduleName, platform) => {
      const isNative = platform === 'android' || platform === 'ios'
      const isSagaImport =
        moduleName === 'redux-saga' || moduleName.startsWith('redux-saga/') || moduleName.startsWith('@redux-saga/')

      // Saga's Node ESM proxy unwraps a CJS default twice under Metro, leaving
      // createSagaMiddleware undefined. Retain its working native CJS entry.
      if (isNative && isSagaImport) {
        return context.resolveRequest({ ...context, unstable_enablePackageExports: false }, moduleName, platform)
      }

      const isEmotionPackage = name => name === 'emotion-theming' || name?.startsWith('@emotion/')
      const isEmotionImport =
        isEmotionPackage(moduleName) ||
        ((moduleName.startsWith('.') || path.isAbsolute(moduleName)) &&
          isEmotionPackage(context.getPackageForModule(context.originModulePath)?.packageJson.name))

      // RN 0.79+ defines HTMLElement without document, so Emotion 10 mistakes
      // native for a browser. Its default bundles safely check for document.
      // Include relative imports because Metro applies browser aliases there too.
      if (isNative && isEmotionImport) {
        return context.resolveRequest(
          { ...context, mainFields: context.mainFields.filter(field => field !== 'browser') },
          moduleName,
          platform
        )
      }

      return context.resolveRequest(context, moduleName, platform)
    },
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
