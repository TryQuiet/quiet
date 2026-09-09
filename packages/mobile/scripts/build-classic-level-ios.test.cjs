// Explicit native integration test (downloads pinned sources and needs a host C++ compiler).
// node --test scripts/build-classic-level-ios.test.cjs
const assert = require('node:assert/strict')
const { execFileSync, spawnSync } = require('node:child_process')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const test = require('node:test')
const {
  PACKAGES,
  verifyArchive,
  downloadSources,
  sourceFiles,
  compileArguments,
  snapshotTree,
  assertTreeUnchanged,
  validateOutput,
} = require('./build-classic-level-ios.cjs')
const embeddedFixture = path.resolve(__dirname, '../e2e/fixtures/embedded-node-database.cjs')

test('the embedded smoke rejects a host process without the actual native rn-bridge', () => {
  const sentinel = 'private-test-value-must-not-be-printed'
  const result = spawnSync(process.env.QUIET_TEST_NODE || process.execPath, [embeddedFixture, sentinel], {
    encoding: 'utf8',
    timeout: 10_000,
    env: { ...process.env, QUIET_UNRELATED_PRIVATE_TEST_VALUE: sentinel },
  })
  assert.equal(result.status, 1)
  const marker = 'QUIET_EMBEDDED_NODE_DATABASE '
  const verdictLine = result.stderr.split('\n').find(line => line.startsWith(marker))
  assert.ok(verdictLine, 'Failure must have a parseable verdict')
  const verdict = JSON.parse(verdictLine.slice(marker.length))
  assert.equal(verdict.status, 'fail')
  assert.equal(verdict.stage, 'load-rn-bridge')
  assert.equal(verdict.nativeBridge, undefined)
  assert.equal(`${result.stdout}${result.stderr}`.includes(sentinel), false)
})

