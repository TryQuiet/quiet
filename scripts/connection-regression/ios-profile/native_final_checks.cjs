// Run current shared checks against separately loaded, unadapted pinned sodium.
'use strict'
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict')
exports.run = async (bundle, config) => {
  fs.mkdirSync(config.output, {recursive: true})
  const write = (name, value) => fs.writeFileSync(path.join(config.output, name), JSON.stringify(value))
  const sodium = bundle.webpack('../../3rd-party/auth/node_modules/.pnpm/libsodium-wrappers-sumo@0.7.13/node_modules/libsodium-wrappers-sumo/dist/modules-sumo/libsodium-wrappers.js')
  await sodium.ready
  const crypto = require('node:crypto'), originalCreate = crypto.createPrivateKey
  let nativeCalls = 0
  crypto.createPrivateKey = function (...args) { nativeCalls++; return originalCreate.apply(this, args) }
  try { sodium.crypto_scalarmult_base(new Uint8Array(32).fill(7)) }
  finally { crypto.createPrivateKey = originalCreate }
  assert.equal(nativeCalls, 1, 'production adapter must already be active')
  write('activation.json', {nativeCalls, platform: process.platform, versions: process.versions})
  const tasks = [], before = [], test = (name, fn) => tasks.push({name, fn})
  test.before = fn => before.push(fn)
  require('./preflight-checks/sodium-native.checks.cjs').register(test, async () => require('./preflight-checks/original-sodium.cjs'))
  const results = []
  for (const fn of before) await fn()
  for (const {name, fn} of tasks) {
    const start = Date.now(); await fn()
    results.push({name, passed: true, ms: Date.now() - start}); write('checks.json', results)
    await new Promise(resolve => setImmediate(resolve))
  }
  write('complete.json', {passed: true, checks: results.length})
}
