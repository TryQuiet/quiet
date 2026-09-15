'use strict'

// iOS Node Mobile cannot JIT libsodium's JavaScript fallback. Keep sodium's
// wire formats and symmetric primitives; move the elliptic-curve operations to
// the OpenSSL implementation already shipped in Node. No new native addon.
const crypto = require('node:crypto')
const { Buffer } = require('node:buffer')
const { types } = require('node:util')
const ED_PRIVATE = Buffer.from('302e020100300506032b657004220420', 'hex')
const ED_PUBLIC = Buffer.from('302a300506032b6570032100', 'hex')
const X_PRIVATE = Buffer.from('302e020100300506032b656e04220420', 'hex')
const X_PUBLIC = Buffer.from('302a300506032b656e032100', 'hex')
const ZERO16 = new Uint8Array(16)
const SIGMA = Buffer.from('expand 32-byte k')
const PRIME = Buffer.from('edffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff7f', 'hex')
const ORDER = Buffer.from('edd3f55c1a631258d69cf7a2def9de1400000000000000000000000000000010', 'hex')
// The small-order encodings checked by libsodium's ge25519_has_small_order.
// The sign bit is ignored, as in libsodium. Noncanonical cases use sodium below.
const SMALL_ORDER = new Set([
  '00'.repeat(32), '01' + '00'.repeat(31),
  '26e8958fc2b227b045c3f489f2ef98f0d5dfac05d3c63339b13802886d53fc05',
  'c7176a703d4dd84fba3c0b760d10670f2a2053fa2c39ccc64ec7fd7792ac037a',
  'ec' + 'ff'.repeat(30) + '7f',
])

function bytes(value, size, name) {
  const result = typeof value === 'string' ? Buffer.from(value, 'utf8') : value
  if (!(result instanceof Uint8Array)) throw new TypeError(`${name} must be a Uint8Array or string`)
  if (size !== undefined && result.length !== size) throw new TypeError(`invalid ${name} length`)
  return result
}
function output(value, format, sodium) {
  if (format === undefined || format === 'uint8array') return Uint8Array.from(value)
  if (format === 'hex') return sodium.to_hex(value)
  if (format === 'base64') return sodium.to_base64(value)
  if (format === 'text') return sodium.to_string(value)
  throw new Error('unsupported output format')
}
function privateKey(prefix, secret) {
  const der = Buffer.concat([prefix, secret])
  try { return crypto.createPrivateKey({key: der, format: 'der', type: 'pkcs8'}) }
  finally { der.fill(0) }
}
function publicKey(prefix, key) {
  return crypto.createPublicKey({key: Buffer.concat([prefix, key]), format: 'der', type: 'spki'})
}
function publicBytes(key) { return crypto.createPublicKey(key).export({format: 'der', type: 'spki'}).subarray(-32) }
function lessThanLE(value, bound) {
  // Only public signature/key encodings reach this comparison.
  for (let i = 31; i >= 0; i--) if (value[i] !== bound[i]) return value[i] < bound[i]
  return false
}
function ordinaryPoint(value) {
  const y = Buffer.from(value)
  y[31] &= 0x7f
  return lessThanLE(y, PRIME) && !SMALL_ORDER.has(y.toString('hex'))
}