test('pinned classic-level sources compile and load through the real Quiet override', { timeout: 180_000 }, async t => {
  assert.ok(['linux', 'darwin'].includes(process.platform), 'Run this native integration test on Linux or macOS')
  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'quiet-classic-level-test-'))
  t.after(() => fs.rmSync(work, { recursive: true, force: true }))
  const sources = await downloadSources(work)

  await t.test('output cannot overwrite inputs directly or through a symlinked parent', () => {
    const framework = path.resolve(__dirname, '../ios/classic-level.framework')
    const headers = path.resolve(__dirname, '../ios/NodeJsMobile/libnode/include/node')
    assert.throws(() => validateOutput(path.join(framework, 'artifact')), /Output must be outside/)
    assert.throws(() => validateOutput(path.join(headers, 'artifact')), /Output must be outside/)
    const linked = path.join(work, 'linked-framework')
    fs.symlinkSync(framework, linked, 'dir')
    assert.throws(() => validateOutput(path.join(linked, 'artifact')), /Output must be outside/)
    assert.throws(() => validateOutput(work), /Output already exists/)
    const destination = path.join(work, 'safe-output')
    assert.equal(validateOutput(destination), path.join(fs.realpathSync(work), 'safe-output'))
    assert.equal(fs.existsSync(destination), false)
  })

  await t.test('the source recipe covers the pinned POSIX LevelDB and Snappy build definitions', () => {
    const leveldbGyp = fs.readFileSync(path.join(sources.classicLevel, 'deps/leveldb/leveldb.gyp'), 'utf8')
    const snappyGyp = fs.readFileSync(path.join(sources.classicLevel, 'deps/snappy/snappy.gyp'), 'utf8')
    const expected = [
      'binding.cc',
      ...Array.from(
        leveldbGyp.matchAll(/"leveldb-<\(ldbversion\)\/([^"\n]+\.cc)"/g),
        match => `deps/leveldb/leveldb-1.20/${match[1]}`
      ),
      ...Array.from(snappyGyp.matchAll(/"(snappy\/[^"\n]+\.cc)"/g), match => `deps/snappy/${match[1]}`),
    ].sort()
    assert.deepEqual(
      sourceFiles(sources.classicLevel)
        .map(file => path.relative(sources.classicLevel, file))
        .sort(),
      expected
    )
    const archive = fs.readFileSync(path.join(work, 'classic-level.tgz'))
    verifyArchive(archive, PACKAGES[0].integrity)
    archive[archive.length - 1] ^= 1
    assert.throws(() => verifyArchive(archive, PACKAGES[0].integrity), /integrity mismatch/)
  })

  await t.test(
    'symbol registration, compression and persisted reads work through the framework path substitution',
    () => {
      const app = path.join(work, 'Quiet.app')
      const project = path.join(app, 'nodejs-project')
      const framework = path.join(app, 'Frameworks/classic-level.framework')
      fs.mkdirSync(framework, { recursive: true })
      fs.mkdirSync(path.join(project, 'deps/ios/universal/classic-level'), { recursive: true })
      const binary = path.join(framework, 'classic-level')
      const flags = compileArguments(sources, process.platform === 'darwin' ? 'mac' : 'linux')
      if (process.platform === 'darwin') {
        execFileSync('xcrun', ['clang++', ...flags, '-dynamiclib', '-Wl,-undefined,dynamic_lookup', '-o', binary], {
          stdio: 'inherit',
        })
      } else {
        execFileSync('c++', [...flags, '-shared', '-pthread', '-o', binary], { stdio: 'inherit' })
      }
      const symbols = execFileSync(
        'nm',
        process.platform === 'darwin' ? ['-gU', binary] : ['-D', '--defined-only', binary],
        { encoding: 'utf8' }
      )
      assert.match(symbols, /\b_?napi_register_module_v1\b/)
      assert.match(symbols, /\b_?node_api_module_get_api_version_v1\b/)
      const originalAssets = path.resolve(__dirname, '../nodejs-assets/nodejs-project')
      for (const filename of ['override-dlopen-paths-preload.js', 'override-dlopen-paths-data.json']) {
        fs.copyFileSync(path.join(originalAssets, filename), path.join(project, filename))
      }
      fs.writeFileSync(path.join(project, 'deps/ios/universal/classic-level/classic_level.node'), '')
      const exercise = path.join(work, 'exercise.cjs')
      fs.writeFileSync(
        exercise,
        `
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { exerciseDatabase } = require(process.argv[3])
const project = process.argv[2]
const addon = path.join(project, 'deps/ios/universal/classic-level/classic_level.node')
// The empty placeholder cannot load until the actual, unmodified Quiet preload redirects it.
assert.throws(() => require(addon), { code: 'ERR_DLOPEN_FAILED' })
require(path.join(project, 'override-dlopen-paths-preload.js'))
const binding = require(addon)
const dbPath = path.join(project, 'database')
;(async () => {
  const first = await exerciseDatabase(binding, dbPath, { create: true })
  assert.equal(first.rowsWritten, 8)
  assert.equal(first.rowsRead, 16)
  assert.equal(first.forwardRows, 8)
  assert.equal(first.reverseRows, 8)
  assert.equal(first.openCloseCycles, 2)
  const persisted = await exerciseDatabase(binding, dbPath, { create: false })
  assert.equal(persisted.rowsWritten, 0)
  assert.equal(persisted.rowsRead, 16)
  assert.equal(persisted.forwardRows, 8)
  assert.equal(persisted.reverseRows, 8)
  console.log('Quiet dlopen override: compressed data persisted and reopened with Node ' + process.version)
})().catch(error => { console.error(error); process.exitCode = 1 })
`
      )
      const result = execFileSync(
        process.env.QUIET_TEST_NODE || process.execPath,
        [exercise, project, embeddedFixture],
        {
          encoding: 'utf8',
          timeout: 30_000,
        }
      )
      assert.match(result, /compressed data persisted and reopened/)
      t.diagnostic(result.trim())
    }
  )

  await t.test('device preservation rejects binary, metadata and extra-file changes', () => {
    const original = path.resolve(__dirname, '../ios/classic-level.framework')
    const copied = path.join(work, 'device-copy')
    const snapshot = snapshotTree(original)
    fs.cpSync(original, copied, { recursive: true })
    assertTreeUnchanged(copied, snapshot)
    for (const filename of ['classic-level', 'Info.plist']) {
      const file = path.join(copied, filename)
      const bytes = fs.readFileSync(file)
      fs.writeFileSync(file, Buffer.concat([bytes, Buffer.from('changed')]))
      assert.throws(() => assertTreeUnchanged(copied, snapshot), /Framework contents changed/)
      fs.writeFileSync(file, bytes)
    }
    fs.writeFileSync(path.join(copied, 'unexpected'), 'extra')
    assert.throws(() => assertTreeUnchanged(copied, snapshot), /Framework contents changed/)
    assertTreeUnchanged(original, snapshot)
  })
})
