import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { androidSdkTool } = require('../utils/androidQssBuild.cjs')
const { validateQssOnlyBundle, validateDesktopQssOnlyBuild, MARKER } = require('../utils/qssOnlyBuild.cjs')
const { prepareRun, checkLiveFixture, ENDPOINT } = require('../utils/qssCommunity.cjs')

export const sha256 = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex')
export function validateConfig(config) {
  assert(['android', 'ios'].includes(config.platform), 'Select android or ios')
  assert(typeof config.udid === 'string' && config.udid.length > 0, 'Select the exact disposable device UDID')
  assert.equal(config.disposable, true, 'This suite reinstalls Quiet; select a disposable test installation')
  for (const field of ['app', 'desktopBinary']) {
    assert(path.isAbsolute(config[field] || ''), `${field} must be an absolute build path`)
    assert(fs.existsSync(config[field]), `Build ${field} first`)
  }
  assert(/^[a-zA-Z][\w]*(?:\.[\w]+)+$/.test(config.bundleId), 'Provide the installed Quiet application ID')
  for (const key of ['appiumPort', 'adbPort', 'systemPort', 'wdaLocalPort']) {
    if (config[key] !== undefined) assert(Number.isInteger(config[key]) && config[key] > 1023 && config[key] < 65536, `Invalid ${key}`)
  }
  return config
}

export function validateProviderFixture(fixture, platform, fullLoop) {
  const { manifest, result } = fixture
  assert.equal(manifest.endpoint, ENDPOINT)
  assert.equal(manifest.productionQss, false)
  assert.match(manifest.project, /^quiet-qss-e2e-[a-f0-9]+$/)
  assert.equal(result.status, 'passed')
  assert.equal(result.health?.details?.postgres?.status, 'up')
  for (const field of ['testSiteKey', 'missingTokenRejected', 'publicTestTokenVerified']) assert.equal(result.probe?.[field], true)
  assert.deepEqual(result.manifest, manifest, 'Fixture receipt must match this configuration')
  if (fullLoop) {
    assert.equal(manifest.pushNotifications, true, 'Full-loop tests require QPS and real Firebase service accounts; injected/local delivery is not a fallback')
    assert(manifest.pushPlatforms?.includes(platform), `Fixture lacks ${platform} Firebase credentials`)
  } else {
    assert.equal(manifest.pushNotifications, false, 'Use the push-disabled fixture for onboarding smoke')
  }
  return manifest
}

export function inspectIosBuild(config, fullLoop) {
  assert.equal(process.platform, 'darwin', 'iOS Appium requires a Mac with Xcode')
  const plist = name => JSON.parse(execFileSync('/usr/bin/plutil', [
    '-convert', 'json', '-o', '-', path.join(config.app, name),
  ], { encoding: 'utf8' }))
  const info = plist('Info.plist')
  assert.equal(info.CFBundleIdentifier, config.bundleId, 'The iOS app must match the selected application ID')
  const env = plist('Env.plist')
  assert.equal(env.QSS_ENDPOINT, ENDPOINT, 'Rebuild iOS for the loopback QSS fixture')
  assert.equal(env.QSS_ALLOWED, 'true', 'Rebuild iOS with QSS_ALLOWED=true')
  assert.equal(env.QPS_ALLOWED ?? 'false', fullLoop ? 'true' : 'false', 'The iOS push configuration must match this test lane')
  // NodeRunner loads Env.plist into the embedded backend; react-native-config
  // separately compiles the app configuration. Both must target this fixture.
  const executable = path.join(config.app, 'Quiet.debug.dylib')
  const native = fs.readFileSync(fs.existsSync(executable) ? executable : path.join(config.app, info.CFBundleExecutable))
  assert(native.includes(Buffer.from(ENDPOINT)), 'The iOS native configuration lacks the loopback QSS endpoint')
  for (const endpoint of ['wss://qss-dev.quiet-services.app', 'wss://qss-prod.quiet-services.app']) {
    assert(!native.includes(Buffer.from(endpoint)), 'The iOS native configuration contains a remote QSS endpoint')
  }
  let extensionSHA256
  if (fullLoop) {
    const firebase = plist('GoogleService-Info.plist')
    assert(firebase.GOOGLE_APP_ID, 'Rebuild iOS with the test Firebase configuration; an empty plist cannot deliver push')
    assert.equal(firebase.BUNDLE_ID, config.bundleId, 'The iOS Firebase configuration must match this application ID')
    const extension = 'PlugIns/QuietNotificationServiceExtension.appex'
    const extensionInfo = plist(`${extension}/Info.plist`)
    assert.equal(extensionInfo.NSExtension?.NSExtensionPointIdentifier, 'com.apple.usernotifications.service', 'The iOS build must embed its notification service extension')
    assert(extensionInfo.CFBundleIdentifier?.startsWith(`${config.bundleId}.`), 'The notification extension must belong to the selected app')
    const extensionExecutable = path.join(config.app, extension, extensionInfo.CFBundleExecutable)
    const extensionDebugLibrary = `${extensionExecutable}.debug.dylib`
    extensionSHA256 = sha256(fs.existsSync(extensionDebugLibrary) ? extensionDebugLibrary : extensionExecutable)
  }
  const backend = fs.readFileSync(path.join(config.app, 'nodejs-project/bundle.cjs'))
  assert(!backend.includes(Buffer.from(MARKER)), 'The current iOS Appium lane requires the native-Tor backend')
  return { frontendSHA256: sha256(path.join(config.app, 'main.jsbundle')),
    nativeSHA256: createHash('sha256').update(native).digest('hex'),
    backendSHA256: createHash('sha256').update(backend).digest('hex'), backendMode: 'native-tor',
    ...(extensionSHA256 ? { extensionSHA256 } : {}) }
}

