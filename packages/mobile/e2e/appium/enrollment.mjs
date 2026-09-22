import assert from 'node:assert/strict'
import { STAGING_ENDPOINT } from './staging.mjs'

// Manual enrollment is a local operator solving the normal live hCaptcha.
// It is never an alternative authentication path for unattended CI.
export function enrollmentMode(config, fixture, env = process.env) {
  const mode = config.stagingEnrollment ?? 'github-oidc'
  assert(['github-oidc', 'manual'].includes(mode), 'Unknown stagingEnrollment mode')
  if (mode === 'manual') {
    assert.equal(config.qssTarget, 'staging', 'Manual enrollment requires explicit staging configuration')
    assert.equal(fixture.target, 'staging', 'Manual enrollment requires a staging fixture')
    assert.equal(fixture.endpoint, STAGING_ENDPOINT, 'Manual enrollment requires the staging endpoint')
    assert.notEqual(env.GITHUB_ACTIONS, 'true', 'Manual enrollment is forbidden in GitHub Actions')
    assert.notEqual(env.CI, 'true', 'Manual enrollment requires a local interactive run')
    assert.equal(env.QUIET_QSS_LOCAL_FIXTURE_OUTPUT, undefined, 'Do not mix manual staging enrollment with a local fixture')
    assert.notEqual(env.QUIET_E2E_QSS_ONLY, 'true', 'Manual enrollment requires a native-Tor desktop build')
  }
  return fixture.target === 'staging' ? mode : 'local-fixture'
}
