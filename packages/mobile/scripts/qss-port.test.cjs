const { test } = require('node:test')
const assert = require('node:assert/strict')
const { execFileSync } = require('node:child_process')
const path = require('node:path')
const { DEFAULT_QSS_PORT, qssPort, qssEndpoint } = require('../e2e/utils/qssPort.cjs')
const { verifyAndroidRouting } = require('../e2e/utils/androidProcesses.cjs')
const { requireQssOnlyEnvironment } = require('../../backend/e2e/qss-only/mode.cjs')

// Sessions that share a host run their own QSS fixture on their own port.
const OTHER_PORT = 3166

test('the QSS port defaults to 3003 and is read from QUIET_QSS_PORT', () => {
  assert.equal(DEFAULT_QSS_PORT, 3003)
  assert.equal(qssPort({}), 3003)
  assert.equal(qssPort({ QUIET_QSS_PORT: '' }), 3003)
  assert.equal(qssPort({ QUIET_QSS_PORT: String(OTHER_PORT) }), OTHER_PORT)
  assert.equal(qssEndpoint(OTHER_PORT), `ws://localhost:${OTHER_PORT}`)
  assert.equal(qssEndpoint(), 'ws://localhost:3003')
  for (const bad of ['80', '1023', '65536', '3003.5', '3e3', ' 3003', '0x1bb7', 'abc', '-3003']) {
    assert.throws(() => qssPort({ QUIET_QSS_PORT: bad }), /QUIET_QSS_PORT/, bad)
  }
})

test('the Android route follows QUIET_QSS_PORT', async () => {
  const previous = process.env.QUIET_QSS_PORT
  const routeFor = async port => {
    process.env.QUIET_QSS_PORT = port
    const calls = []
    await verifyAndroidRouting(async (...args) => {
      calls.push(args)
      return `UsbFfs tcp:${port} tcp:${port}`
    })
    return calls
  }
  try {
    assert.deepEqual(await routeFor(String(OTHER_PORT)), [
      ['reverse', `tcp:${OTHER_PORT}`, `tcp:${OTHER_PORT}`],
      ['reverse', '--list'],
    ])
    process.env.QUIET_QSS_PORT = String(OTHER_PORT)
    await assert.rejects(
      verifyAndroidRouting(async () => 'UsbFfs tcp:3003 tcp:3003'),
      new RegExp(`reverse localhost:${OTHER_PORT}`)
    )
  } finally {
    if (previous === undefined) delete process.env.QUIET_QSS_PORT
    else process.env.QUIET_QSS_PORT = previous
  }
})

test('the community harness uses the selected port for its endpoint and fixture manifest', () => {
  const script = `
    const { ENDPOINT, validateFixture } = require(${JSON.stringify(path.join(__dirname, '../e2e/utils/qssCommunity.cjs'))})
    const result = { status: 'passed', health: { status: 'ok', details: { postgres: { status: 'up' } } },
      probe: { testSiteKey: true, missingTokenRejected: true, publicTestTokenVerified: true } }
    const manifest = port => ({ version: 1, project: 'quiet-qss-e2e-abcdef123456', endpoint: 'ws://localhost:' + port,
      port, productionQss: false, pushNotifications: false })
    const accepts = port => { try { validateFixture({ manifest: manifest(port), result }); return true } catch { return false } }
    console.log(JSON.stringify({ endpoint: ENDPOINT, own: accepts(${OTHER_PORT}), default: accepts(3003) }))
  `
  const run = port => {
    const env = { ...process.env }
    delete env.QUIET_QSS_PORT
    if (port) env.QUIET_QSS_PORT = port
    return JSON.parse(execFileSync(process.execPath, ['-e', script], { env, encoding: 'utf8' }))
  }
  assert.deepEqual(run(undefined), { endpoint: 'ws://localhost:3003', own: false, default: true })
  assert.deepEqual(run(String(OTHER_PORT)), { endpoint: `ws://localhost:${OTHER_PORT}`, own: true, default: false })
})

test('the QSS-only backend accepts any unprivileged localhost fixture port and nothing else local', () => {
  const environment = { IS_E2E: 'true', QSS_ALLOWED: 'true' }
  for (const endpoint of [
    'ws://localhost:3003',
    `ws://localhost:${OTHER_PORT}`,
    'ws://localhost:65535',
    'wss://qss-dev.quiet-services.app',
  ]) {
    requireQssOnlyEnvironment({ ...environment, QSS_ENDPOINT: endpoint })
  }
  for (const endpoint of [
    'ws://localhost:80',
    'ws://localhost:1023',
    'ws://localhost:65536',
    'ws://localhost',
    'ws://localhost:3003/',
    'ws://localhost:3003.evil.example',
    'ws://127.0.0.1:3003',
    'ws://10.0.2.2:3003',
    'wss://localhost:3003',
    'wss://qss-prod.quiet-services.app',
    undefined,
  ]) {
    assert.throws(
      () => requireQssOnlyEnvironment({ ...environment, QSS_ENDPOINT: endpoint }),
      /QSS-only E2E backend/,
      String(endpoint)
    )
  }
})
