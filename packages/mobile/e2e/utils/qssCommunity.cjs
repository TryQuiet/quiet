const fs = require('node:fs')
const path = require('node:path')
const http = require('node:http')
const { execFile } = require('node:child_process')
const { promisify } = require('node:util')
const execFileAsync = promisify(execFile)
const { createHash, randomUUID } = require('node:crypto')

// Keep the advertised URL and QSS's LFA server identity identical in both
// development and production backend bundles.
const ENDPOINT = 'ws://localhost:3003'
const TEST_SITE_KEY = '10000000-ffff-ffff-ffff-000000000001'
const requireCondition = (condition, message) => {
  if (!condition) throw new Error(message)
}
const sha256 = filename => createHash('sha256').update(fs.readFileSync(filename)).digest('hex')
const readJson = filename => JSON.parse(fs.readFileSync(filename, 'utf8'))

function parseQssInvitation(invitation, communityName) {
  // The production parser logs the complete invitation, including its secret.
  // Parse only the UI fields needed by this test and never attach input to errors.
  try {
    const url = new URL(invitation)
    requireCondition(url.origin === 'https://tryquiet.org' && url.pathname === '/join' && !url.search, 'Invalid invite')
    const params = new URLSearchParams(url.hash.slice(1))
    for (const key of ['v', 'q', 'e', 'a', 'k']) requireCondition(params.getAll(key).length === 1, 'Invalid invite')
    requireCondition(params.get('v') === 'v5' && params.get('q') === 'true', 'Invalid invite')
    const endpoint = Buffer.from(params.get('e'), 'base64url').toString('utf8')
    requireCondition(endpoint === ENDPOINT, 'Invalid invite')
    const auth = new URLSearchParams(Buffer.from(params.get('a'), 'base64url').toString('utf8'))
    for (const key of ['c', 't', 's', 'l']) requireCondition(auth.getAll(key).length === 1, 'Invalid invite')
    requireCondition(auth.get('c') === communityName, 'Invalid invite')
    requireCondition(/^[1-9A-HJ-NP-Za-km-z]{20,}$/.test(auth.get('t')), 'Invalid invite')
    requireCondition(
      /^[A-Za-z0-9]{16}$/.test(auth.get('s')) && /^[A-Za-z0-9]{16}$/.test(auth.get('l')),
      'Invalid invite'
    )
    requireCondition(Buffer.from(params.get('k'), 'base64').length === 32, 'Invalid invite')
    return { version: 'v5', endpoint, communityName, teamId: auth.get('t') }
  } catch {
    throw new Error('The visible invitation must identify this community and the local QSS fixture using v5')
  }
}

function validateBuild(output) {
  requireCondition(output, 'Set DETOX_IOS_ARM64_E2E_QSS_OUTPUT to the guarded QSS build workspace')
  const build = readJson(path.join(output, 'result.json'))
  const app = path.resolve(output, 'DerivedData/Build/Products/Debug-iphonesimulator/Quiet.app')
  requireCondition(
    build.status === 'passed' &&
      build.originalRestored === true &&
      build.scheme === 'Quiet' &&
      build.configuration === 'Debug' &&
      build.envFile === '.env.e2e.qss' &&
      path.resolve(build.app) === app,
    'Require a successful guarded standard .env.e2e.qss build'
  )
  requireCondition(
    sha256(path.join(app, 'main.jsbundle')) === build.appJSBundleSHA256,
    'QSS app differs from its build receipt'
  )
  // react-native-config compiles this value into the native Debug payload.
  const nativeConfig = fs.readFileSync(path.join(app, 'Quiet.debug.dylib'))
  requireCondition(
    nativeConfig.includes(Buffer.from(ENDPOINT)),
    'Built native configuration lacks the local QSS endpoint'
  )
  requireCondition(
    !nativeConfig.includes(Buffer.from('wss://qss-dev.quiet-services.app')) &&
      !nativeConfig.includes(Buffer.from('wss://qss-prod.quiet-services.app')),
    'Built native configuration contains a remote QSS endpoint'
  )
  return { app, frontendSHA256: build.appJSBundleSHA256, nativeSHA256: sha256(path.join(app, 'Quiet.debug.dylib')) }
}

