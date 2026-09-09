// Run from packages/mobile: node --test scripts/metro-resolution.test.cjs
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const vm = require('node:vm')
const babel = require('@babel/core')
const { resolve } = require('metro-resolver')
const config = require('../metro.config')

const projectRoot = path.resolve(__dirname, '..')
const originModulePath = path.join(projectRoot, 'src/store/store.ts')

function fileSystemLookup(filePath) {
  try {
    const stat = fs.statSync(filePath)
    return { exists: true, type: stat.isDirectory() ? 'd' : 'f', realPath: fs.realpathSync(filePath) }
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') return { exists: false }
    throw error
  }
}

function getPackage(packagePath) {
  if (!fileSystemLookup(packagePath).exists) return null
  return JSON.parse(fs.readFileSync(packagePath, 'utf8'))
}

function getPackageForModule(modulePath) {
  let directory = fileSystemLookup(modulePath).type === 'd' ? modulePath : path.dirname(modulePath)
  while (path.basename(directory) !== 'node_modules') {
    const packageJson = getPackage(path.join(directory, 'package.json'))
    if (packageJson) {
      return { packageJson, rootPath: directory, packageRelativePath: path.relative(directory, modulePath) }
    }
    const parent = path.dirname(directory)
    if (parent === directory) return null
    directory = parent
  }
  return null
}

// Supply Metro's filesystem interface; package selection and browser/exports
// interpretation are performed by the installed resolver, not mocked here.
function resolveModule(moduleName, platform, options = {}) {
  const resolver = config.resolver
  return resolve(
    {
      allowHaste: false,
      assetExts: new Set(resolver.assetExts),
      customResolverOptions: {},
      dev: true,
      disableHierarchicalLookup: resolver.disableHierarchicalLookup,
      doesFileExist: filePath => fileSystemLookup(filePath).type === 'f',
      extraNodeModules: resolver.extraNodeModules,
      fileSystemLookup,
      getPackage,
      getPackageForModule,
      isESMImport: options.isESMImport ?? true,
      mainFields: resolver.resolverMainFields,
      nodeModulesPaths: resolver.nodeModulesPaths,
      originModulePath: options.originModulePath ?? originModulePath,
      preferNativePlatform: true,
      redirectModulePath: modulePath => modulePath,
      resolveAsset: () => null,
      resolveHasteModule: () => null,
      resolveHastePackage: () => null,
      resolveRequest: options.baseline ? undefined : resolver.resolveRequest,
      sourceExts: resolver.sourceExts,
      unstable_conditionNames: resolver.unstable_conditionNames,
      unstable_conditionsByPlatform: resolver.unstable_conditionsByPlatform,
      unstable_enablePackageExports: resolver.unstable_enablePackageExports,
      unstable_logWarning: message => assert.fail(message),
    },
    moduleName,
    platform
  )
}

function resolveFile(moduleName, platform, options) {
  const resolution = resolveModule(moduleName, platform, options)
  assert.equal(resolution.type, 'sourceFile')
  return resolution.filePath
}

// Execute the real package graph in a native-like realm. ESM goes through the
// same Babel preset as the app; every nested import still uses Metro resolution.
// This catches an undefined default export even when bundling itself succeeds.
function createPackageLoader(platform, baseline = false) {
  const modules = new Map()
  const realm = vm.createContext({
    console,
    setTimeout,
    clearTimeout,
    process: { env: { NODE_ENV: 'development' } },
    HTMLElement: class HTMLElement {},
  })
  realm.global = realm

  function load(moduleName, importer = originModulePath, isESMImport = true) {
    const filePath = resolveFile(moduleName, platform, { originModulePath: importer, isESMImport, baseline })
    if (modules.has(filePath)) return modules.get(filePath).exports
    const module = { exports: {} }
    modules.set(filePath, module)
    if (filePath.endsWith('.json')) {
      module.exports = getPackage(filePath)
      return module.exports
    }

    const source = fs.readFileSync(filePath, 'utf8')
    const ast = babel.parseSync(source, { babelrc: false, configFile: false, sourceType: 'unambiguous' })
    const imports = new Set(
      ast.program.body
        .filter(node => ['ImportDeclaration', 'ExportNamedDeclaration', 'ExportAllDeclaration'].includes(node.type))
        .flatMap(node => (node.source ? [node.source.value] : []))
    )
    const code =
      ast.program.sourceType === 'module'
        ? babel.transformFromAstSync(ast, source, {
            babelrc: false,
            configFile: false,
            presets: [require.resolve('@react-native/babel-preset')],
            filename: filePath,
          }).code
        : source
    const execute = vm.runInContext(`(function(require, module, exports) {\n${code}\n})`, realm, { filename: filePath })
    execute(name => load(name, filePath, imports.has(name)), module, module.exports)
    return module.exports
  }

  return load
}

