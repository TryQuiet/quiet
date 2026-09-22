'use strict'
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const os = require('node:os')
const {performance} = require('node:perf_hooks')
const reportPath = path.join(os.homedir(), 'Documents/sodium-result.json')
const report = {node: process.version, platform: process.platform, arch: process.arch, cases: []}
async function main() {
  assert.equal(process.platform, 'ios')
  assert.equal(process.version, 'v24.18.0')
  const reference = require('./reference/node_modules/libsodium-wrappers-sumo')
  await reference.ready
  const module = {exports: {}}
  process.dlopen(module, path.join(__dirname, '../Frameworks/QuietSodium.framework/QuietSodium'))
  const binding = module.exports
  report.libsodium = binding.version
  const cases = []
  let before
  const test = (name, run) => cases.push({name, run})
  test.before = run => {before = run}
  require('./sodium-native.checks.cjs').register(test, async () => reference, binding)
  await before()
  for (const item of cases) {
    const start = performance.now()
    await item.run()
    report.cases.push({name: item.name, milliseconds: performance.now() - start})
  }
  // This module was built with the production webpack rule, not manual install().
  let calls = 0, loads = 0
  const dlopen = process.dlopen
  process.dlopen = (module, filename) => {
    dlopen(module, filename); loads++
    const api = module.exports
    module.exports = Object.fromEntries(Object.getOwnPropertyNames(api).map(name => [name,
      typeof api[name] === 'function' ? (...args) => {calls++; return api[name](...args)} : api[name]]))
  }
  const sodium = require('./bundled-sodium.cjs')
  await sodium.ready
  const message = new Uint8Array([10, 11, 12]), seed = new Uint8Array(32).fill(5)
  calls = 0
  const pair = sodium.crypto_sign_seed_keypair(seed)
  const sig = sodium.crypto_sign_detached(message, pair.privateKey)
  assert.equal(sodium.crypto_sign_verify_detached(sig, message, pair.publicKey), true)
  assert.equal(calls, 3)
  assert.equal(loads, 1)
  report.webpackNativeCalls = calls
  process.dlopen = dlopen
  const timings = []
  for (const [name, api] of [['reference', reference], ['native', sodium]]) {
    const keys = api.crypto_sign_seed_keypair(seed), signature = api.crypto_sign_detached(message, keys.privateKey)
    const start = performance.now()
    for (let i = 0; i < 1000; i++) assert.equal(api.crypto_sign_verify_detached(signature, message, keys.publicKey), true)
    timings.push({name, verifies: 1000, milliseconds: performance.now() - start})
  }
  report.timings = timings
  report.passed = true
}
main().catch(error => {report.passed = false; report.error = error.stack}).finally(() => {
  fs.mkdirSync(path.dirname(reportPath), {recursive: true})
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
  console.log('QUIET_SODIUM_PROBE', JSON.stringify(report))
})
