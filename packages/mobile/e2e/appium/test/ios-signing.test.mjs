import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { inspectIosProviderEntitlements } from '../config.mjs'

test('real linked simulator capabilities survive signing; device signature placement and missing capabilities fail', { skip: process.platform !== 'darwin' }, t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiet-notification-signing-'))
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  const app = path.join(root, 'Quiet.app')
  const extension = path.join(app, 'PlugIns/QuietNotificationServiceExtension.appex')
  const tor = path.join(app, 'Frameworks/Tor.framework')
  fs.mkdirSync(extension, { recursive: true })
  fs.mkdirSync(tor, { recursive: true })
  const command = (program, args, input) => execFileSync(program, args, { input, encoding: 'utf8', stdio: 'pipe' })
  function plist(filename, value) {
    fs.writeFileSync(filename, JSON.stringify(value))
    command('/usr/bin/plutil', ['-convert', 'binary1', filename])
  }
  const checkout = path.join(root, 'checkout')
  for (const relative of ['Quiet.xcconfig', 'Quiet/QuietDebug.entitlements', 'QuietNotificationServiceExtension/QuietNotificationServiceExtension.entitlements']) {
    const target = path.join(checkout, 'packages/mobile/ios', relative)
    fs.mkdirSync(path.dirname(target), { recursive: true })
    fs.copyFileSync(path.resolve(import.meta.dirname, '../../../ios', relative), target)
  }
  const script = path.resolve(import.meta.dirname, '../sign-ios-simulator.py')
  const prepared = path.join(root, 'prepared')
  command('python3', [script, '--prepare', '--checkout', checkout, '--output', prepared])
  const configFile = path.join(checkout, 'packages/mobile/ios/LocalDev.xcconfig')
  const originalConfig = fs.readFileSync(configFile)
  assert.throws(() => command('python3', [script, '--prepare', '--checkout', checkout, '--output', path.join(root, 'second')]), /existing local iOS configuration/)
  assert.deepEqual(fs.readFileSync(configFile), originalConfig)
  const capabilities = target => JSON.parse(command('/usr/bin/plutil', ['-convert', 'json', '-o', '-', path.join(prepared, target + '.xcent')]))
  const appCapabilities = capabilities('Quiet')
  const extensionCapabilities = capabilities('QuietNotificationServiceExtension')
  const sdk = command('xcrun', ['--sdk', 'iphonesimulator', '--show-sdk-path']).trim()
  const compile = (target, executable) => command('xcrun', [
    'clang', '-target', 'arm64-apple-ios17.1-simulator', '-isysroot', sdk, '-x', 'c', '-', '-o', executable,
    '-Xlinker', '-sectcreate', '-Xlinker', '__TEXT', '-Xlinker', '__entitlements', '-Xlinker', path.join(prepared, target + '.xcent'),
    '-Xlinker', '-sectcreate', '-Xlinker', '__TEXT', '-Xlinker', '__ents_der', '-Xlinker', path.join(prepared, target + '.xcent.der'),
  ], 'int main(void) { return 0; }\n')
  const appExecutable = path.join(app, 'Quiet')
  const extensionExecutable = path.join(extension, 'QuietNotificationServiceExtension')
  compile('Quiet', appExecutable)
  compile('QuietNotificationServiceExtension', extensionExecutable)
  command('xcrun', ['clang', '-target', 'arm64-apple-ios17.1-simulator', '-isysroot', sdk, '-dynamiclib', '-install_name', '@rpath/Tor.framework/Tor', '-x', 'c', '-', '-o', path.join(tor, 'Tor')], 'int fixture(void) { return 0; }\n')
  const common = { CFBundleVersion: '1', CFBundleSupportedPlatforms: ['iPhoneSimulator'], QuietKeychainAccessGroup: appCapabilities['keychain-access-groups'][0] }
  const appInfo = { ...common, CFBundleIdentifier: 'com.quietmobile', CFBundleExecutable: 'Quiet', CFBundlePackageType: 'APPL' }
  const extensionInfo = { ...common, CFBundleIdentifier: 'com.quietmobile.QuietNotificationServiceExtension', CFBundleExecutable: 'QuietNotificationServiceExtension', CFBundlePackageType: 'XPC!' }
  plist(path.join(app, 'Info.plist'), appInfo)
  plist(path.join(extension, 'Info.plist'), extensionInfo)
  plist(path.join(tor, 'Info.plist'), { CFBundleIdentifier: 'org.quiet.signing-fixture.tor', CFBundleExecutable: 'Tor', CFBundlePackageType: 'FMWK', CFBundleVersion: '1' })
  command('codesign', ['--force', '--sign', '-', tor])
  const torBytes = fs.readFileSync(path.join(tor, 'Tor'))
  let sequence = 0
  const sign = () => JSON.parse(command('python3', [script, '--app', app, '--output', path.join(root, 'signing-' + sequence++)]))
  assert.equal(sign().appAndExtensionVerified, true)
  assert.deepEqual(inspectIosProviderEntitlements(app), { apsEnvironment: 'development', sharedGroupsMatch: true, entitlementLocation: '__TEXT' })
  assert.deepEqual(fs.readFileSync(path.join(tor, 'Tor')), torBytes)
  // This signed cleanly in the previous implementation but macOS denied launch.
  command('codesign', ['--force', '--sign', '-', '--entitlements', path.join(prepared, 'Quiet.xcent'), app])
  assert.throws(() => inspectIosProviderEntitlements(app), /not the host code signature/)
  sign()
  const changeCapabilities = (target, value, executable) => {
    const filename = path.join(prepared, target + '.xcent')
    fs.writeFileSync(filename, JSON.stringify(value))
    command('/usr/bin/plutil', ['-convert', 'xml1', filename])
    command('/usr/bin/derq', ['query', '-f', 'xml', '-i', filename, '-o', filename + '.der', '--raw'])
    compile(target, executable)
  }
  const { 'aps-environment': ignored, ...withoutPush } = appCapabilities
  const originalDer = fs.readFileSync(path.join(prepared, 'Quiet.xcent.der'))
  changeCapabilities('Quiet', withoutPush, appExecutable)
  assert.throws(sign, /development APNs/)
  fs.writeFileSync(path.join(prepared, 'Quiet.xcent.der'), originalDer)
  compile('Quiet', appExecutable)
  assert.throws(sign, /XML and DER simulator entitlements must match/)
  changeCapabilities('Quiet', appCapabilities, appExecutable)
  changeCapabilities('QuietNotificationServiceExtension', { ...extensionCapabilities, 'com.apple.security.application-groups': [] }, extensionExecutable)
  assert.throws(sign, /shared notification app group/)
  changeCapabilities('QuietNotificationServiceExtension', extensionCapabilities, extensionExecutable)
  plist(path.join(extension, 'Info.plist'), { ...extensionInfo, QuietKeychainAccessGroup: 'OTHERTEAM1.com.quietmobile' })
  assert.throws(sign, /same keychain group/)
})
