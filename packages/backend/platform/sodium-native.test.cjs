'use strict'
const test = require('node:test')
const assert = require('node:assert/strict')
const path = require('node:path')
const {createRequire} = require('node:module')
const fromLfa = createRequire(path.resolve(__dirname, '../../../3rd-party/auth/packages/crypto/package.json'))
const sodium = require(process.env.QUIET_NATIVE_TEST_SODIUM || fromLfa.resolve('libsodium-wrappers-sumo'))
const binding = require('./native-libsodium/.build/host/quiet_sodium.node')
require('./sodium-native.checks.cjs').register(test, async () => sodium, binding)

test('native boundary rejects malformed, detached and shared memory without crashing', () => {
  for (const value of [undefined, null, {}, [], new Uint16Array(32), new Uint8Array(31), 'a'.repeat(32)]) {
    assert.throws(() => binding.crypto_sign_seed_keypair(value))
    assert.throws(() => binding.crypto_scalarmult_base(value))
  }
  assert.throws(() => binding.crypto_sign_seed_keypair())
  const shared = new Uint8Array(new SharedArrayBuffer(32))
  assert.throws(() => binding.crypto_sign_seed_keypair(shared))
  const detached = new Uint8Array(32)
  structuredClone(detached, {transfer: [detached.buffer]})
  assert.throws(() => binding.crypto_sign_seed_keypair(detached))
  const sk = new Uint8Array(32), pk = binding.crypto_scalarmult_base(sk)
  assert.throws(() => binding.crypto_box_open_easy(new Uint8Array(15), new Uint8Array(24), pk, sk))
  // Allocated outputs must not alias input or each other.
  const pair = binding.crypto_sign_seed_keypair(sk)
  const expected = Uint8Array.from(pair.privateKey)
  pair.publicKey.fill(0); sk.fill(99)
  assert.deepEqual(pair.privateKey, expected)
})

test('missing library and broken capability keep all original operations', async () => {
  await sodium.ready
  const {enable} = require('./sodium-native.cjs')
  for (const load of [() => {throw new Error('dlopen failed')}, () => ({version: '1.0.19'}), () => ({version: 'future'})]) {
    const copy = {...sodium}, original = {...copy}, warnings = []
    enable(copy, {platform: 'ios', load, warn: message => warnings.push(message)})
    await copy.ready
    assert.equal(warnings.length, 1)
    for (const key of Object.keys(original)) if (key !== 'ready') assert.equal(copy[key], original[key])
  }
})
