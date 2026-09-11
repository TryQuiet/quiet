const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { spawnSync } = require('node:child_process')
const { test } = require('node:test')
const { build, devDependencies } = require('../package.json')

test('rebuild MessagePack native extraction for Electron and round-trip Unicode messages', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'quiet-native-rebuild-'))
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }))
  const msgpackr = path.dirname(
    path.dirname(require.resolve('msgpackr', { paths: [path.resolve(__dirname, '../../types')] }))
  )
  const source = path.dirname(require.resolve('msgpackr-extract/package.json', { paths: [msgpackr] }))
  const addon = path.join(directory, 'node_modules/msgpackr-extract')
  fs.mkdirSync(addon, { recursive: true })
  // Copy only source inputs: this test must compile, not reuse a native binary
  // or an Electron rebuild stamp from the developer's node_modules/cache.
  for (const name of ['package.json', 'binding.gyp', 'src']) {
    fs.cpSync(path.join(source, name), path.join(addon, name), { recursive: true })
  }
  fs.writeFileSync(
    path.join(directory, 'package.json'),
    JSON.stringify({
      name: 'quiet-native-rebuild-fixture',
      version: '1.0.0',
      dependencies: { 'msgpackr-extract': JSON.parse(fs.readFileSync(path.join(source, 'package.json'))).version },
    })
  )
  const previous = process.env.ENABLE_V8_FUNCTIONS
  t.after(() => {
    if (previous === undefined) delete process.env.ENABLE_V8_FUNCTIONS
    else process.env.ENABLE_V8_FUNCTIONS = previous
  })
  process.env.ENABLE_V8_FUNCTIONS = 'true'
  assert.equal(
    await require(path.resolve(__dirname, '..', build.beforeBuild)).default(),
    true,
    'the hook must allow electron-builder to rebuild native dependencies'
  )
  const { rebuild } = await import('@electron/rebuild')
  await rebuild({
    buildPath: directory,
    electronVersion: devDependencies.electron,
    arch: process.arch,
    force: true,
    buildFromSource: true,
    onlyModules: ['msgpackr-extract'],
  })
  const binary = path.join(addon, 'build/Release/extract.node')
  assert.ok(fs.statSync(binary).size > 0)
  const fixture = path.join(directory, 'roundtrip.cjs')
  fs.writeFileSync(
    fixture,
    `
    const assert = require('node:assert/strict');
    const extractor = require(${JSON.stringify(binary)});
    assert.equal(typeof extractor.extractStrings, 'function');
    let calls = 0;
    (async () => {
      const { Packr } = await import(${JSON.stringify(pathToFileURL(path.join(msgpackr, 'pack.js')).href)});
      const decoder = await import(${JSON.stringify(pathToFileURL(path.join(msgpackr, 'unpack.js')).href)});
      decoder.setExtractor((...args) => { calls++; return extractor.extractStrings(...args); });
      const packr = new Packr({ useRecords: false });
      const messages = Array.from({ length: 600 }, (_, i) => ({
        author: 'alice-' + i, text: 'Hello 🌍 — 你好 — café ' + 'message '.repeat(i % 40),
        reactions: ['👍', 'thanks', 'ありがとう'], channel: 'general',
      }));
      assert.deepEqual(decoder.unpack(packr.pack(messages)), messages);
      assert.ok(calls > 0, 'must exercise the newly compiled native extraction');
      console.log('Native MessagePack round-trip passed');
    })().catch(error => { console.error(error); process.exitCode = 1; });
  `
  )
  const env = { ...process.env, ELECTRON_RUN_AS_NODE: '1' }
  delete env.NODE_OPTIONS
  const result = spawnSync(require('electron'), [fixture], { env, encoding: 'utf8', timeout: 15_000 })
  assert.ifError(result.error)
  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /Native MessagePack round-trip passed/)
})
