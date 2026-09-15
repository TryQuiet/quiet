'use strict'
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const {install, enable} = require('./sodium-native.cjs')
const hex = value => Buffer.from(value, 'hex')
const invoke = fn => { try { return {value: fn()} } catch { return {error: true} } }
const vector = name => JSON.parse(fs.readFileSync(path.join(__dirname, 'test-vectors', name + '.json')))

// Shared by Node's test runner and the physical-iPhone harness.
exports.register = function register(test, loadSodium) {
let sodium, original, native
test.before(async () => {
  sodium = await loadSodium()
  await sodium.ready
  original = {...sodium}
  native = {...sodium}
  install(native)
})

test('differential reference remains original sodium, not another native adapter', () => {
  const crypto = require('node:crypto')
  const createPrivateKey = crypto.createPrivateKey
  let nativeCalls = 0
  crypto.createPrivateKey = function (...args) {
    nativeCalls++
    return createPrivateKey.apply(this, args)
  }
  try {
    const seed = new Uint8Array(32).fill(4)
    original.crypto_scalarmult_base(seed)
    original.crypto_sign_seed_keypair(seed)
    assert.equal(nativeCalls, 0, 'reference must not use the native adapter')
    native.crypto_scalarmult_base(seed)
    native.crypto_sign_seed_keypair(seed)
    assert.equal(nativeCalls, 2, 'adapter must use native crypto')
  } finally { crypto.createPrivateKey = createPrivateKey }
})

test('Ed25519 and X25519 outputs interoperate, including offsets, mutation, and reused buffers', () => {
  for (let i = 0; i < 32; i++) {
    const backing = new Uint8Array(40).fill(i)
    const seed = backing.subarray(4, 36)
    const before = Uint8Array.from(backing)
    for (const format of [undefined, 'uint8array', 'hex', 'base64']) {
      assert.deepEqual(invoke(() => native.crypto_sign_seed_keypair(seed, format)), invoke(() => original.crypto_sign_seed_keypair(seed, format)))
      assert.deepEqual(invoke(() => native.crypto_scalarmult_base(seed, format)), invoke(() => original.crypto_scalarmult_base(seed, format)))
    }
    const pair = native.crypto_sign_seed_keypair(seed)
    const msg = Buffer.from('message: ' + i + ' 🌲')
    const sig = native.crypto_sign_detached(msg, pair.privateKey)
    assert.deepEqual(sig, original.crypto_sign_detached(msg, pair.privateKey))
    assert.equal(original.crypto_sign_verify_detached(sig, msg, pair.publicKey), true)
    assert.equal(native.crypto_sign_verify_detached(sig, msg, pair.publicKey), true)
    msg[0] ^= 1
    assert.equal(native.crypto_sign_verify_detached(sig, msg, pair.publicKey), false)
    msg[0] ^= 1; sig[0] ^= 1
    assert.equal(native.crypto_sign_verify_detached(sig, msg, pair.publicKey), false)
    sig[0] ^= 1; pair.publicKey[0] ^= 1
    assert.equal(native.crypto_sign_verify_detached(sig, msg, pair.publicKey), false)
    assert.deepEqual(backing, before)
    seed[0] ^= 1
    assert.deepEqual(native.crypto_sign_seed_keypair(seed), original.crypto_sign_seed_keypair(seed))
    assert.notDeepEqual(native.crypto_sign_seed_keypair(seed).publicKey, pair.publicKey)
  }
})

test('malformed Ed25519 secret/public halves preserve sodium behavior instead of being repaired', () => {
  const keys = native.crypto_sign_seed_keypair(new Uint8Array(32).fill(3))
  const message = Buffer.from('must remain invalid')
  keys.privateKey[50] ^= 1
  const signature = native.crypto_sign_detached(message, keys.privateKey)
  assert.deepEqual(signature, original.crypto_sign_detached(message, keys.privateKey))
  assert.equal(native.crypto_sign_verify_detached(signature, message, keys.publicKey), false)
  const expected = original.crypto_sign_seed_keypair(keys.privateKey.subarray(0, 32))
  assert.notDeepEqual(expected.privateKey, keys.privateKey)
})

test('box ciphertext is byte-identical, bidirectional, and rejects changed ciphertext/nonces/keys', () => {
  for (const length of [0, 1, 32, 4096]) {
    const sender = original.crypto_box_keypair(), receiver = original.crypto_box_keypair()
    const nonce = original.randombytes_buf(24), message = original.randombytes_buf(length)
    const c = native.crypto_box_easy(message, nonce, receiver.publicKey, sender.privateKey)
    assert.deepEqual(c, original.crypto_box_easy(message, nonce, receiver.publicKey, sender.privateKey))
    assert.deepEqual(native.crypto_box_open_easy(c, nonce, sender.publicKey, receiver.privateKey), message)
    assert.deepEqual(original.crypto_box_open_easy(c, nonce, sender.publicKey, receiver.privateKey), message)
    c[0] ^= 1; assert.throws(() => native.crypto_box_open_easy(c, nonce, sender.publicKey, receiver.privateKey))
    c[0] ^= 1; nonce[0] ^= 1; assert.throws(() => native.crypto_box_open_easy(c, nonce, sender.publicKey, receiver.privateKey))
    nonce[0] ^= 1; sender.publicKey[0] ^= 1; assert.throws(() => native.crypto_box_open_easy(c, nonce, sender.publicKey, receiver.privateKey))
    sender.publicKey[0] ^= 1; receiver.privateKey[16] ^= 1; assert.throws(() => native.crypto_box_open_easy(c, nonce, sender.publicKey, receiver.privateKey))
  }
})

test('all 151 Wycheproof Ed25519 cases retain sodium acceptance and rejection', () => {
  let count = 0
  for (const group of vector('ed25519').testGroups) for (const item of group.tests) {
    const args = [hex(item.sig), hex(item.msg), hex(group.publicKey.pk)]
    const reference = invoke(() => original.crypto_sign_verify_detached(...args))
    assert.deepEqual(invoke(() => native.crypto_sign_verify_detached(...args)), reference, `tcId ${item.tcId}: ${item.comment}`)
    if (item.result === 'invalid') assert.notEqual(reference.value, true, `invalid tcId ${item.tcId}`)
    if (item.result === 'valid') assert.equal(reference.value, true, `valid tcId ${item.tcId}`)
    count++
  }
  assert.equal(count, 151)
})

test('all 518 Wycheproof X25519 cases retain sodium box output or rejection', () => {
  let count = 0
  for (const group of vector('x25519').testGroups) for (const item of group.tests) {
    const args = [Buffer.from('cross-platform'), new Uint8Array(24), hex(item.public), hex(item.private)]
    assert.deepEqual(invoke(() => native.crypto_box_easy(...args)), invoke(() => original.crypto_box_easy(...args)), `tcId ${item.tcId}: ${item.comment}`)
    count++
  }
  assert.equal(count, 518)
})

test('small-order and noncanonical signature encodings always defer to sodium', () => {
  const key = native.crypto_sign_seed_keypair(new Uint8Array(32).fill(9))
  const message = new Uint8Array()
  const small = ['00'.repeat(32), '01' + '00'.repeat(31),
    '26e8958fc2b227b045c3f489f2ef98f0d5dfac05d3c63339b13802886d53fc05',
    'c7176a703d4dd84fba3c0b760d10670f2a2053fa2c39ccc64ec7fd7792ac037a',
    ...['ec','ed','ee'].map(b => b + 'ff'.repeat(30) + '7f')]
  for (const value of small) for (const signBit of [0, 128]) {
    const point = hex(value); point[31] ^= signBit
    const sig = native.crypto_sign_detached(message, key.privateKey)
    sig.set(point, 0)
    assert.deepEqual(invoke(() => native.crypto_sign_verify_detached(sig, message, key.publicKey)), invoke(() => original.crypto_sign_verify_detached(sig, message, key.publicKey)))
    assert.deepEqual(invoke(() => native.crypto_sign_verify_detached(sig, message, point)), invoke(() => original.crypto_sign_verify_detached(sig, message, point)))
  }
  // A=identity, R=identity, S=0 can pass a permissive verifier for any message.
  const identity = new Uint8Array(32); identity[0] = 1
  const sig = new Uint8Array(64); sig[0] = 1
  assert.equal(native.crypto_sign_verify_detached(sig, message, identity), false)
  for (const scalar of [
    'edd3f55c1a631258d69cf7a2def9de1400000000000000000000000000000010',
    'eed3f55c1a631258d69cf7a2def9de1400000000000000000000000000000010',
    'ff'.repeat(32),
  ]) {
    const malformed = native.crypto_sign_detached(message, key.privateKey)
    malformed.set(hex(scalar), 32)
    assert.equal(original.crypto_sign_verify_detached(malformed, message, key.publicKey), false)
    assert.equal(native.crypto_sign_verify_detached(malformed, message, key.publicKey), false)
  }
})

test('invalid sizes, types and formats fail without accepting malformed inputs', () => {
  const pair = native.crypto_sign_seed_keypair(new Uint8Array(32))
  const scalar = new Uint8Array(32), nonce = new Uint8Array(24), message = new Uint8Array(8)
  const pub = native.crypto_scalarmult_base(scalar)
  for (const invalid of [undefined, null, {}, [], new Uint16Array(32), new Uint8Array(31), new Uint8Array(33)]) {
    for (const api of [original, native]) {
      assert.throws(() => api.crypto_sign_seed_keypair(invalid))
      assert.throws(() => api.crypto_scalarmult_base(invalid))
      assert.throws(() => api.crypto_box_easy(message, nonce, invalid, scalar))
    }
  }
  for (const api of [original, native]) {
    assert.throws(() => api.crypto_sign_detached(message, scalar))
    assert.throws(() => api.crypto_sign_verify_detached(new Uint8Array(63), message, pair.publicKey))
    assert.throws(() => api.crypto_box_open_easy(new Uint8Array(15), nonce, pub, scalar))
    assert.throws(() => api.crypto_box_easy(message, new Uint8Array(23), pub, scalar))
    assert.throws(() => api.crypto_sign_seed_keypair(scalar, 'unsupported'))
  }
})

test('iOS activates after ready, other platforms preserve sodium, and unsupported capability falls back atomically', async () => {
  for (const platform of ['linux', 'darwin', 'android', 'win32']) {
    const copy = {...original}
    const ready = copy.ready, fn = copy.crypto_sign_verify_detached
    assert.equal(enable(copy, {platform}), copy)
    assert.equal(copy.ready, ready); assert.equal(copy.crypto_sign_verify_detached, fn)
  }
  const copy = {...original}, fn = copy.crypto_sign_verify_detached
  enable(copy, {platform: 'ios'})
  await copy.ready
  assert.notEqual(copy.crypto_sign_verify_detached, fn)
  const installedFunction = copy.crypto_sign_verify_detached
  install(copy)
  assert.equal(copy.crypto_sign_verify_detached, installedFunction)
  for (const unsupported of [{...original, crypto_core_hsalsa20: undefined}, {...original, sodium_version_string: () => 'future-version'}]) {
  const functions = {...unsupported}; const warnings = []
  enable(unsupported, {platform: 'ios', warn: warning => warnings.push(warning)})
  await unsupported.ready
  assert.equal(warnings.length, 1)
  for (const name of Object.keys(functions)) if (name !== 'ready') assert.equal(unsupported[name], functions[name])
  const keys = unsupported.crypto_sign_seed_keypair(new Uint8Array(32))
  const sig = unsupported.crypto_sign_detached('fallback', keys.privateKey)
  assert.equal(unsupported.crypto_sign_verify_detached(sig, 'fallback', keys.publicKey), true)
  }
})

test('unsupported export descriptors and Proxy traps never partially install native crypto', async () => {
  const names = [
    'crypto_sign_seed_keypair', 'crypto_scalarmult_base', 'crypto_sign_detached',
    'crypto_sign_verify_detached', 'crypto_box_easy', 'crypto_box_open_easy',
  ]
  for (const name of names) {
    for (const kind of ['readonly', 'accessor']) {
      const copy = {...original}
      let setterCalls = 0
      Object.defineProperty(copy, name, kind === 'readonly'
        ? {value: original[name], writable: false, configurable: false}
        : {get: () => original[name], set: () => { setterCalls++; throw new Error('assignment rejected') }})
      const warnings = []
      enable(copy, {platform: 'ios', warn: warning => warnings.push(warning)})
      await copy.ready
      assert.equal(warnings.length, 1)
      assert.equal(setterCalls, 0)
      for (const api of names) assert.equal(copy[api], original[api], `${kind} ${name} changed ${api}`)
    }
  }
  const target = {...original}
  let cryptoAssignments = 0
  const proxy = new Proxy(target, {
    set(object, name, value) {
      if (names.includes(name)) {
        cryptoAssignments++
        if (name === names[1]) throw new Error('later assignment rejected')
      }
      return Reflect.set(object, name, value)
    },
  })
  const warnings = []
  enable(proxy, {platform: 'ios', warn: warning => warnings.push(warning)})
  await proxy.ready
  assert.equal(warnings.length, 1)
  assert.equal(cryptoAssignments, 0)
  for (const name of names) assert.equal(target[name], original[name])

  // A sealed ordinary module remains safe: all six existing exports are writable.
  const sealed = Object.seal({...original})
  enable(sealed, {platform: 'ios', warn: () => assert.fail('sealed writable exports should work')})
  await sealed.ready
  for (const name of names) assert.notEqual(sealed[name], original[name])
})

test('unsupported module namespaces and ready properties are left untouched before activation', async () => {
  const namespace = await import('data:text/javascript,export const ready=Promise.resolve();export function crypto_sign_verify_detached(){return false}')
  const throwingProxy = new Proxy({...original}, {
    get() { assert.fail('activation must not invoke a Proxy getter') },
    set() { assert.fail('activation must not invoke a Proxy setter') },
  })
  const readonly = {...original}
  Object.defineProperty(readonly, 'ready', {value: original.ready, writable: false})
  const accessor = {...original}
  Object.defineProperty(accessor, 'ready', {get() { assert.fail('activation must not invoke ready getter') }})
  const thenable = {...original, ready: {then() { assert.fail('activation must not invoke a custom thenable') }}}
  for (const unsupported of [namespace, throwingProxy, readonly, accessor, thenable]) {
    const warnings = []
    assert.equal(enable(unsupported, {platform: 'ios', warn: warning => warnings.push(warning)}), unsupported)
    assert.equal(warnings.length, 1)
  }
  await new Promise(resolve => setImmediate(resolve))
  for (const copy of [readonly, accessor, thenable]) {
    for (const name of Object.keys(original)) {
      if (typeof original[name] === 'function') assert.equal(copy[name], original[name])
    }
  }
  assert.equal(namespace.crypto_sign_verify_detached(), false)
  assert.throws(() => install(namespace), /unsupported sodium export object/)
})

}
