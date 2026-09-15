'use strict'
const { Buffer } = require('node:buffer')
const { types } = require('node:util')
const path = require('node:path')

// Webpack preserves __dirname for this node target: bundle.cjs lives in nodejs-project.
// Load from the signed app bundle, never its writable Documents directory.
function loadBinding() {
  const filename = path.join(__dirname, '..', 'Frameworks', 'QuietSodium.framework', 'QuietSodium')
  const nativeModule = { exports: {} }
  process.dlopen(nativeModule, filename)
  return nativeModule.exports
}
function bytes(value, sodium) {
  if (typeof value === 'string') return sodium.from_string(value)
  if (!(value instanceof Uint8Array)) throw new TypeError('Expected Uint8Array or string')
  return value
}
function output(value, format, sodium) {
  if (format === undefined || format === 'uint8array') return value
  if (format === 'hex') return sodium.to_hex(value)
  if (format === 'base64') return sodium.to_base64(value)
  if (format === 'text') return sodium.to_string(value)
  throw new Error('unsupported output format')
}
const installed = new WeakMap()
function supportedReceiver(sodium) {
  return sodium !== null && typeof sodium === 'object' &&
    !types.isProxy(sodium) && !types.isModuleNamespaceObject(sodium)
}
function install(sodium, binding) {
  if (installed.has(sodium)) return installed.get(sodium)
  if (!supportedReceiver(sodium)) throw new Error('unsupported sodium export object')
  if (sodium.sodium_version_string() !== '1.0.19' || binding.version !== '1.0.19') throw new Error('unreviewed sodium version')
  const overrides = {}
  for (const [name, count] of [
    ['crypto_sign_seed_keypair', 1], ['crypto_scalarmult_base', 1],
    ['crypto_sign_detached', 2], ['crypto_sign_verify_detached', 3],
    ['crypto_box_easy', 4], ['crypto_box_open_easy', 4],
  ]) {
    if (typeof binding[name] !== 'function') throw new Error(`Missing native export: ${name}`)
    overrides[name] = (...args) => {
      const result = binding[name](...Array.from({length: count}, (_, i) => bytes(args[i], sodium)))
      if (name === 'crypto_sign_verify_detached') return result
      if (name === 'crypto_sign_seed_keypair') {
        if (args[count] === undefined || args[count] === 'uint8array') return {...result, keyType: 'ed25519'}
        try {
          return {publicKey: output(result.publicKey, args[count], sodium), privateKey: output(result.privateKey, args[count], sodium), keyType: 'ed25519'}
        } finally { result.privateKey.fill(0) }
      }
      return output(result, args[count], sodium)
    }
  }
  // Check the actual linked library before publishing any replacement functions.
  const seed = new Uint8Array(32).fill(7), message = new Uint8Array([1, 2, 3]), nonce = new Uint8Array(24)
  const pair = overrides.crypto_sign_seed_keypair(seed), original = sodium.crypto_sign_seed_keypair(seed)
  try {
    const equal = (a, b) => Buffer.from(a).equals(Buffer.from(b))
    if (!equal(pair.privateKey, original.privateKey) || !equal(pair.publicKey, original.publicKey)) throw new Error('Native keypair mismatch')
    const pk = overrides.crypto_scalarmult_base(seed)
    const sig = overrides.crypto_sign_detached(message, pair.privateKey)
    if (!equal(pk, sodium.crypto_scalarmult_base(seed)) || !equal(sig, sodium.crypto_sign_detached(message, original.privateKey)) ||
        !overrides.crypto_sign_verify_detached(sig, message, pair.publicKey)) throw new Error('Native signature mismatch')
    if (overrides.crypto_sign_verify_detached(sig, new Uint8Array([2]), pair.publicKey)) throw new Error('Native tamper check failed')
    const cipher = overrides.crypto_box_easy(message, nonce, pk, seed)
    if (!equal(cipher, sodium.crypto_box_easy(message, nonce, pk, seed)) ||
        !equal(overrides.crypto_box_open_easy(cipher, nonce, pk, seed), message)) throw new Error('Native box mismatch')
  } finally { pair.privateKey.fill(0); original.privateKey.fill(0); seed.fill(0) }
  for (const name of Object.keys(overrides)) {
    const descriptor = Object.getOwnPropertyDescriptor(sodium, name)
    if (!descriptor || descriptor.writable !== true || typeof descriptor.value !== 'function') throw new Error(`unsupported sodium export: ${name}`)
  }
  Object.assign(sodium, overrides)
  const result = Object.freeze({enabled: true, backend: 'libsodium', version: binding.version, functions: Object.keys(overrides)})
  installed.set(sodium, result)
  return result
}

function enable(sodium, {platform = process.platform, warn = console.warn, load = loadBinding} = {}) {
  if (platform !== 'ios') return sodium
  const fallback = () => warn('Quiet: native iOS crypto unavailable; using libsodium fallback')
  // Reject unsupported receivers before touching ready: its get/set could throw,
  // or scheduling installation before a rejected ready assignment could install
  // asynchronously even after reporting fallback.
  const ready = supportedReceiver(sodium) && Object.getOwnPropertyDescriptor(sodium, 'ready')
  if (!ready || ready.writable !== true || !types.isPromise(ready.value) ||
      Object.getPrototypeOf(ready.value) !== Promise.prototype || Object.hasOwn(ready.value, 'constructor')) {
    // The pinned wrapper uses an ordinary Promise. Custom constructors/species
    // can run callbacks during then(), so retain sodium for those receivers.
    fallback()
    return sodium
  }
  let activated = false
  try {
    const nextReady = Promise.prototype.then.call(ready.value, () => {
      // Only completed publication of the readiness promise arms installation.
      if (!activated) return
      try { install(sodium, load()) }
      catch { fallback() }
    })
    sodium.ready = nextReady
    activated = true
  } catch { fallback() }
  return sodium
}
module.exports = {enable, install}
