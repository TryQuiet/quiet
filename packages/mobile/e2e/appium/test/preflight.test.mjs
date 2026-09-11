import test from 'node:test'
import assert from 'node:assert/strict'
import { validateProviderFixture } from '../config.mjs'

function receipt(pushNotifications, pushPlatforms = []) {
  const manifest = { endpoint: 'ws://localhost:3003', productionQss: false, project: 'quiet-qss-e2e-abcdef123456', pushNotifications, pushPlatforms }
  return { manifest, result: { manifest: structuredClone(manifest), status: 'passed', health: { details: { postgres: { status: 'up' } } }, probe: { testSiteKey: true, missingTokenRejected: true, publicTestTokenVerified: true } } }
}
test('full-loop lane fails with the real messaging fixture receipt instead of silently injecting push', () => {
  assert.throws(() => validateProviderFixture(receipt(false), 'android', true), /real Firebase/)
  assert.throws(() => validateProviderFixture(receipt(true, ['ios']), 'android', true), /android Firebase/)
  assert.throws(() => validateProviderFixture(receipt(true, ['android']), 'ios', true), /ios Firebase/)
  assert.doesNotThrow(() => validateProviderFixture(receipt(true, ['android', 'ios']), 'android', true))
})
test('a stale result cannot authorize a newly push-enabled configuration', () => {
  const stale = receipt(false)
  stale.manifest.pushNotifications = true
  stale.manifest.pushPlatforms = ['android']
  assert.throws(() => validateProviderFixture(stale, 'android', true), /receipt/)
})
test('onboarding smoke refuses provider credentials and never substitutes for the full-loop lane', () => {
  assert.doesNotThrow(() => validateProviderFixture(receipt(false), 'android', false))
  assert.throws(() => validateProviderFixture(receipt(true, ['android']), 'android', false), /push-disabled/)
})

test('iOS inspects binary bundle plists and refuses stale native or extension configuration', { skip: process.platform !== 'darwin' }, async t => {
  const fs = await import('node:fs')
  const os = await import('node:os')
  const path = await import('node:path')
  const { execFileSync } = await import('node:child_process')
  const { inspectIosBuild } = await import('../config.mjs')
  const app = fs.mkdtempSync(path.join(os.tmpdir(), 'quiet-ios-artifact-'))
  t.after(() => fs.rmSync(app, { recursive: true, force: true }))
  const config = { app, bundleId: 'org.quiet.notificationtest' }
  function plist(name, value) {
    const filename = path.join(app, name)
    fs.writeFileSync(filename, JSON.stringify(value))
    execFileSync('/usr/bin/plutil', ['-convert', 'binary1', filename])
  }
  const env = { QSS_ENDPOINT: 'ws://localhost:3003', QSS_ALLOWED: 'true', QPS_ALLOWED: 'false' }
  plist('Info.plist', { CFBundleIdentifier: config.bundleId, CFBundleExecutable: 'Quiet' })
  plist('Env.plist', env)
  plist('GoogleService-Info.plist', {})
  fs.writeFileSync(path.join(app, 'Quiet.debug.dylib'), env.QSS_ENDPOINT)
  fs.writeFileSync(path.join(app, 'main.jsbundle'), 'frontend fixture')
  fs.mkdirSync(path.join(app, 'nodejs-project'))
  fs.writeFileSync(path.join(app, 'nodejs-project/bundle.cjs'), 'backend fixture')
  const result = inspectIosBuild(config, false)
  assert.match(result.nativeSHA256, /^[a-f0-9]{64}$/)
  assert.match(result.backendSHA256, /^[a-f0-9]{64}$/)
  assert.equal(result.backendMode, 'native-tor')

  plist('Env.plist', { ...env, QSS_ENDPOINT: 'wss://qss-dev.quiet-services.app' })
  assert.throws(() => inspectIosBuild(config, false), /loopback QSS fixture/)
  plist('Env.plist', env)
  fs.writeFileSync(path.join(app, 'Quiet.debug.dylib'), 'wss://qss-dev.quiet-services.app')
  assert.throws(() => inspectIosBuild(config, false), /native configuration lacks/)
  fs.writeFileSync(path.join(app, 'Quiet.debug.dylib'), env.QSS_ENDPOINT)
  plist('Env.plist', { ...env, QSS_ALLOWED: 'false' })
  assert.throws(() => inspectIosBuild(config, false), /QSS_ALLOWED=true/)
  const { QPS_ALLOWED, ...defaultPushDisabled } = env
  plist('Env.plist', defaultPushDisabled)
  assert.doesNotThrow(() => inspectIosBuild(config, false))
  assert.throws(() => inspectIosBuild(config, true), /push configuration/)
  plist('Env.plist', { ...env, QPS_ALLOWED: 'true' })
  assert.throws(() => inspectIosBuild(config, true), /empty plist cannot deliver push/)
  plist('GoogleService-Info.plist', { GOOGLE_APP_ID: 'test-id', BUNDLE_ID: 'org.quiet.other' })
  assert.throws(() => inspectIosBuild(config, true), /Firebase configuration must match/)
  plist('GoogleService-Info.plist', { GOOGLE_APP_ID: 'test-id', BUNDLE_ID: config.bundleId })
  const extension = 'PlugIns/QuietNotificationServiceExtension.appex'
  fs.mkdirSync(path.join(app, extension), { recursive: true })
  const extensionInfo = { CFBundleIdentifier: `${config.bundleId}.QuietNotificationServiceExtension`, CFBundleExecutable: 'QuietNotificationServiceExtension', NSExtension: { NSExtensionPointIdentifier: 'com.apple.usernotifications.service' } }
  plist(`${extension}/Info.plist`, extensionInfo)
  fs.writeFileSync(path.join(app, extension, extensionInfo.CFBundleExecutable), 'native extension fixture')
  const executableHash = inspectIosBuild(config, true).extensionSHA256
  assert.match(executableHash, /^[a-f0-9]{64}$/)
  fs.writeFileSync(path.join(app, extension, `${extensionInfo.CFBundleExecutable}.debug.dylib`), 'debug extension implementation')
  const { createHash } = await import('node:crypto')
  const implementationHash = createHash('sha256').update('debug extension implementation').digest('hex')
  assert.notEqual(implementationHash, executableHash)
  assert.equal(inspectIosBuild(config, true).extensionSHA256, implementationHash)
  plist(`${extension}/Info.plist`, { ...extensionInfo, NSExtension: {} })
  assert.throws(() => inspectIosBuild(config, true), /notification service extension/)
})