export function inspectIosProviderEntitlements(app) {
  return JSON.parse(execFileSync('python3', [
    path.join(import.meta.dirname, 'sign-ios-simulator.py'), '--verify', '--app', app,
  ], { encoding: 'utf8', stdio: 'pipe' }))
}

export async function preflight(fullLoop) {
  const configPath = process.env.QUIET_NOTIFICATION_CONFIG
  assert(configPath && path.isAbsolute(configPath), 'Set QUIET_NOTIFICATION_CONFIG to the private JSON run configuration')
  const config = validateConfig(JSON.parse(fs.readFileSync(configPath, 'utf8')))
  const run = prepareRun(process.env.QUIET_QSS_E2E_RUN_DIR)
  const fixture = validateProviderFixture(run.fixture, config.platform, fullLoop)
  assert.equal(process.env.QUIET_QSS_LOCAL_FIXTURE_OUTPUT, fixture.output, 'Use the prepared local fixture inspector')
  let build
  if (config.platform === 'android') {
    const badging = execFileSync(androidSdkTool('aapt2'), ['dump', 'badging', config.app], { encoding: 'utf8' })
    assert(badging.startsWith(`package: name='${config.bundleId}' `), 'The APK must match the explicitly selected application ID')
    const resources = execFileSync(androidSdkTool('aapt2'), ['dump', 'resources', config.app], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 })
    const value = key => resources.match(new RegExp(`resource 0x[0-9a-f]+ string/${key}\\n\\s+\\(\\) "([^"\\n]*)"`))?.[1]
    assert.equal(value('QSS_ENDPOINT'), ENDPOINT)
    assert.equal(value('QSS_ALLOWED'), 'true')
    if (fullLoop) {
      assert.equal(value('QPS_ALLOWED'), 'true', 'Rebuild the APK with QPS_ALLOWED=true')
      assert(value('google_app_id'), 'Rebuild the APK with the test project google-services.json')
    }
    const backend = execFileSync('unzip', ['-p', config.app, 'assets/nodejs-project/bundle.cjs'], { maxBuffer: 256 * 1024 * 1024 })
    if (backend.includes(Buffer.from(MARKER))) {
      assert.equal(value('QUIET_E2E_QSS_ONLY'), 'true')
      assert.equal(process.env.IS_E2E, 'true')
      build = { ...validateQssOnlyBundle(backend, process.env.QUIET_QSS_ONLY_BUILD_RECEIPT), desktop: validateDesktopQssOnlyBuild(config.desktopBinary, process.env.QUIET_QSS_ONLY_BUILD_RECEIPT) }
    } else build = { backendMode: 'native-tor', backendSHA256: createHash('sha256').update(backend).digest('hex') }
    build.appSHA256 = sha256(config.app)
  } else {
    build = inspectIosBuild(config, fullLoop)
    if (fullLoop) build.entitlements = inspectIosProviderEntitlements(config.app)
  }
  await checkLiveFixture()
  return { config, run, fixture, build }
}
