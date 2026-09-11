const { test, before, after } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { createHash } = require('node:crypto')
const {
  ENDPOINT,
  parseQssInvitation,
  validateBuild,
  validateFixture,
  prepareRun,
  writeProof,
  waitForServerProof,
  validateStorageProof,
} = require('../e2e/utils/qssCommunity.cjs')

// These tests exercise the private relay with disposable files, regardless of
// whether the caller also has a real local QSS fixture configured.
const localFixtureOutput = process.env.QUIET_QSS_LOCAL_FIXTURE_OUTPUT
before(() => {
  delete process.env.QUIET_QSS_LOCAL_FIXTURE_OUTPUT
})
after(() => {
  if (localFixtureOutput !== undefined) process.env.QUIET_QSS_LOCAL_FIXTURE_OUTPUT = localFixtureOutput
})

const name = 'qss-native-test'
const teamId = 'z' + '1'.repeat(43)
const invitation = endpoint => {
  const auth = new URLSearchParams({ c: name, t: teamId, s: 'PublicTestSeed12', l: 'PublicTestSalt12' })
  const params = new URLSearchParams({
    v: 'v5',
    q: 'true',
    e: Buffer.from(endpoint).toString('base64url'),
    a: Buffer.from(auth.toString()).toString('base64url'),
    k: Buffer.alloc(32, 7).toString('base64'),
  })
  return `https://tryquiet.org/join#${params}`
}
const fixture = {
  version: 1,
  runId: 'owned-test-run',
  manifest: {
    version: 1,
    project: 'quiet-qss-e2e-aabbcc',
    endpoint: ENDPOINT,
    port: 3003,
    productionQss: false,
    pushNotifications: false,
  },
  result: {
    status: 'passed',
    health: { status: 'ok', details: { postgres: { status: 'up' } } },
    probe: { testSiteKey: true, missingTokenRejected: true, publicTestTokenVerified: true },
  },
}
const temporary = t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'quiet-qss-harness-'))
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }))
  return directory
}

test('parses the actual v5 URL format without returning its invitation secrets', () => {
  assert.deepEqual(parseQssInvitation(invitation(ENDPOINT), name), {
    version: 'v5',
    endpoint: ENDPOINT,
    communityName: name,
    teamId,
  })
  for (const invalid of [
    invitation('wss://qss-dev.quiet-services.app'),
    invitation('ws://127.0.0.1:3003'),
    invitation(ENDPOINT).replace('v=v5', 'v=v4'),
    invitation(ENDPOINT) + '&v=v5',
  ]) {
    assert.throws(
      () => parseQssInvitation(invalid, name),
      error => !error.message.includes('PublicTest') && !error.message.includes(invalid)
    )
  }
  assert.throws(() => parseQssInvitation(invitation(ENDPOINT), 'another-community'))
})

test('rejects a remote fixture and incomplete real captcha validation', () => {
  assert.equal(validateFixture(fixture).project, fixture.manifest.project)
  assert.throws(() =>
    validateFixture({ ...fixture, manifest: { ...fixture.manifest, endpoint: 'ws://127.0.0.1:3003' } })
  )
  assert.throws(() => validateFixture({ ...fixture, manifest: { ...fixture.manifest, productionQss: true } }))
  assert.throws(() => validateFixture({ ...fixture, result: { ...fixture.result, probe: {} } }))
})

test('build preflight checks the real files and rejects stale or remote native configuration', t => {
  const output = temporary(t)
  const app = path.join(output, 'DerivedData/Build/Products/Debug-iphonesimulator/Quiet.app')
  fs.mkdirSync(app, { recursive: true })
  const frontend = Buffer.from('bundled quiet test app')
  fs.writeFileSync(path.join(app, 'main.jsbundle'), frontend)
  fs.writeFileSync(path.join(app, 'Quiet.debug.dylib'), ENDPOINT)
  fs.writeFileSync(
    path.join(output, 'result.json'),
    JSON.stringify({
      status: 'passed',
      originalRestored: true,
      scheme: 'Quiet',
      configuration: 'Debug',
      envFile: '.env.e2e.qss',
      app,
      appJSBundleSHA256: createHash('sha256').update(frontend).digest('hex'),
    })
  )
  assert.equal(validateBuild(output).app, app)
  fs.writeFileSync(path.join(app, 'Quiet.debug.dylib'), 'ws://127.0.0.1:3003')
  assert.throws(() => validateBuild(output), /native configuration/)
  fs.writeFileSync(path.join(app, 'Quiet.debug.dylib'), 'wss://qss-dev.quiet-services.app')
  assert.throws(() => validateBuild(output), /native configuration/)
  fs.writeFileSync(path.join(app, 'Quiet.debug.dylib'), ENDPOINT)
  fs.appendFileSync(path.join(app, 'main.jsbundle'), 'changed')
  assert.throws(() => validateBuild(output), /build receipt/)
})

test('private run rejects stale proof and symlinked control directories', t => {
  const directory = temporary(t)
  fs.writeFileSync(path.join(directory, 'fixture.json'), JSON.stringify(fixture))
  const run = prepareRun(directory)
  writeProof(run, { teamId, messageStored: true })
  assert.equal(fs.statSync(path.join(directory, 'ui.json')).mode & 0o777, 0o600)
  assert.throws(() => prepareRun(directory), /fresh/)
  fs.unlinkSync(path.join(directory, 'ui.json'))
  fs.rmdirSync(path.join(directory, 'requests'))
  fs.symlinkSync(path.join(directory, 'responses'), path.join(directory, 'requests'))
  assert.throws(() => prepareRun(directory), /real directories/)
})

