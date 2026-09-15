'use strict'
const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const {verify, prepare} = require('./native-libsodium/prepare.cjs')
const {build} = require('./native-libsodium/build.cjs')

test('build cache detects a corrupted addon and stale binding provenance', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiet-sodium-cache-'))
  const directory = path.join(root, 'artifact')
  try {
    fs.cpSync(path.join(__dirname, 'native-libsodium/.build/host'), directory, {recursive: true})
    assert.equal(verify(directory, 'host').libsodium, '1.0.19')
    const manifest = path.join(directory, 'build-manifest.json')
    const valid = fs.readFileSync(manifest)
    const changed = JSON.parse(valid)
    changed.bindingSha256 = 'stale'
    fs.writeFileSync(manifest, JSON.stringify(changed))
    await assert.rejects(prepare('host', directory), /Binding changed/)
    fs.writeFileSync(manifest, valid)
    const binary = path.join(directory, 'quiet_sodium.node')
    const bytes = fs.readFileSync(binary)
    bytes[bytes.length - 1] ^= 1
    fs.writeFileSync(binary, bytes)
    await assert.rejects(prepare('host', directory), /artifact checksum/)
    await assert.rejects(build('host', directory), /Output already exists/)
    assert.deepEqual(fs.readFileSync(binary), bytes, 'build must not overwrite an existing artifact')
  } finally {fs.rmSync(root, {recursive: true, force: true})}
})