function validateFixture({ manifest, result }) {
  requireCondition(
    manifest.version === 1 &&
      /^quiet-qss-e2e-[a-f0-9]+$/.test(manifest.project) &&
      manifest.endpoint === ENDPOINT &&
      manifest.port === 3003 &&
      manifest.productionQss === false &&
      manifest.pushNotifications === false,
    'Require the isolated loopback QSS fixture manifest'
  )
  requireCondition(
    result.status === 'passed' &&
      result.health?.status === 'ok' &&
      result.health?.details?.postgres?.status === 'up' &&
      result.probe?.testSiteKey === true &&
      result.probe?.missingTokenRejected === true &&
      result.probe?.publicTestTokenVerified === true,
    'QSS fixture health and real public captcha verification must pass first'
  )
  return manifest
}

function getHealth() {
  return new Promise((resolve, reject) => {
    const request = http.get('http://localhost:3003/health', response => {
      let body = ''
      response.on('data', data => {
        body += data
        if (body.length > 65536) request.destroy(new Error('QSS health response is too large'))
      })
      response.on('end', () => {
        try {
          requireCondition(response.statusCode === 200, 'Local QSS is not healthy')
          const health = JSON.parse(body)
          requireCondition(
            health.status === 'ok' && health.details?.postgres?.status === 'up',
            'Local QSS storage is not healthy'
          )
          resolve()
        } catch {
          reject(new Error('Local QSS health preflight failed'))
        }
      })
    })
    request.setTimeout(10000, () => request.destroy(new Error('Local QSS health timed out')))
    request.on('error', () => reject(new Error('Local QSS health preflight failed')))
  })
}

async function checkLiveFixture() {
  await getHealth()
  const { io } = require('socket.io-client')
  const socket = io(ENDPOINT, { transports: ['websocket'], autoConnect: false, reconnection: false, timeout: 10000 })
  try {
    await new Promise((resolve, reject) => {
      socket.once('connect', resolve)
      socket.once('connect_error', () => reject(new Error('Local QSS websocket preflight failed')))
      socket.connect()
    })
    const response = await socket
      .timeout(10000)
      .emitWithAck('get-captcha-site-key', { ts: Date.now(), status: 'sending' })
    requireCondition(
      response.status === 'success' && response.payload?.siteKey === TEST_SITE_KEY,
      'QSS must expose the public hCaptcha test site key'
    )
  } finally {
    socket.disconnect()
  }
}

function prepareRun(directory) {
  requireCondition(
    directory && path.isAbsolute(directory),
    'Set QUIET_QSS_E2E_RUN_DIR to the prepared private run directory'
  )
  const stat = fs.lstatSync(directory)
  requireCondition(
    stat.isDirectory() && !stat.isSymbolicLink() && (stat.mode & 0o077) === 0,
    'QSS run directory must be private'
  )
  const fixturePath = path.join(directory, 'fixture.json')
  requireCondition(!fs.lstatSync(fixturePath).isSymbolicLink(), 'Fixture manifest must not be a symlink')
  const fixture = readJson(fixturePath)
  requireCondition(
    fixture.version === 1 && /^[A-Za-z0-9_-]{1,128}$/.test(fixture.runId),
    'Invalid prepared fixture run'
  )
  requireCondition(!fs.existsSync(path.join(directory, 'ui.json')), 'Use a fresh QSS run directory')
  for (const name of ['requests', 'responses']) {
    const control = path.join(directory, name)
    if (!fs.existsSync(control)) fs.mkdirSync(control, { mode: 0o700 })
    const metadata = fs.lstatSync(control)
    requireCondition(
      metadata.isDirectory() && !metadata.isSymbolicLink() && fs.readdirSync(control).length === 0,
      'QSS request/response directories must be empty real directories'
    )
  }
  return { directory, runId: fixture.runId, fixture }
}

function writeProof(run, proof) {
  const temporary = path.join(run.directory, `ui-${randomUUID()}.tmp`)
  fs.writeFileSync(temporary, `${JSON.stringify({ version: 1, runId: run.runId, ...proof }, null, 2)}\n`, {
    flag: 'wx',
    mode: 0o600,
  })
  fs.renameSync(temporary, path.join(run.directory, 'ui.json'))
}

