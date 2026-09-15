// Uses a separate sender process so receiver counts cannot reuse sender validation facts.
import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { spawnSync } from 'node:child_process'
import { performance } from 'node:perf_hooks'
import { fileURLToPath } from 'node:url'
import { Session } from 'node:inspector/promises'
import { createHash } from 'node:crypto'
assert.ok(process.argv[4], 'Usage: node incremental-edition-bench.mjs AUTH_ROOT FIXTURE_DIR PRIVATE_OUTPUT_DIR')
const root = path.resolve(process.argv[2])
const fixtures = path.resolve(process.argv[3])
const output = path.resolve(process.argv[4])
const sizes = process.env.PROFILE_SIZES?.split(',').map(Number) ?? [10, 100]
assert.ok(sizes.length > 0 && sizes.every(n => [10, 100].includes(n)))
const require = createRequire(root + '/packages/crypto/package.json')
const sodium = require('libsodium-wrappers-sumo')
const { unpack } = require('msgpackr')
await sodium.ready
const auth = await import(root + '/packages/auth/dist/index.js')
const crdx = await import(root + '/packages/crdx/dist/index.js')
fs.mkdirSync(output, { recursive: true, mode: 0o700 })
const fixture = n => JSON.parse(fs.readFileSync(fixtures + '/team-' + n + '.json'))
if (process.argv[5] === '--generate') {
  const { createFixtures } = await import('./ios-profile/fixtures.cjs')
  await createFixtures({ webpack: async () => auth }, fixtures, sizes, 0)
  process.exit(0)
}
if (sizes.some(n => !fs.existsSync(fixtures + '/team-' + n + '.json'))) {
  // Fixture creation cannot warm the receiver's cryptographic fact caches.
  const generated = spawnSync(
    process.execPath,
    [fileURLToPath(import.meta.url), root, fixtures, output, '--generate'],
    { stdio: ['ignore', 'ignore', 'pipe'] }
  )
  assert.equal(generated.status, 0, generated.stderr.toString())
}
if (process.argv[5] === '--prepare') {
  for (const n of sizes) {
    const f = fixture(n)
    const owner = auth.loadTeam(Uint8Array.from(Buffer.from(f.source, 'base64')), f.owner, f.teamKeyring)
    for (const sequence of [1, 2]) {
      owner.addMessage({ type: 'PERFORMANCE_PROBE', payload: { sequence } })
      fs.writeFileSync(`${output}/edition-${n}-${sequence}.bin`, owner.save(), { mode: 0o600 })
    }
  }
  process.exit(0)
}
const sender = spawnSync(
  process.execPath,
  [...process.execArgv, fileURLToPath(import.meta.url), root, fixtures, output, '--prepare'],
  { stdio: ['ignore', 'ignore', 'pipe'] }
)
assert.equal(sender.status, 0, sender.stderr.toString())
console.log(
  JSON.stringify({
    phase: 'environment',
    node: process.version,
    platform: process.platform,
    arch: process.arch,
    wasm: typeof WebAssembly,
    authBundleSha256: createHash('sha256')
      .update(fs.readFileSync(root + '/packages/auth/dist/index.js'))
      .digest('hex'),
    crdxBundleSha256: createHash('sha256')
      .update(fs.readFileSync(root + '/packages/crdx/dist/index.js'))
      .digest('hex'),
  })
)
let counts = {}
for (const name of [
  'crypto_sign_seed_keypair',
  'crypto_scalarmult_base',
  'crypto_box_open_easy',
  'crypto_sign_verify_detached',
]) {
  const original = sodium[name]
  sodium[name] = (...args) => {
    counts[name] = (counts[name] || 0) + 1
    return original(...args)
  }
}
for (const n of sizes) {
  const f = fixture(n)
  counts = {}
  let start = performance.now()
  const receiver = auth.loadTeam(Uint8Array.from(Buffer.from(f.source, 'base64')), f.member, f.teamKeyring)
  console.log(JSON.stringify({ phase: 'load', users: n, ms: performance.now() - start, counts }))
  for (const sequence of [1, 2]) {
    if (process.env.PROFILE_GC === '1') {
      assert.equal(typeof globalThis.gc, 'function', 'PROFILE_GC=1 requires node --expose-gc')
      for (let collection = 0; collection < 3; collection++) {
        await new Promise(resolve => setImmediate(resolve))
        globalThis.gc()
      }
    }
    const bytes = fs.readFileSync(`${output}/edition-${n}-${sequence}.bin`)
    const profiler = process.env.PROFILE_CPU === '1' ? new Session() : undefined
    if (profiler) {
      profiler.connect()
      await profiler.post('Profiler.enable')
      await profiler.post('Profiler.setSamplingInterval', { interval: 1000 })
      await profiler.post('Profiler.start')
    }
    counts = {}
    start = performance.now()
    const graph = crdx.decryptGraph({ encryptedGraph: unpack(bytes), keys: f.teamKeyring })
    receiver.merge(graph)
    assert.equal(receiver.members().length, n)
    assert.equal(receiver.messages().at(-1).payload.sequence, sequence)
    console.log(
      JSON.stringify({ phase: 'received-edition', users: n, sequence, ms: performance.now() - start, counts })
    )
    assert.equal(counts.crypto_sign_verify_detached, 1)
    assert.ok(counts.crypto_box_open_easy <= 8)
    if (profiler) {
      const { profile } = await profiler.post('Profiler.stop')
      fs.writeFileSync(`${output}/edition-${n}-${sequence}.cpuprofile`, JSON.stringify(profile), { mode: 0o600 })
      profiler.disconnect()
    }
  }
}
