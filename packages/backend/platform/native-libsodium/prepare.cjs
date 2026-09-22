'use strict'
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const {build, hash, SHA256, VERSION} = require('./build.cjs')
function verify(directory, target) {
  const manifest = JSON.parse(fs.readFileSync(path.join(directory, 'build-manifest.json')))
  assert.equal(manifest.libsodium, VERSION)
  assert.equal(manifest.sourceSha256, SHA256)
  assert.equal(manifest.bindingSha256, hash(fs.readFileSync(path.join(__dirname, 'binding.c'))), 'Binding changed: rebuild native sodium')
  assert.equal(manifest.builderSha256, hash(fs.readFileSync(path.join(__dirname, 'build.cjs'))), 'Builder changed: rebuild native sodium')
  for (const sdk of target === 'host' ? ['host'] : ['iphoneos', 'iphonesimulator']) {
    const binary = sdk === 'host' ? path.join(directory, 'quiet_sodium.node') : path.join(directory, 'QuietSodium.xcframework', sdk === 'iphoneos' ? 'ios-arm64' : 'ios-arm64-simulator', 'QuietSodium.framework/QuietSodium')
    assert.equal(hash(fs.readFileSync(binary)), manifest.artifacts[sdk].sha256, 'Native sodium artifact checksum')
  }
  return manifest
}
async function prepare(target, directory) {
  if (!fs.existsSync(directory)) await build(target, directory)
  return verify(directory, target)
}
if (require.main === module) {
  const [flag, output] = process.argv.slice(2)
  if (!['--host', '--ios'].includes(flag) || !output) throw new Error('Usage: node prepare.cjs --host|--ios OUTPUT_DIRECTORY')
  prepare(flag.slice(2), path.resolve(output)).catch(error => { console.error(error.message); process.exitCode = 1 })
}
module.exports = {prepare, verify}
