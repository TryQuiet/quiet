import test from 'node:test'
import assert from 'node:assert/strict'
import { validateProviderFixture } from '../config.mjs'

function receipt(pushNotifications, pushPlatforms = []) {
  const manifest = { endpoint: 'ws://localhost:3003', productionQss: false, project: 'quiet-qss-e2e-abcdef123456', pushNotifications, pushPlatforms }
  return { manifest, result: { manifest: structuredClone(manifest), status: 'passed', health: { details: { postgres: { status: 'up' } } }, probe: { testSiteKey: true, missingTokenRejected: true, publicTestTokenVerified: true } } }
}
test('full-loop lane fails with the real messaging fixture receipt instead of silently injecting push', () => {
  assert.throws(() => validateProviderFixture(receipt(false), 'android', true), /real Firebase/)
  assert.throws(() => validateProviderFixture(receipt(true, ['ios']), 'android', true), /android Firebase/)
  assert.throws(() => validateProviderFixture(receipt(true, ['android']), 'ios', true), /ios Firebase/)
  assert.doesNotThrow(() => validateProviderFixture(receipt(true, ['android', 'ios']), 'android', true))
})
test('a stale result cannot authorize a newly push-enabled configuration', () => {
  const stale = receipt(false)
  stale.manifest.pushNotifications = true
  stale.manifest.pushPlatforms = ['android']
  assert.throws(() => validateProviderFixture(stale, 'android', true), /receipt/)
})
test('onboarding smoke refuses provider credentials and never substitutes for the full-loop lane', () => {
  assert.doesNotThrow(() => validateProviderFixture(receipt(false), 'android', false))
  assert.throws(() => validateProviderFixture(receipt(true, ['android']), 'android', false), /push-disabled/)
})