const installed = new WeakMap()
function supportedReceiver(sodium) {
  return sodium !== null && typeof sodium === 'object' &&
    !types.isProxy(sodium) && !types.isModuleNamespaceObject(sodium)
}
function install(sodium) {
  if (installed.has(sodium)) return installed.get(sodium)
  // Proxy traps and module namespaces do not have ordinary assignment semantics.
  if (!supportedReceiver(sodium)) throw new Error('unsupported sodium export object')
  // Verification policy is reviewed against this sodium implementation. A new
  // version must pass differential/security review before enabling its adapter.
  if (sodium.sodium_version_string() !== '1.0.19') throw new Error('unreviewed sodium version')
  const original = Object.fromEntries(Object.keys(sodium).filter(k => typeof sodium[k] === 'function').map(k => [k, sodium[k]]))
  const rawSignPair = seed => {
    const pk = publicBytes(privateKey(ED_PRIVATE, seed))
    return {publicKey: pk, privateKey: Buffer.concat([seed, pk]), keyType: 'ed25519'}
  }
  const sharedKey = (pk, sk) => {
    const shared = crypto.diffieHellman({privateKey: privateKey(X_PRIVATE, bytes(sk, 32, 'privateKey')), publicKey: publicKey(X_PUBLIC, bytes(pk, 32, 'publicKey'))})
    try { return original.crypto_core_hsalsa20(ZERO16, shared, SIGMA) }
    finally { shared.fill(0) }
  }
  const overrides = {
    crypto_sign_seed_keypair(seed, format) {
      const pair = rawSignPair(bytes(seed, 32, 'seed'))
      try { return {publicKey: output(pair.publicKey, format, sodium), privateKey: output(pair.privateKey, format, sodium), keyType: pair.keyType} }
      finally { pair.privateKey.fill(0) }
    },
    crypto_scalarmult_base(secret, format) {
      return output(publicBytes(privateKey(X_PRIVATE, bytes(secret, 32, 'scalar'))), format, sodium)
    },
    crypto_sign_detached(message, secret, format) {
      const sk = bytes(secret, 64, 'privateKey')
      const key = privateKey(ED_PRIVATE, sk.subarray(0, 32))
      // Sodium uses the public half of a 64-byte secret key while Node derives it.
      // Preserve sodium semantics for malformed keys instead of silently repairing.
      if (!crypto.timingSafeEqual(publicBytes(key), sk.subarray(32))) return original.crypto_sign_detached(message, secret, format)
      return output(crypto.sign(null, bytes(message, undefined, 'message'), key), format, sodium)
    },
    crypto_sign_verify_detached(signature, message, key) {
      const sig = bytes(signature, 64, 'signature')
      const pk = bytes(key, 32, 'publicKey')
      const msg = bytes(message, undefined, 'message')
      // OpenSSL accepts some small-order Ed25519 inputs rejected by sodium.
      // Let sodium decide all exceptional encodings, retaining the exact policy.
      if (!ordinaryPoint(pk) || !ordinaryPoint(sig.subarray(0, 32)) || !lessThanLE(sig.subarray(32), ORDER)) {
        return original.crypto_sign_verify_detached(signature, message, key)
      }
      return crypto.verify(null, msg, publicKey(ED_PUBLIC, pk), sig)
    },
    crypto_box_easy(message, nonce, pk, sk, format) {
      const shared = sharedKey(pk, sk)
      try { return original.crypto_secretbox_easy(message, nonce, shared, format) }
      finally { shared.fill(0) }
    },
    crypto_box_open_easy(cipher, nonce, pk, sk, format) {
      const shared = sharedKey(pk, sk)
      try { return original.crypto_secretbox_open_easy(cipher, nonce, shared, format) }
      finally { shared.fill(0) }
    },
  }
  // Probe the actual runtime before installing anything. Unsupported runtimes
  // keep the original sodium implementation atomically, never a partial adapter.
  const seed = Buffer.alloc(32, 7)
  const pair = overrides.crypto_sign_seed_keypair(seed)
  const sodiumPair = original.crypto_sign_seed_keypair(seed)
  if (!crypto.timingSafeEqual(pair.publicKey, sodiumPair.publicKey) || !crypto.timingSafeEqual(pair.privateKey, sodiumPair.privateKey)) throw new Error('Ed25519 native self-test failed')
  const xp = overrides.crypto_scalarmult_base(seed)
  if (!crypto.timingSafeEqual(xp, original.crypto_scalarmult_base(seed))) throw new Error('X25519 native self-test failed')
  const message = Buffer.from('Quiet native crypto self-test')
  const sig = overrides.crypto_sign_detached(message, pair.privateKey)
  if (!original.crypto_sign_verify_detached(sig, message, pair.publicKey) || !overrides.crypto_sign_verify_detached(original.crypto_sign_detached(message, pair.privateKey), message, pair.publicKey)) throw new Error('native signature self-test failed')
  const altered = Buffer.from(message); altered[0] ^= 1
  if (overrides.crypto_sign_verify_detached(sig, altered, pair.publicKey)) throw new Error('native signature tamper self-test failed')
  const nonce = new Uint8Array(24)
  const cipher = overrides.crypto_box_easy(message, nonce, xp, seed)
  if (!crypto.timingSafeEqual(cipher, original.crypto_box_easy(message, nonce, xp, seed)) || !crypto.timingSafeEqual(overrides.crypto_box_open_easy(cipher, nonce, xp, seed), message)) throw new Error('native box self-test failed')
  pair.privateKey.fill(0); sodiumPair.privateKey.fill(0); seed.fill(0)
  // On a non-Proxy object, existing writable own data properties cannot invoke
  // setters or reject assignment. Check every export immediately before mutation;
  // there are no callbacks or awaits between this preflight and installation.
  for (const name of Object.keys(overrides)) {
    const descriptor = Object.getOwnPropertyDescriptor(sodium, name)
    if (!descriptor || descriptor.writable !== true || typeof descriptor.value !== 'function') {
      throw new Error(`unsupported sodium export: ${name}`)
    }
  }
  Object.assign(sodium, overrides)
  const result = Object.freeze({enabled: true, backend: 'node-openssl', functions: Object.keys(overrides)})
  installed.set(sodium, result)
  return result
}

function enable(sodium, {platform = process.platform, warn = console.warn} = {}) {
  if (platform !== 'ios') return sodium
  const fallback = () => warn('Quiet: native iOS crypto unavailable; using libsodium fallback')
  // Reject unsupported receivers before touching ready: its get/set could throw,
  // or scheduling installation before a rejected ready assignment could install
  // asynchronously even after reporting fallback.
  const ready = supportedReceiver(sodium) && Object.getOwnPropertyDescriptor(sodium, 'ready')
  if (!ready || ready.writable !== true || !types.isPromise(ready.value)) {
    fallback()
    return sodium
  }
  let activated = false
  try {
    const nextReady = Promise.prototype.then.call(ready.value, () => {
      // Promise species constructors can run while attaching this callback. If
      // one makes ready unwritable, the queued callback must remain a no-op.
      if (!activated) return
      try { install(sodium) }
      catch { fallback() }
    })
    sodium.ready = nextReady
    activated = true
  } catch { fallback() }
  return sodium
}
module.exports = {enable, install}