function validateStorageProof(proof, runId, teamId, fixtureProject, { afterSyncSeq } = {}) {
  requireCondition(
    proof.runId === runId &&
      proof.teamId === teamId &&
      proof.project === fixtureProject &&
      proof.communityExists === true &&
      Number.isSafeInteger(proof.logEntryCount) &&
      proof.logEntryCount >= 0 &&
      Number.isSafeInteger(proof.maxSyncSeq) &&
      proof.maxSyncSeq >= 0,
    'Server proof must match this run and team and confirm its actual stored QSS community'
  )
  if (afterSyncSeq !== undefined) {
    requireCondition(
      Number.isSafeInteger(afterSyncSeq) &&
        afterSyncSeq >= 0 &&
        proof.maxSyncSeq > afterSyncSeq &&
        proof.logEntryCount > 0,
      'QSS must store a new log entry after the recorded pre-send baseline'
    )
  }
  return proof
}

async function waitForServerProof(run, teamId, fixtureProject, { afterSyncSeq } = {}) {
  requireCondition(
    afterSyncSeq === undefined || (Number.isSafeInteger(afterSyncSeq) && afterSyncSeq >= 0),
    'A QSS sequence baseline must be a non-negative safe integer'
  )
  if (process.env.QUIET_QSS_LOCAL_FIXTURE_OUTPUT) {
    // A single macOS CI runner invokes the same fixture inspector directly.
    // The temporary remote validation relay below is optional infrastructure.
    const script = path.resolve(__dirname, '../../scripts/qss-e2e/fixture.py')
    const deadline = Date.now() + 60000
    do {
      let proof
      try {
        const { stdout } = await execFileAsync(
          'python3',
          [
            script,
            'storage',
            '--output',
            process.env.QUIET_QSS_LOCAL_FIXTURE_OUTPUT,
            '--ui-proof',
            path.join(run.directory, 'ui.json'),
          ],
          { timeout: Math.min(10000, Math.max(1, deadline - Date.now())) }
        )
        proof = JSON.parse(stdout)
      } catch {
        throw new Error('The local QSS fixture inspector failed')
      }
      requireCondition(
        proof.runId === run.runId && proof.teamId === teamId && proof.project === fixtureProject,
        'The local fixture inspector returned evidence for another run'
      )
      if (proof.communityExists === true && (afterSyncSeq === undefined || proof.maxSyncSeq > afterSyncSeq)) {
        return validateStorageProof(proof, run.runId, teamId, fixtureProject, { afterSyncSeq })
      }
      await new Promise(resolve => setTimeout(resolve, 500))
    } while (Date.now() < deadline)
    throw new Error('Timed out waiting for QSS to store this community')
  }
  const id = randomUUID()
  const request = {
    id,
    operation: 'qss-storage',
    runId: run.runId,
    teamId,
    ...(afterSyncSeq === undefined ? {} : { afterSyncSeq }),
  }
  const temporary = path.join(run.directory, 'requests', `${id}.tmp`)
  fs.writeFileSync(temporary, JSON.stringify(request), { flag: 'wx', mode: 0o600 })
  fs.renameSync(temporary, path.join(run.directory, 'requests', `${id}.json`))
  const filename = path.join(run.directory, 'responses', `${id}.json`)
  const deadline = Date.now() + 60000
  do {
    if (fs.existsSync(filename)) {
      requireCondition(!fs.lstatSync(filename).isSymbolicLink(), 'Server proof must not be a symlink')
      const response = readJson(filename)
      requireCondition(response.id === id && response.ok === true, 'Owned fixture inspection failed')
      return validateStorageProof(response.result, run.runId, teamId, fixtureProject, { afterSyncSeq })
    }
    await new Promise(resolve => setTimeout(resolve, 250))
  } while (Date.now() < deadline)
  throw new Error('Timed out waiting for the owned fixture storage inspector')
}

module.exports = {
  ENDPOINT,
  TEST_SITE_KEY,
  parseQssInvitation,
  validateBuild,
  validateFixture,
  checkLiveFixture,
  prepareRun,
  writeProof,
  waitForServerProof,
  validateStorageProof,
}
