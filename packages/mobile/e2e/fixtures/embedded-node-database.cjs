// Test-only entry point. Copy over bundle.cjs in a separate built Storybook .app.
// This file is outside nodejs-assets and is never included by the normal asset-copy phase.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { promisify } = require('node:util')

const FIXTURE_VERSION = 3
const ROW_COUNT = 8
const valueFor = index => `row-${index}:` + 'compressed-persistent-value'.repeat(8192)
const entries = Array.from({ length: ROW_COUNT }, (_, index) => [`key-${index}`, valueFor(index)])

async function readIterator(binding, database, reverse) {
  const iterator = binding.iterator_init(database, {
    keys: true,
    values: true,
    keyEncoding: 'utf8',
    valueEncoding: 'utf8',
    reverse,
    highWaterMarkBytes: 4 * 1024 * 1024,
  })
  const rows = []
  try {
    for (let page = 0; page < 10; page++) {
      const { items, finished } = await new Promise((resolve, reject) => {
        binding.iterator_nextv(iterator, 3, (error, items, finished) => {
          if (error) reject(error)
          else resolve({ items, finished })
        })
      })
      rows.push(...items)
      if (finished) {
        assert.deepEqual(
          rows,
          reverse ? [...entries].reverse() : entries,
          'Iterator must return every key and value in order'
        )
        return rows.length
      }
    }
    assert.fail('Iterator did not finish within the bounded page count')
  } finally {
    await promisify(binding.iterator_close)(iterator)
  }
}

// Shared with the real host addon test. This helper intentionally makes no claim about rn-bridge or iOS.
async function exerciseDatabase(binding, databasePath, { create, progress = () => {} }) {
  const open = promisify(binding.db_open)
  const close = promisify(binding.db_close)
  const put = promisify(binding.db_put)
  const get = promisify(binding.db_get)
  if (create) fs.mkdirSync(databasePath)
  else assert.ok(fs.existsSync(path.join(databasePath, 'CURRENT')), 'A relaunch must read the existing database')

  async function cycle(first) {
    const database = binding.db_init()
    progress(first ? 'open' : 'reopen')
    await open(database, databasePath, {
      createIfMissing: first && create,
      compression: true,
      writeBufferSize: 64 * 1024,
    })
    let failed = false
    try {
      if (first && create) {
        progress('put')
        for (const [key, value] of entries) await put(database, key, value, { sync: true })
      }
      progress(first ? 'get' : 'reopen-get')
      for (const [key, value] of entries) {
        assert.equal(
          await get(database, key, { valueEncoding: 'utf8' }),
          value,
          'Stored value must survive an open/close cycle'
        )
      }
      await assert.rejects(get(database, 'missing', { valueEncoding: 'utf8' }), { code: 'LEVEL_NOT_FOUND' })
      progress(first ? 'iterate-forward' : 'iterate-reverse')
      return await readIterator(binding, database, !first)
    } catch (error) {
      failed = true
      throw error
    } finally {
      if (!failed) progress(first ? 'close' : 'reopen-close')
      await close(database)
    }
  }

  const forwardRows = await cycle(true)
  progress('verify-compressed-tables')
  const tableFiles = fs.readdirSync(databasePath).filter(file => file.endsWith('.ldb'))
  assert.ok(tableFiles.length > 0, 'Writes must create persistent LevelDB tables')
  const tableBytes = tableFiles.reduce((sum, file) => sum + fs.statSync(path.join(databasePath, file)).size, 0)
  const uncompressedBytes = entries.reduce((sum, [, value]) => sum + Buffer.byteLength(value), 0)
  assert.ok(tableBytes < uncompressedBytes / 4, 'Persistent tables must contain compressed values')
  const reverseRows = await cycle(false)
  return {
    created: create,
    rowsWritten: create ? ROW_COUNT : 0,
    rowsRead: ROW_COUNT * 2,
    forwardRows,
    reverseRows,
    openCloseCycles: 2,
    tableFiles: tableFiles.length,
    tableBytes,
    missingKeyCode: 'LEVEL_NOT_FOUND',
  }
}