test('storage rendezvous exchanges a real private request and requires matching server evidence', async t => {
  const directory = temporary(t)
  fs.writeFileSync(path.join(directory, 'fixture.json'), JSON.stringify(fixture))
  const run = prepareRun(directory)
  const pending = waitForServerProof(run, teamId, fixture.manifest.project)
  const requests = fs.readdirSync(path.join(directory, 'requests'))
  assert.equal(requests.length, 1)
  const request = JSON.parse(fs.readFileSync(path.join(directory, 'requests', requests[0])))
  assert.deepEqual(Object.keys(request).sort(), ['id', 'operation', 'runId', 'teamId'])
  assert.equal(request.operation, 'qss-storage')
  const response = {
    id: request.id,
    ok: true,
    result: {
      runId: run.runId,
      teamId,
      project: fixture.manifest.project,
      communityExists: true,
      logEntryCount: 3,
      maxSyncSeq: 3,
    },
  }
  fs.writeFileSync(path.join(directory, 'responses', `${request.id}.json`), JSON.stringify(response), { mode: 0o600 })
  assert.equal((await pending).communityExists, true)
})

test('rejects a response for another run even when its database counts are positive', async t => {
  const directory = temporary(t)
  fs.writeFileSync(path.join(directory, 'fixture.json'), JSON.stringify(fixture))
  const run = prepareRun(directory)
  const pending = waitForServerProof(run, teamId, fixture.manifest.project)
  const filename = fs.readdirSync(path.join(directory, 'requests'))[0]
  const request = JSON.parse(fs.readFileSync(path.join(directory, 'requests', filename)))
  fs.writeFileSync(
    path.join(directory, 'responses', filename),
    JSON.stringify({
      id: request.id,
      ok: true,
      result: {
        runId: 'stale-run',
        teamId,
        project: fixture.manifest.project,
        communityExists: true,
        logEntryCount: 10,
        maxSyncSeq: 10,
      },
    }),
    { mode: 0o600 }
  )
  await assert.rejects(pending, /must match this run/)
})

test('baseline accepts a registered empty community but post-send requires a new server sequence', () => {
  const baseline = {
    runId: fixture.runId,
    teamId,
    project: fixture.manifest.project,
    communityExists: true,
    logEntryCount: 0,
    maxSyncSeq: 0,
  }
  assert.deepEqual(validateStorageProof(baseline, fixture.runId, teamId, fixture.manifest.project), baseline)
  const bootstrap = { ...baseline, logEntryCount: 3, maxSyncSeq: 3 }
  assert.throws(
    () => validateStorageProof(bootstrap, fixture.runId, teamId, fixture.manifest.project, { afterSyncSeq: 3 }),
    /new log entry/
  )
  assert.throws(
    () =>
      validateStorageProof({ ...bootstrap, logEntryCount: 4 }, fixture.runId, teamId, fixture.manifest.project, {
        afterSyncSeq: 3,
      }),
    /new log entry/
  )
  const uploaded = { ...bootstrap, logEntryCount: 4, maxSyncSeq: 4 }
  assert.deepEqual(
    validateStorageProof(uploaded, fixture.runId, teamId, fixture.manifest.project, { afterSyncSeq: 3 }),
    uploaded
  )
})

test('relay binds evidence to the exact team and carries the pre-send sequence', async t => {
  const directory = temporary(t)
  fs.writeFileSync(path.join(directory, 'fixture.json'), JSON.stringify(fixture))
  const run = prepareRun(directory)
  const pending = waitForServerProof(run, teamId, fixture.manifest.project, { afterSyncSeq: 3 })
  const filename = fs.readdirSync(path.join(directory, 'requests'))[0]
  const request = JSON.parse(fs.readFileSync(path.join(directory, 'requests', filename)))
  assert.equal(request.afterSyncSeq, 3)
  assert.equal(request.teamId, teamId)
  fs.writeFileSync(
    path.join(directory, 'responses', filename),
    JSON.stringify({
      id: request.id,
      ok: true,
      result: {
        runId: run.runId,
        teamId: 'z' + '2'.repeat(43),
        project: fixture.manifest.project,
        communityExists: true,
        logEntryCount: 9,
        maxSyncSeq: 9,
      },
    }),
    { mode: 0o600 }
  )
  await assert.rejects(pending, /must match this run and team/)
})

test('relay rejects unchanged bootstrap records after a locally acknowledged send', async t => {
  const directory = temporary(t)
  fs.writeFileSync(path.join(directory, 'fixture.json'), JSON.stringify(fixture))
  const run = prepareRun(directory)
  const pending = waitForServerProof(run, teamId, fixture.manifest.project, { afterSyncSeq: 3 })
  const filename = fs.readdirSync(path.join(directory, 'requests'))[0]
  const request = JSON.parse(fs.readFileSync(path.join(directory, 'requests', filename)))
  fs.writeFileSync(
    path.join(directory, 'responses', filename),
    JSON.stringify({
      id: request.id,
      ok: true,
      result: {
        runId: run.runId,
        teamId,
        project: fixture.manifest.project,
        communityExists: true,
        logEntryCount: 3,
        maxSyncSeq: 3,
      },
    }),
    { mode: 0o600 }
  )
  await assert.rejects(pending, /new log entry/)
})
