// Deliberately failing child-process input for safe-reporter.test.mjs.
import test from 'node:test'
import assert from 'node:assert/strict'
const secret = process.env.REPORTER_TEST_SECRET
if (!secret) throw new Error('Run this fixture through safe-reporter.test.mjs')
test(`private title ${secret}`, () => assert.equal(secret, 'different private assertion value'))
test('cleanup fails after the body passed', t => {
  t.after(() => { throw new Error(`cleanup credential ${secret}`) })
})
test('unrecognized errors remain private', () => {
  const error = new Error(secret)
  error.name = secret
  error.code = secret
  error.failureType = secret
  throw error
})
test('passing body', () => {})
