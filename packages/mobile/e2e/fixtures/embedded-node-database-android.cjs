// Android instrumentation entry. Included only in the test APK's assets.
const assert = require('node:assert/strict')
const crypto = require('node:crypto')
const fs = require('node:fs')
const path = require('node:path')
const { exerciseDatabase } = require('./embedded-node-database.cjs')

const FIXTURE_VERSION = 1
const hash = filename => crypto.createHash('sha256').update(fs.readFileSync(filename)).digest('hex')

function argument(name) {
  const index = process.argv.indexOf(name)
  assert.ok(index >= 2 && index + 1 < process.argv.length, 'Missing native launcher test argument')
  return process.argv[index + 1]
}

async function bridgeRoundTrip(nativeBridge, runId, progress) {
  const nonce = `${runId}-${crypto.randomBytes(16).toString('hex')}`
  await new Promise((resolve, reject) => {
    let settled = false
    let ignored = 0
    const timer = setTimeout(() => {
      settled = true
      reject(Object.assign(new Error(), { code: 'BRIDGE_TIMEOUT' }))
    }, 10_000)
    nativeBridge.registerChannel('_EVENTS_', (channel, data) => {
      if (settled) return
      try {
        progress('bridge-response-channel')
        assert.equal(channel, '_EVENTS_')
        progress('bridge-response-json')
        const message = JSON.parse(data)
        // The shared event channel can also contain lifecycle messages or a
        // reply for another request. Only our own random nonce can pass.
        if (message.event !== 'secret' || message.payload?.nonce !== nonce) {
          assert.ok(++ignored <= 64, 'Too many unrelated bridge messages')
          progress('bridge-awaiting-matching-response')
          return
        }
        progress('bridge-response-payload-type')
        assert.equal(message.payload.type, 'set-socket-secret')
        assert.equal(message.payload.nonce, nonce)
        // Never inspect or write the secret: doWork() and socket authentication
        // are outside this test. A matched envelope proves both JNI directions.
        settled = true
        clearTimeout(timer)
        resolve()
      } catch (error) {
        settled = true
        clearTimeout(timer)
        reject(error)
      }
    })
    nativeBridge.sendMessage('_EVENTS_', JSON.stringify({
      event: 'message',
      payload: JSON.stringify(['readyForSecret', nonce]),
    }))
  })
}

async function run() {
  const report = {
    fixtureVersion: FIXTURE_VERSION,
    status: 'running',
    stage: 'validate-arguments',
    node: process.versions.node,
    platform: process.platform,
    architecture: process.arch,
    modules: process.versions.modules,
    napi: process.versions.napi,
    pid: process.pid,
  }
  let resultPath
  const write = () => {
    if (!resultPath) return
    fs.writeFileSync(`${resultPath}.tmp`, `${JSON.stringify(report, null, 2)}\n`)
    fs.renameSync(`${resultPath}.tmp`, resultPath)
  }
  const progress = stage => { report.stage = stage; write() }
  try {
    const runId = argument('--quiet-run-id')
    assert.match(runId, /^[a-z0-9][a-z0-9_-]{0,63}$/)
    const files = argument('--quiet-files')
    const project = argument('--quiet-project')
    const expectedLaunch = Number(argument('--quiet-launch'))
    assert.ok(expectedLaunch === 1 || expectedLaunch === 2)
    assert.ok(path.isAbsolute(files) && path.isAbsolute(project))
    assert.equal(path.resolve(project), path.join(files, 'nodejs-project'))
    assert.equal(fs.realpathSync(__dirname), fs.realpathSync(path.join(project, 'quiet-embedded-node-smoke', runId)))
    const directory = path.join(files, 'quiet-embedded-node-smoke', runId)
    fs.mkdirSync(directory, { recursive: true })
    resultPath = path.join(directory, 'result.json')
    const previous = fs.existsSync(resultPath) ? JSON.parse(fs.readFileSync(resultPath, 'utf8')) : null
    report.runId = runId
    report.launch = expectedLaunch
    report.previousPid = previous ? previous.pid : null
    report.fixtureSha256 = hash(__filename)
    report.databaseHelperSha256 = hash(path.join(__dirname, 'embedded-node-database.cjs'))
    progress('validate-runtime')
    assert.equal(process.versions.node, '24.18.0')
    assert.equal(process.platform, 'android')
    assert.equal(process.arch, 'arm64')
    assert.equal(process.versions.modules, '137')
    assert.ok(Number(process.versions.napi) >= 3)
    if (expectedLaunch === 1) assert.equal(previous, null, 'A first launch requires a fresh run ID')
    else {
      assert.ok(previous && previous.status === 'pass' && previous.launch === 1, 'Relaunch requires a passing first process')
      for (const key of ['fixtureVersion', 'node', 'platform', 'architecture', 'modules', 'napi', 'fixtureSha256', 'databaseHelperSha256']) {
        assert.equal(previous[key], report[key], 'Runtime and fixture must match the previous process')
      }
      assert.notEqual(previous.pid, process.pid, 'Relaunch requires a different native process')
    }

    progress('native-bridge-roundtrip')
    const nativeBridge = process._linkedBinding('rn_bridge')
    for (const method of ['sendMessage', 'registerChannel', 'getDataDir']) assert.equal(typeof nativeBridge[method], 'function')
    report.nativeBridge = true
    // Android's existing bridge does not register a data directory. Use the
    // actual Context.filesDir passed by the Java test through native argv.
    await bridgeRoundTrip(nativeBridge, runId, progress)
    report.bridgeRoundTrip = true

    progress('load-classic-level')
    const addon = path.join(project, 'arm64/classic-level/classic_level.node')
    assert.ok(fs.statSync(addon).size > 0)
    assert.equal(fs.readFileSync(addon).subarray(0, 4).toString('hex'), '7f454c46')
    report.addonSha256 = hash(addon)
    assert.equal(report.addonSha256, argument('--quiet-addon-sha256'), 'Load the original APK database addon')
    if (previous) assert.equal(report.addonSha256, previous.addonSha256)
    const binding = require(addon)
    for (const method of ['db_init', 'db_open', 'db_put', 'db_get', 'db_close', 'iterator_init', 'iterator_nextv', 'iterator_close']) {
      assert.equal(typeof binding[method], 'function')
    }
    report.database = await exerciseDatabase(binding, path.join(directory, 'database'), {
      create: expectedLaunch === 1,
      progress,
    })
    report.status = 'pass'
    progress('complete')
  } catch (error) {
    report.status = 'fail'
    report.error = {
      name: error && error.name === 'AssertionError' ? 'AssertionError' : 'Error',
      code: error && typeof error.code === 'string' && /^[A-Z0-9_]+$/.test(error.code) ? error.code : 'SMOKE_FAILED',
      actualType: typeof error.actual,
      expectedType: typeof error.expected,
    }
    try { write() } catch { report.verdictWriteFailed = true }
    // Only the allowlisted public verdict is emitted, never arbitrary errors,
    // native messages, arguments, environment values, or stack traces.
    console.error(`QUIET_ANDROID_EMBEDDED_NODE_DATABASE ${JSON.stringify(report)}`)
    process.exitCode = 1
  }
}

if (require.main === module) run()