for (const platform of ['android', 'ios']) {
  test(`${platform}: Emotion entries and internal aliases select native-safe bundles`, () => {
    for (const name of ['emotion-theming', '@emotion/core', '@emotion/cache', '@emotion/native']) {
      const baseline = resolveFile(name, platform, { baseline: true })
      const fixed = resolveFile(name, platform)
      assert.match(baseline, /\.browser\.cjs\.js$/)
      assert.doesNotMatch(fixed, /\.browser\./)

      const relative = `./${path.basename(fixed)}`
      assert.equal(resolveFile(relative, platform, { originModulePath: fixed }), fixed)
      assert.equal(resolveFile(fixed, platform, { originModulePath: fixed }), fixed)
      assert.equal(resolveFile(relative, platform, { originModulePath: fixed, baseline: true }), baseline)
    }
  })

  test(`${platform}: Emotion cache initializes when HTMLElement exists without document`, () => {
    assert.throws(() => createPackageLoader(platform, true)('@emotion/cache').default({ key: 'quiet' }), /document/)
    const cache = createPackageLoader(platform)('@emotion/cache').default({ key: 'quiet' })
    assert.equal(cache.key, 'quiet')
    assert.equal(typeof cache.insert, 'function')
  })

  test(`${platform}: Redux Saga imports expose working middleware and effect subpaths`, async () => {
    assert.match(resolveFile('redux-saga', platform, { baseline: true }), /import-condition-proxy\.mjs$/)
    assert.equal(createPackageLoader(platform, true)('redux-saga').default, undefined)

    const load = createPackageLoader(platform)
    for (const name of ['redux-saga', '@redux-saga/core']) {
      assert.doesNotMatch(resolveFile(name, platform), /import-condition-proxy\.mjs$/)
      assert.equal(typeof load(name).default, 'function')
    }

    const sagaMiddleware = load('redux-saga').default()
    const { createStore, applyMiddleware } = load('redux')
    const store = createStore(
      (state = 0, action) => (action.type === 'INCREMENT' ? state + 1 : state),
      applyMiddleware(sagaMiddleware)
    )
    const { put } = load('redux-saga/effects')
    const { select } = load('@redux-saga/core/effects')
    const task = sagaMiddleware.run(function* () {
      yield put({ type: 'INCREMENT' })
      return yield select(state => state)
    })
    assert.equal(await task.toPromise(), 1)
    assert.equal(store.getState(), 1)
  })
}

test('web keeps Emotion browser aliases and Redux Saga conditional exports', () => {
  const packages = [
    'emotion-theming',
    '@emotion/core',
    '@emotion/cache',
    '@emotion/native',
    'redux-saga',
    '@redux-saga/core',
  ]
  for (const name of packages) {
    assert.equal(resolveFile(name, 'web'), resolveFile(name, 'web', { baseline: true }))
  }
  assert.match(resolveFile('@emotion/cache', 'web'), /\.browser\.cjs\.js$/)
  assert.match(resolveFile('redux-saga', 'web'), /import-condition-proxy\.mjs$/)
})

test('native keeps browser aliases inside unrelated packages', () => {
  for (const platform of ['android', 'ios']) {
    const importer = resolveFile('uuid', platform)
    const options = { originModulePath: importer }
    const resolved = resolveFile('./lib/rng', platform, options)
    assert.equal(resolved, resolveFile('./lib/rng', platform, { ...options, baseline: true }))
    assert.match(resolved, /lib\/rng-browser\.js$/)
  }
})

test('unrelated Babel runtime imports retain their conditional ESM exports on native', () => {
  for (const platform of ['android', 'ios']) {
    const imported = resolveFile('@babel/runtime/helpers/extends', platform)
    assert.equal(imported, resolveFile('@babel/runtime/helpers/extends', platform, { baseline: true }))
    assert.match(imported, /helpers\/esm\/extends\.js$/)
    assert.doesNotMatch(resolveFile('@babel/runtime/helpers/extends', platform, { isESMImport: false }), /\/esm\//)
  }
})
