const assert = require('node:assert/strict')
const { createHash } = require('node:crypto')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { spawnSync } = require('node:child_process')
const { test } = require('node:test')
const { applyScreensPatch, manifest, packageDirectory, patchFile } = require('./patch-react-native-screens.cjs')

test('Screens backport applies to real upstream sources, is repeatable, and rejects drift before mutation', t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'quiet-screens-backport-'))
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }))
  fs.copyFileSync(path.join(packageDirectory, 'package.json'), path.join(directory, 'package.json'))
  for (const file of Object.keys(manifest.files)) {
    fs.mkdirSync(path.dirname(path.join(directory, file)), { recursive: true })
    fs.copyFileSync(path.join(packageDirectory, file), path.join(directory, file))
  }
  const snapshot = () =>
    Object.fromEntries(Object.keys(manifest.files).map(file => [file, fs.readFileSync(path.join(directory, file))]))
  const hashes = () =>
    Object.fromEntries(Object.entries(snapshot()).map(([file, bytes]) => [file, createHash('sha256').update(bytes).digest('hex')]))

  // Installs may already be patched by prepare. Reconstruct and verify the
  // original four npm source files before exercising the real patch command.
  if (Object.entries(manifest.files).every(([file, states]) => hashes()[file] === states.after)) {
    const reversed = spawnSync('patch', ['--batch', '--reverse', '--fuzz=0', '-p1', '--input', patchFile], {
      cwd: directory,
      encoding: 'utf8',
      shell: process.platform === 'win32',
    })
    assert.equal(reversed.status, 0, reversed.stderr)
  }
  assert.deepEqual(hashes(), Object.fromEntries(Object.entries(manifest.files).map(([file, states]) => [file, states.before])))
  applyScreensPatch(directory)
  const patched = snapshot()
  applyScreensPatch(directory)
  assert.deepEqual(snapshot(), patched)

  const changedFile = path.join(directory, Object.keys(manifest.files)[0])
  fs.appendFileSync(changedFile, '\n// unexpected local edit\n')
  const changed = snapshot()
  assert.throws(() => applyScreensPatch(directory), /refusing to apply/)
  assert.deepEqual(snapshot(), changed, 'A rejected patch must preserve every existing source file')

  fs.writeFileSync(path.join(directory, 'package.json'), JSON.stringify({ version: '4.25.0' }))
  assert.throws(() => applyScreensPatch(directory), /Review\/remove/)
  assert.deepEqual(snapshot(), changed)
})
