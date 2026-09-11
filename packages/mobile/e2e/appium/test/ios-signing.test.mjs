import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { inspectIosProviderEntitlements } from '../config.mjs'

test('real simulator signatures retain APNs and shared storage, and reject missing capabilities', { skip: process.platform !== 'darwin' }, t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiet-notification-signing-'))
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  const app = path.join(root, 'Quiet.app')
  const extension = path.join(app, 'PlugIns/QuietNotificationServiceExtension.appex')
  const tor = path.join(app, 'Frameworks/Tor.framework')
  fs.mkdirSync(extension, { recursive: true })
  fs.mkdirSync(tor, { recursive: true })
  function plist(filename, value) {
    fs.writeFileSync(filename, JSON.stringify(value))
    execFileSync('/usr/bin/plutil', ['-convert', 'binary1', filename])
  }
  const sdk = execFileSync('xcrun', ['--sdk', 'iphonesimulator', '--show-sdk-path'], { encoding: 'utf8' }).trim()
  const executable = path.join(root, 'simulator-executable')
  execFileSync('xcrun', ['clang', '-target', 'arm64-apple-ios17.1-simulator', '-isysroot', sdk, '-x', 'c', '-', '-o', executable], { input: 'int main(void) { return 0; }\n', stdio: ['pipe', 'pipe', 'pipe'] })
  fs.copyFileSync(executable, path.join(app, 'Quiet'))
  fs.copyFileSync(executable, path.join(extension, 'QuietNotificationServiceExtension'))
  execFileSync('xcrun', ['clang', '-target', 'arm64-apple-ios17.1-simulator', '-isysroot', sdk, '-dynamiclib', '-install_name', '@rpath/Tor.framework/Tor', '-x', 'c', '-', '-o', path.join(tor, 'Tor')], { input: 'int fixture(void) { return 0; }\n', stdio: ['pipe', 'pipe', 'pipe'] })
  const common = { CFBundleVersion: '1', CFBundleSupportedPlatforms: ['iPhoneSimulator'], QuietKeychainAccessGroup: 'TESTTEAM01.com.quietmobile' }
  const appInfo = { ...common, CFBundleIdentifier: 'com.quietmobile', CFBundleExecutable: 'Quiet', CFBundlePackageType: 'APPL' }
  const extensionInfo = { ...common, CFBundleIdentifier: 'com.quietmobile.QuietNotificationServiceExtension', CFBundleExecutable: 'QuietNotificationServiceExtension', CFBundlePackageType: 'XPC!' }
  plist(path.join(app, 'Info.plist'), appInfo)
  plist(path.join(extension, 'Info.plist'), extensionInfo)
  plist(path.join(tor, 'Info.plist'), { CFBundleIdentifier: 'org.quiet.signing-fixture.tor', CFBundleExecutable: 'Tor', CFBundlePackageType: 'FMWK', CFBundleVersion: '1' })
  execFileSync('codesign', ['--force', '--sign', '-', tor], { stdio: 'pipe' })
  const torBytes = fs.readFileSync(path.join(tor, 'Tor'))
  assert.throws(() => inspectIosProviderEntitlements(app))
  const checkout = path.join(root, 'checkout')
  for (const relative of ['Quiet/QuietDebug.entitlements', 'QuietNotificationServiceExtension/QuietNotificationServiceExtension.entitlements']) {
    const target = path.join(checkout, 'packages/mobile/ios', relative)
    fs.mkdirSync(path.dirname(target), { recursive: true })
    fs.copyFileSync(path.resolve(import.meta.dirname, '../../../ios', relative), target)
  }
  const script = path.resolve(import.meta.dirname, '../sign-ios-simulator.py')
  const result = JSON.parse(execFileSync('python3', [script, '--checkout', checkout, '--app', app, '--output', path.join(root, 'signing')], { encoding: 'utf8', stdio: 'pipe' }))
  assert.equal(result.appAndExtensionVerified, true)
  assert.deepEqual(inspectIosProviderEntitlements(app), { apsEnvironment: 'development', sharedGroupsMatch: true })
  assert.deepEqual(fs.readFileSync(path.join(tor, 'Tor')), torBytes)

  const entitlements = { 'aps-environment': 'development', 'com.apple.security.application-groups': ['group.com.quietmobile'], 'keychain-access-groups': [common.QuietKeychainAccessGroup] }
  const signingFile = path.join(root, 'entitlements.plist')
  const resign = (bundle, value) => {
    plist(signingFile, value)
    execFileSync('/usr/bin/plutil', ['-convert', 'xml1', signingFile])
    execFileSync('codesign', ['--force', '--sign', '-', '--entitlements', signingFile, bundle], { stdio: 'pipe' })
  }
  const { 'aps-environment': ignored, ...withoutPush } = entitlements
  resign(app, withoutPush)
  assert.throws(() => inspectIosProviderEntitlements(app), /development APNs/)
  resign(app, entitlements)
  resign(extension, { 'keychain-access-groups': [common.QuietKeychainAccessGroup] })
  resign(app, entitlements)
  assert.throws(() => inspectIosProviderEntitlements(app), /shared notification app group/)
  resign(extension, withoutPush)
  plist(path.join(extension, 'Info.plist'), { ...extensionInfo, QuietKeychainAccessGroup: 'OTHERTEAM1.com.quietmobile' })
  resign(extension, withoutPush)
  resign(app, entitlements)
  assert.throws(() => inspectIosProviderEntitlements(app), /same keychain group/)
})
