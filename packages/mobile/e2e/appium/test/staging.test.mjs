import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { checkStaging, STAGING_ENDPOINT, CI_ENROLLMENT_AUDIENCE, writeCiEnrollmentToken, validateStagingTarget } from '../staging.mjs'

const requireBackend = createRequire(new URL('../../../../backend/package.json', import.meta.url))
const { Server } = requireBackend('socket.io')
const { io } = requireBackend('socket.io-client')
const require = createRequire(import.meta.url)
const { parseQssInvitation } = require('../../utils/qssCommunity.cjs')

async function fixture(t, { healthy = true, siteKey = 'live-hcaptcha-site-key', enabled = true, audience = CI_ENROLLMENT_AUDIENCE } = {}) {
  const server = createServer((_req, response) => {
    response.writeHead(healthy ? 200 : 503, { 'content-type': 'application/json' })
    response.end(JSON.stringify({ status: 'ok', details: { postgres: { status: 'up' } } }))
  })
  const sockets = new Server(server)
  const requests = []
  sockets.on('connection', socket => {
    socket.on('get-captcha-site-key', (_message, reply) => {
      requests.push('site-key')
      reply({ status: 'success', payload: { siteKey, ciEnrollment: { enabled, audience } } })
    })
    socket.on('verify-captcha', (message, reply) => {
      requests.push('verify')
      assert.equal(message.payload.token, '10000000-aaaa-bbbb-cccc-000000000001')
      reply({ status: 'error' })
    })
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  t.after(() => new Promise(resolve => sockets.close(resolve)))
  const address = `http://127.0.0.1:${server.address().port}`
  const options = {
    fetchHealth: (url, options) => {
      assert.equal(url, 'https://qss-dev.quiet-services.app/health')
      return fetch(`${address}/health`, options)
    },
    connect: (url, options) => {
      assert.equal(url, STAGING_ENDPOINT)
      return io(address, options)
    },
  }
  return { options, requests }
}

test('staging preflight checks real HTTP health and Socket.IO enrollment responses', async t => {
  const f = await fixture(t)
  assert.deepEqual(await checkStaging(f.options), { target: 'staging', endpoint: STAGING_ENDPOINT, healthy: true, automatedEnrollment: true })
  assert.deepEqual(f.requests, ['site-key'])
})

test('public staging rejects test hCaptcha configuration', async t => {
  const f = await fixture(t, { siteKey: '10000000-ffff-ffff-ffff-000000000001' })
  await assert.rejects(checkStaging(f.options), /must retain live hCaptcha/)
  assert.deepEqual(f.requests, ['site-key'])
})

test('live captcha without authenticated CI enrollment fails before the expensive builds', async t => {
  const f = await fixture(t, { enabled: false })
  await assert.rejects(checkStaging(f.options), /CI enrollment is not deployed or enabled/)
})

test('an unhealthy deployment stops before enrollment', async t => {
  const f = await fixture(t, { healthy: false })
  await assert.rejects(checkStaging(f.options), /health request failed/)
  assert.deepEqual(f.requests, [])
})

test('OIDC retrieval uses the staging audience and writes only a private runtime file', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'quiet-ci-oidc-'))
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }))
  const filename = path.join(directory, 'ci-enrollment.jwt')
  let responseStatus = 200
  const server = createServer((req, response) => {
    assert.equal(req.headers.authorization, 'Bearer runner-request-sentinel')
    assert.equal(new URL(req.url, 'http://localhost').searchParams.get('audience'), CI_ENROLLMENT_AUDIENCE)
    response.writeHead(responseStatus, { 'content-type': 'application/json' })
    response.end(JSON.stringify({ value: 'header.claims.signature', diagnostic: 'private-response-sentinel' }))
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  t.after(() => new Promise(resolve => server.close(resolve)))
  const env = { GITHUB_ACTIONS: 'true', ACTIONS_ID_TOKEN_REQUEST_URL: 'https://oidc.actions.githubusercontent.com/job',
    ACTIONS_ID_TOKEN_REQUEST_TOKEN: 'runner-request-sentinel' }
  const request = (url, options) => {
    assert.equal(url.origin, 'https://oidc.actions.githubusercontent.com')
    assert.equal(options.redirect, 'error')
    return fetch(`http://127.0.0.1:${server.address().port}${url.pathname}${url.search}`, options)
  }
  await writeCiEnrollmentToken(filename, { env, request })
  assert.equal(fs.readFileSync(filename, 'utf8'), 'quiet-ci-oidc:header.claims.signature')
  if (process.platform !== 'win32') assert.equal(fs.statSync(filename).mode & 0o777, 0o600)
  await assert.rejects(writeCiEnrollmentToken(filename, { env, request }), /EEXIST/)
  responseStatus = 403
  await assert.rejects(writeCiEnrollmentToken(path.join(directory, 'failed-token'), { env, request }), error => {
    assert.equal(error.message, 'Could not obtain the GitHub CI enrollment identity')
    return true
  })
  assert.equal(fs.existsSync(path.join(directory, 'failed-token')), false)
  await assert.rejects(writeCiEnrollmentToken(filename, { env: {} }), /trusted GitHub/)
})

test('staging cannot silently become production, local onboarding, or another run', () => {
  const fixture = { target: 'staging', endpoint: STAGING_ENDPOINT, runId: 'ci-notif-01234567-0123-4123-8123-0123456789ab' }
  assert.equal(validateStagingTarget(fixture, true), fixture)
  assert.throws(() => validateStagingTarget(fixture, false), /only by the real provider lane/)
  for (const endpoint of ['ws://localhost:3003', 'wss://qss-prod.quiet-services.app', 'wss://other.invalid']) {
    assert.throws(() => validateStagingTarget({ ...fixture, endpoint }, true), /configured staging/)
  }
})

test('the real invitation parser binds the test community to staging without weakening local tests', () => {
  const community = 'ci-notif-0123456789'
  const auth = new URLSearchParams({ c: community, t: '123456789ABCDEFGHJKLMNPQRSTUVWXYZ', s: '1234567890abcdef', l: 'fedcba0987654321' })
  const invitation = endpoint => 'https://tryquiet.org/join#' + new URLSearchParams({
    v: 'v5', q: 'true', e: Buffer.from(endpoint).toString('base64url'),
    a: Buffer.from(auth.toString()).toString('base64url'), k: Buffer.alloc(32, 7).toString('base64'),
  })
  assert.equal(parseQssInvitation(invitation(STAGING_ENDPOINT), community, STAGING_ENDPOINT).endpoint, STAGING_ENDPOINT)
  assert.throws(() => parseQssInvitation(invitation(STAGING_ENDPOINT), community))
  assert.throws(() => parseQssInvitation(invitation('wss://qss-prod.quiet-services.app'), community, STAGING_ENDPOINT))
})
