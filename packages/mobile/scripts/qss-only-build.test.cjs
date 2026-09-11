const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { createHash } = require('node:crypto')
const { MARKER, validateQssOnlyBundle, validateDesktopQssOnlyBuild } = require('../e2e/utils/qssOnlyBuild.cjs')
const { validateAndroidApkMetadata } = require('../e2e/utils/androidQssBuild.cjs')

const receiptFor = bundle => ({
  version: 1, mode: 'qss-only', marker: MARKER, tor: 'simulated-metadata', p2p: false,
  bundleSHA256: createHash('sha256').update(bundle).digest('hex'),
  replacedModules: ['tor.module.cjs', 'tor.service.cjs', 'libp2p.js'],
})

test('QSS-only evidence requires a matching receipt and rejects the ordinary backend or changed bytes', t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'quiet-qss-only-proof-'))
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }))
  const filename = path.join(directory, 'qss-only-build.json')
  const bundle = Buffer.from(`/* ${MARKER} */\n// compiled test fixture`)
  const receipt = receiptFor(bundle)
  fs.writeFileSync(filename, JSON.stringify(receipt))
  assert.equal(validateQssOnlyBundle(bundle, filename).backendMode, 'qss-only')
  assert.throws(() => validateQssOnlyBundle(bundle, ''), /QUIET_QSS_ONLY_BUILD_RECEIPT/)
  assert.throws(() => validateQssOnlyBundle(Buffer.concat([bundle, Buffer.from('changed')]), filename), /must match/)
  for (const changes of [{ p2p: true }, { tor: 'native' }, { replacedModules: ['tor.service.cjs'] }]) {
    fs.writeFileSync(filename, JSON.stringify({ ...receipt, ...changes }))
    assert.throws(() => validateQssOnlyBundle(bundle, filename), /must match/)
  }
  const normalBundle = Buffer.from('ordinary backend')
  fs.writeFileSync(filename, JSON.stringify(receiptFor(normalBundle)))
  assert.throws(() => validateQssOnlyBundle(normalBundle, filename), /must match/)
})

test('desktop preflight inspects packaged backend bytes inside the actual app archive', async t => {
  const asar = require(require.resolve('asar', { paths: [path.resolve(__dirname, '../../desktop')] }))
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'quiet-qss-only-asar-'))
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }))
  const source = path.join(directory, 'app')
  const modulePath = path.join(source, 'node_modules/backend-bundle')
  fs.mkdirSync(modulePath, { recursive: true })
  const bundle = Buffer.from(`/* ${MARKER} */\n// packaged backend fixture`)
  fs.writeFileSync(path.join(modulePath, 'bundle.cjs'), bundle)
  const receiptPath = path.join(directory, 'qss-only-build.json')
  fs.writeFileSync(receiptPath, JSON.stringify(receiptFor(bundle)))
  const binary = process.platform === 'darwin' ? path.join(directory, 'Quiet.app/Contents/MacOS/Quiet') : path.join(directory, 'linux-unpacked/quiet')
  const resources = process.platform === 'darwin' ? path.resolve(path.dirname(binary), '../Resources') : path.join(path.dirname(binary), 'resources')
  fs.mkdirSync(resources, { recursive: true })
  await asar.createPackage(source, path.join(resources, 'app.asar'))
  assert.equal(validateDesktopQssOnlyBuild(binary, receiptPath).backendSHA256, receiptFor(bundle).bundleSHA256)
  fs.writeFileSync(path.join(modulePath, 'bundle.cjs'), 'normal stale backend')
  await asar.createPackage(source, path.join(resources, 'app.asar'))
  asar.uncacheAll()
  assert.throws(() => validateDesktopQssOnlyBuild(binary, receiptPath), /must match/)
})

test('Android preflight distinguishes explicit QSS-only APKs from normal native-Tor APKs', () => {
  const resources = fields => Object.entries(fields).map(([key, value], index) => `    resource 0x7f10000${index} string/${key}\n      () "${value}"\n`).join('')
  const fields = { QSS_ENDPOINT: 'ws://localhost:3003', QSS_ALLOWED: 'true', SHOULD_RUN_BACKEND_WORKER: 'true', NODE_ENV: 'development' }
  const metadata = {
    badging: "package: name='com.quietmobile.debug' versionCode='634'\napplication-debuggable",
    resources: resources(fields),
    instrumentation: 'package="com.quietmobile.debug.test"\nandroid:targetPackage(0x100)="com.quietmobile.debug"\nandroid:name(0x101)="androidx.test.runner.AndroidJUnitRunner"',
    entries: ['assets/index.android.bundle', 'assets/nodejs-project/bundle.cjs', 'lib/arm64-v8a/libnode.so', 'lib/arm64-v8a/libtor.so'].join('\n'),
  }
  assert.doesNotThrow(() => validateAndroidApkMetadata(metadata))
  assert.throws(() => validateAndroidApkMetadata(metadata, { qssOnly: true }), /QUIET_E2E_QSS_ONLY/)
  metadata.resources = resources({ ...fields, QUIET_E2E_QSS_ONLY: 'true', IS_E2E: 'true' })
  assert.doesNotThrow(() => validateAndroidApkMetadata(metadata, { qssOnly: true }))
  assert.throws(() => validateAndroidApkMetadata(metadata), /explicit QSS-only/)
})
