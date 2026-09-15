'use strict'
// Copy alongside original-bench.cjs and native-tests/ in the private control
// directory. Checks require the original backend; repeats require the adapted one.
const fs = require('node:fs')
const path = require('node:path')
const assert = require('node:assert/strict')
const crypto = require('node:crypto')
const sodiumId = '../../3rd-party/auth/node_modules/.pnpm/libsodium-wrappers-sumo@0.7.13/node_modules/libsodium-wrappers-sumo/dist/modules-sumo/libsodium-wrappers.js'

exports.run = async (bundle, config) => {
  fs.mkdirSync(config.output, {recursive: true})
  const write = (name, value) => fs.writeFileSync(path.join(config.output, name), JSON.stringify(value))
  const sodium = bundle.webpack(sodiumId)
  await sodium.ready
  if (config.nativeMode === 'checks') {
    const tasks = [], before = []
    const test = (name, fn) => tasks.push({name, fn})
    test.before = fn => before.push(fn)
    require('./native-tests/sodium-native.checks.cjs').register(test, async () => sodium)
    const results = []
    for (const fn of before) await fn()
    for (const {name, fn} of tasks) {
      const start = Date.now()
      await fn()
      results.push({name, passed: true, ms: Date.now() - start})
      write('checks.json', results)
      await new Promise(resolve => setImmediate(resolve))
    }
    write('complete.json', {passed: true, tests: results.length, versions: process.versions})
    return
  }
  // Prove that startup installed the runtime fix before this harness did any work.
  // This code never calls install()/enable() on the measured sodium instance.
  const originalCreate = crypto.createPrivateKey
  let nativeCalls = 0
  crypto.createPrivateKey = function (...args) { nativeCalls++; return originalCreate.apply(this, args) }
  try { sodium.crypto_scalarmult_base(new Uint8Array(32).fill(7)) }
  finally { crypto.createPrivateKey = originalCreate }
  assert.equal(nativeCalls, 1, 'native adapter must be active before benchmark')
  const repeats = config.repeats || 3
  assert.ok(Number.isInteger(repeats) && repeats >= 1 && repeats <= 5)
  write('activation.json', {nativeCallsForPublicDerivation: nativeCalls, versions: process.versions, platform: process.platform})
  for (let repeat = 1; repeat <= repeats; repeat++) {
    const output = path.join(config.output, 'repeat-' + repeat)
    await require('./original-bench.cjs').run(bundle, {...config, output})
  }
  write('complete.json', {passed: true, repeats})
}
