// #3646 made every packaging script clear `dist/` first, which put `rimraf` on the critical path
// of every release build. It was never declared as a dependency: it resolved only because some
// transitive dependency happened to hoist it to the top of node_modules, so a dependency bump
// elsewhere could have broken packaging with no change to this package at all.
//
// These tests fail if the declaration is dropped again, if it drifts from the version that
// actually resolves, or if a packaging script stops clearing `dist/`.
const assert = require('node:assert/strict')
const { test } = require('node:test')
const fs = require('node:fs')
const path = require('node:path')
const { scripts, devDependencies, build } = require('../package.json')

const packagingScripts = Object.entries(scripts).filter(([, body]) => body.includes('electron-builder'))

test('the packaging scripts are discoverable', () => {
  assert.ok(packagingScripts.length >= 5, `expected the electron-builder scripts, found ${packagingScripts.length}`)
})

test('every packaging script clears dist/ before it builds', () => {
  for (const [name, body] of packagingScripts) {
    assert.match(body, /^npm run rmDist &&/, `${name} must start by clearing dist/`)
  }
})

test('clearing dist/ is what invokes rimraf', () => {
  assert.match(scripts.rmDist, /(^|\s)rimraf(\s|$)/, 'rmDist must invoke rimraf')
})

test('rimraf is declared, not inherited from another package hoisting it', () => {
  assert.ok(
    devDependencies.rimraf,
    'rimraf runs in every packaging script, so it must be declared in devDependencies'
  )
})

test('the declared rimraf is the one that resolves', () => {
  const declared = devDependencies.rimraf
  const installed = require('rimraf/package.json').version
  if (/^\d/.test(declared)) {
    assert.equal(installed, declared, 'the declared rimraf version must match the installed one')
  } else {
    assert.ok(installed, 'rimraf must resolve for rmDist to run')
  }
})

// #3516 opens the camera to scan a QR code, which macOS gates twice at packaging time.
// `NSCameraUsageDescription` is the sentence the system permission prompt shows; without it in
// `mac.extendInfo` the packaged app inherits the placeholder string Electron's own Info.plist
// ships ("This app needs access to the camera"). `com.apple.security.device.camera` is what the
// hardened runtime the release build is signed with needs to reach the camera at all, and neither
// this app's entitlements file nor electron-builder's default template carries it unless it is
// written down. Both live in the packaging config, out of reach of every test the app itself
// runs, so these are what notice either going missing: the alternative is finding out from a
// packaged, signed build on a Mac.

const desktopDir = path.join(__dirname, '..')

/** Reads a flat `<key>x</key><true/>` entitlements plist without pulling in a plist parser. */
const readEntitlements = relativePath => {
  const file = path.join(desktopDir, relativePath)
  assert.ok(fs.existsSync(file), `${relativePath} is referenced by the mac build but does not exist`)
  const xml = fs.readFileSync(file, 'utf8').replace(/<!--[\s\S]*?-->/g, '')
  const granted = new Set()
  const entry = /<key>([^<]+)<\/key>\s*<(true|false)\s*\/>/g
  for (const [, key, value] of xml.matchAll(entry)) {
    if (value === 'true') granted.add(key)
  }
  return granted
}

test('the mac build declares why it wants the camera', () => {
  const description = build.mac.extendInfo?.NSCameraUsageDescription
  assert.ok(
    typeof description === 'string' && description.trim().length > 0,
    'mac.extendInfo.NSCameraUsageDescription must be set, or the system prompt falls back to Electron placeholder copy'
  )
  assert.match(description, /camera/i, 'the system prompt shows this string, so it must say what the camera is for')
})

test('the mac build writes no usage string for a device the app never opens', () => {
  // The permission handlers in src/main/cameraPermission.ts refuse audio outright, so the
  // app has no microphone prompt to word. Electron's own Info.plist still supplies a placeholder
  // one; this only keeps the build from adding a second, more convincing one.
  assert.equal(
    build.mac.extendInfo?.NSMicrophoneUsageDescription,
    undefined,
    'the scanner requests video only, so no microphone usage string belongs in the mac build'
  )
})

test('the hardened runtime is granted the camera it is signed with', () => {
  assert.equal(build.mac.hardenedRuntime, true, 'this test exists because the mac build hardens the runtime')
  for (const key of ['entitlements', 'entitlementsInherit']) {
    const relativePath = build.mac[key]
    assert.ok(relativePath, `mac.${key} must point at the entitlements plist`)
    assert.ok(
      readEntitlements(relativePath).has('com.apple.security.device.camera'),
      `${relativePath} (mac.${key}) must grant com.apple.security.device.camera, or the signed app cannot open the camera`
    )
  }
})
