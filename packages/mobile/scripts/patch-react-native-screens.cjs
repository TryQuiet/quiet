const assert = require('node:assert/strict')
const { createHash } = require('node:crypto')
const { readFileSync } = require('node:fs')
const path = require('node:path')
const { spawnSync } = require('node:child_process')
const manifest = require('../patch/rnscreens/manifest.json')

const patchFile = path.resolve(__dirname, '../patch/rnscreens/android-listener-lifetime.patch')
const packageDirectory = path.resolve(__dirname, '../node_modules/react-native-screens')
const digest = filename => createHash('sha256').update(readFileSync(filename)).digest('hex')

function applyScreensPatch(directory = packageDirectory) {
  const pkg = JSON.parse(readFileSync(path.join(directory, 'package.json'), 'utf8'))
  assert.equal(pkg.version, manifest.version, 'Review/remove the Screens backport when upgrading Screens')
  const matches = state =>
    Object.entries(manifest.files).every(([file, hashes]) => digest(path.join(directory, file)) === hashes[state])
  if (matches('after')) return
  assert.ok(matches('before'), 'Screens native sources changed; refusing to apply a partial or unreviewed backport')
  const args = ['--batch', '--forward', '--fuzz=0', '-p1', '--input', patchFile]
  for (const extra of [['--dry-run'], []]) {
    const result = spawnSync('patch', [...args, ...extra], {
      cwd: directory,
      encoding: 'utf8',
      shell: process.platform === 'win32',
    })
    if (result.error) throw result.error
    assert.equal(result.status, 0, `Screens backport failed: ${result.stdout}\n${result.stderr}`)
  }
  assert.ok(matches('after'), 'Patched Screens sources do not match the reviewed backport')
}

if (require.main === module) applyScreensPatch()
module.exports = { applyScreensPatch, manifest, packageDirectory, patchFile }
