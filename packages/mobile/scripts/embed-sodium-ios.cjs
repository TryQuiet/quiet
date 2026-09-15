'use strict'
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const {execFileSync} = require('node:child_process')
const {prepare} = require('../../backend/platform/native-libsodium/prepare.cjs')
const {hash} = require('../../backend/platform/native-libsodium/build.cjs')
async function embed(env = process.env) {
  assert.ok(['iphoneos', 'iphonesimulator'].includes(env.PLATFORM_NAME), 'Expected an iOS SDK')
  assert.equal(env.ARCHS?.trim(), 'arm64', 'Quiet Node 24 and native sodium support ARM64 iOS only')
  for (const name of ['DERIVED_FILE_DIR', 'TARGET_BUILD_DIR', 'FRAMEWORKS_FOLDER_PATH']) assert.ok(env[name], `Missing ${name}`)
  const source = path.resolve(__dirname, '../../backend/platform/native-libsodium')
  const key = hash(Buffer.concat(['binding.c', 'build.cjs'].map(name => fs.readFileSync(path.join(source, name))))).slice(0, 16)
  const artifact = path.join(env.DERIVED_FILE_DIR, 'quiet-sodium', key)
  await prepare('ios', artifact)
  const slice = env.PLATFORM_NAME === 'iphoneos' ? 'ios-arm64' : 'ios-arm64-simulator'
  const framework = path.join(artifact, 'QuietSodium.xcframework', slice, 'QuietSodium.framework')
  const destination = path.join(env.TARGET_BUILD_DIR, env.FRAMEWORKS_FOLDER_PATH, 'QuietSodium.framework')
  fs.mkdirSync(path.dirname(destination), {recursive: true})
  fs.cpSync(framework, destination, {recursive: true})
  fs.copyFileSync(path.join(artifact, 'LICENSE.libsodium'), path.join(destination, 'LICENSE.libsodium'))
  if (env.CODE_SIGNING_ALLOWED !== 'NO' || env.PLATFORM_NAME === 'iphonesimulator') {
    const identity = env.CODE_SIGNING_ALLOWED === 'NO' ? '-' : env.EXPANDED_CODE_SIGN_IDENTITY
    assert.ok(identity, 'Missing native framework signing identity')
    execFileSync('/usr/bin/codesign', ['--force', '--sign', identity, '--timestamp=none', destination], {stdio: 'inherit'})
  }
  return destination
}
if (require.main === module) embed().catch(error => {console.error(error); process.exitCode = 1})
module.exports = {embed}