async function runEmbeddedSmoke() {
  const report = {
    fixtureVersion: FIXTURE_VERSION,
    status: 'running',
    stage: 'load-rn-bridge',
    node: process.versions.node,
    platform: process.platform,
    architecture: process.arch,
    modules: process.versions.modules,
    napi: process.versions.napi,
    pid: process.pid,
  }
  let resultPath
  const writeReport = () => {
    const text = `${JSON.stringify(report, null, 2)}\n`
    if (resultPath) {
      fs.writeFileSync(`${resultPath}.tmp`, text)
      fs.renameSync(`${resultPath}.tmp`, resultPath)
    }
  }
  const progress = stage => {
    report.stage = stage
    writeReport()
  }
  try {
    // Loads the actual statically linked native rn_bridge module. No host substitute is accepted.
    const bridge = require('rn-bridge')
    assert.equal(typeof bridge.app.datadir, 'function', 'The real native bridge must provide the data directory')
    const documents = bridge.app.datadir()
    assert.ok(path.isAbsolute(documents), 'Native data directory must be absolute')
    report.nativeBridge = true
    report.stage = 'validate-run-id'
    const runId = process.env.QUIET_EMBEDDED_NODE_DATABASE_RUN_ID || 'rn-newarch-classic-level-v3'
    assert.match(runId, /^[a-z0-9][a-z0-9_-]{0,63}$/, 'Use a simple, public test run ID')
    report.runId = runId
    const runDirectory = path.join(documents, 'quiet-embedded-node-smoke', runId)
    fs.mkdirSync(runDirectory, { recursive: true })
    resultPath = path.join(runDirectory, 'result.json')
    const previous = fs.existsSync(resultPath) ? JSON.parse(fs.readFileSync(resultPath, 'utf8')) : null
    progress('validate-runtime')
    assert.equal(process.versions.node, '24.18.0', 'Smoke must use the vendored embedded Node version')
    assert.equal(process.platform, 'ios', 'Smoke must run inside the iOS app')
    assert.equal(process.arch, 'arm64', 'The vendored Node runtime supports the ARM64 iOS simulator')
    const expectedArchitecture = process.env.QUIET_EMBEDDED_NODE_DATABASE_ARCH
    if (expectedArchitecture !== undefined) {
      assert.equal(process.arch, expectedArchitecture, 'Embedded Node must match the requested simulator architecture')
    }
    assert.equal(process.versions.modules, '137', 'Unexpected embedded Node module ABI')
    assert.ok(Number(process.versions.napi) >= 3, 'classic-level requires Node-API 3')
    if (previous) {
      assert.equal(previous.status, 'pass', 'A failed or incomplete run needs a fresh run ID')
      assert.equal(previous.fixtureVersion, FIXTURE_VERSION, 'A changed fixture needs a fresh run ID')
      for (const key of ['node', 'platform', 'architecture', 'modules', 'napi']) {
        assert.equal(previous[key], report[key], `A changed runtime ${key} needs a fresh run ID`)
      }
      assert.notEqual(previous.pid, process.pid, 'Relaunch must start a fresh app process')
    }
    report.launch = previous ? previous.launch + 1 : 1
    report.previousPid = previous ? previous.pid : null

    progress('validate-preload')
    const preload = path.join(__dirname, 'override-dlopen-paths-preload.js')
    assert.ok(require.cache[require.resolve(preload)], 'RNNodeJsMobile must preload the existing Quiet path override')
    const mapping = JSON.parse(fs.readFileSync(path.join(__dirname, 'override-dlopen-paths-data.json'), 'utf8'))
    assert.deepEqual(
      mapping,
      [
        {
          originalpath: ['deps', 'ios', 'universal', 'classic-level', 'classic_level.node'],
          newpath: ['..', 'Frameworks', 'classic-level.framework', 'classic-level'],
        },
      ],
      'Use the unmodified Quiet framework mapping'
    )
    const placeholder = path.join(__dirname, 'deps/ios/universal/classic-level/classic_level.node')
    assert.equal(fs.statSync(placeholder).size, 0, 'The mapped .node path must remain an empty placeholder')
    report.preloadCached = true
    report.placeholderBytes = 0
    progress('load-classic-level')
    const binding = require(placeholder)
    for (const method of [
      'db_init',
      'db_open',
      'db_put',
      'db_get',
      'db_close',
      'iterator_init',
      'iterator_nextv',
      'iterator_close',
    ]) {
      assert.equal(typeof binding[method], 'function', `Native binding must export ${method}`)
    }
    report.database = await exerciseDatabase(binding, path.join(runDirectory, 'database'), {
      create: !previous,
      progress,
    })
    report.status = 'pass'
    progress('complete')
    console.log(`QUIET_EMBEDDED_NODE_DATABASE ${JSON.stringify(report)}`)
    // The real bridge keeps the Node event loop alive and handles native pause/resume messages.
  } catch (error) {
    report.status = 'fail'
    // Never emit arbitrary error text, process arguments, environment values, or native secrets.
    report.error = {
      name: error && error.name === 'AssertionError' ? 'AssertionError' : 'Error',
      code: error && typeof error.code === 'string' && /^[A-Z0-9_]+$/.test(error.code) ? error.code : 'SMOKE_FAILED',
    }
    try {
      writeReport()
    } catch {
      report.verdictWriteFailed = true
    }
    console.error(`QUIET_EMBEDDED_NODE_DATABASE ${JSON.stringify(report)}`)
    process.exitCode = 1
  }
}

if (require.main === module) runEmbeddedSmoke()

module.exports = { exerciseDatabase }
