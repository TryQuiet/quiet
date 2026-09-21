import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'

const require = createRequire(import.meta.url)
export const STAGING_ENDPOINT = 'wss://qss-dev.quiet-services.app'
export const CI_ENROLLMENT_AUDIENCE = 'https://qss-dev.quiet-services.app/ci-enrollment'
const TEST_SITE_KEY = '10000000-ffff-ffff-ffff-000000000001'

export function validateStagingTarget(fixture, fullLoop) {
  assert.equal(fullLoop, true, 'Staging is used only by the real provider lane')
  assert.equal(fixture.target, 'staging')
  assert.equal(fixture.endpoint, STAGING_ENDPOINT, 'Use the configured staging QSS endpoint')
  assert.match(fixture.runId, /^ci-notif-[a-f0-9-]{36}$/)
  return fixture
}

export async function checkStaging({ fetchHealth = globalThis.fetch, connect } = {}) {
  const response = await fetchHealth('https://qss-dev.quiet-services.app/health', { signal: AbortSignal.timeout(10000) })
  assert.equal(response.status, 200, 'Staging QSS health request failed')
  const health = await response.json()
  assert.equal(health.status, 'ok', 'Staging QSS is unhealthy')
  assert.equal(health.details?.postgres?.status, 'up', 'Staging QSS storage is unhealthy')
  const io = connect || require('socket.io-client').io
  const socket = io(STAGING_ENDPOINT, { transports: ['websocket'], autoConnect: false, reconnection: false, timeout: 10000 })
  try {
    await new Promise((resolve, reject) => {
      socket.once('connect', resolve)
      socket.once('connect_error', () => reject(new Error('Staging QSS websocket preflight failed')))
      socket.connect()
    })
    const request = (event, payload) => socket.timeout(15000).emitWithAck(event, { ts: Date.now(), status: 'sending', ...(payload ? { payload } : {}) })
    const site = await request('get-captcha-site-key')
    assert.equal(site.status, 'success', 'Staging did not provide its enrollment configuration')
    assert(site.payload?.siteKey && site.payload.siteKey !== TEST_SITE_KEY, 'Public staging must retain live hCaptcha')
    assert.equal(site.payload.ciEnrollment?.enabled, true,
      'Authenticated staging CI enrollment is not deployed or enabled; keep public hCaptcha enabled')
    assert.equal(site.payload.ciEnrollment.audience, CI_ENROLLMENT_AUDIENCE)
    return { target: 'staging', endpoint: STAGING_ENDPOINT, healthy: true, automatedEnrollment: true }
  } finally {
    socket.disconnect()
  }
}

export async function writeCiEnrollmentToken(filename, { env = process.env, request = globalThis.fetch } = {}) {
  assert(env.GITHUB_ACTIONS === 'true', 'Staging enrollment requires a trusted GitHub Actions run')
  assert(env.ACTIONS_ID_TOKEN_REQUEST_URL && env.ACTIONS_ID_TOKEN_REQUEST_TOKEN, 'The provider job needs id-token: write')
  const url = new URL(env.ACTIONS_ID_TOKEN_REQUEST_URL)
  assert.equal(url.protocol, 'https:')
  assert(!url.username && !url.password && !url.hash)
  url.searchParams.set('audience', CI_ENROLLMENT_AUDIENCE)
  let value
  try {
    const response = await request(url, {
      headers: { Authorization: `Bearer ${env.ACTIONS_ID_TOKEN_REQUEST_TOKEN}` },
      signal: AbortSignal.timeout(10000), redirect: 'error',
    })
    if (!response.ok) throw new Error('OIDC request failed')
    value = (await response.json()).value
    if (typeof value !== 'string' || value.length > 16384 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(value)) throw new Error('Invalid OIDC response')
  } catch {
    throw new Error('Could not obtain the GitHub CI enrollment identity')
  }
  fs.writeFileSync(filename, `quiet-ci-oidc:${value}`, { flag: 'wx', mode: 0o600 })
}

export async function prepareStagingRun(directory) {
  assert(directory && path.isAbsolute(directory), 'Use an absolute private staging run directory')
  const preflight = await checkStaging()
  fs.mkdirSync(directory, { mode: 0o700 })
  const fixture = { version: 1, runId: `ci-notif-${randomUUID()}`, target: 'staging', endpoint: STAGING_ENDPOINT, preflight }
  fs.writeFileSync(path.join(directory, 'fixture.json'), JSON.stringify(fixture), { flag: 'wx', mode: 0o600 })
  return fixture
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    if (process.argv[2] === '--prepare') {
      await prepareStagingRun(process.argv[3])
      console.log('Prepared dedicated staging notification run')
    } else {
      console.log(JSON.stringify(await checkStaging()))
    }
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
