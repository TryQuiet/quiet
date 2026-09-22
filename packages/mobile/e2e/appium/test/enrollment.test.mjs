import test from 'node:test'
import assert from 'node:assert/strict'
import { enrollmentMode } from '../enrollment.mjs'
import { writeCiEnrollmentToken, STAGING_ENDPOINT } from '../staging.mjs'

const config = { qssTarget: 'staging', stagingEnrollment: 'manual' }
const fixture = { target: 'staging', endpoint: STAGING_ENDPOINT }

test('manual enrollment requires an explicit local live-staging selection', () => {
  assert.equal(enrollmentMode(config, fixture, {}), 'manual')
  for (const env of [{ GITHUB_ACTIONS: 'true' }, { CI: 'true' },
    { QUIET_QSS_LOCAL_FIXTURE_OUTPUT: '/local' }, { QUIET_E2E_QSS_ONLY: 'true' }]) {
    assert.throws(() => enrollmentMode(config, fixture, env))
  }
  assert.throws(() => enrollmentMode({ stagingEnrollment: 'manual' }, fixture, {}))
  assert.throws(() => enrollmentMode(config, { target: 'local', endpoint: STAGING_ENDPOINT }, {}))
  assert.throws(() => enrollmentMode(config, { ...fixture, endpoint: 'wss://qss-prod.quiet-services.app' }, {}))
  assert.throws(() => enrollmentMode({ stagingEnrollment: 'typo' }, fixture, {}))
})

test('default staging enrollment remains OIDC and refuses local token minting before any request', async () => {
  assert.equal(enrollmentMode({}, fixture, {}), 'github-oidc')
  assert.equal(enrollmentMode({}, { target: 'local' }, {}), 'local-fixture')
  let requested = false
  await assert.rejects(writeCiEnrollmentToken('/unused', {
    env: {}, request: () => { requested = true; throw new Error('must not request') },
  }), /trusted GitHub Actions/)
  assert.equal(requested, false)
})
