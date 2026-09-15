import fs from 'node:fs'
import assert from 'node:assert/strict'
import { performance } from 'node:perf_hooks'
import { createRequire } from 'node:module'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
assert.ok(process.argv[3], 'Usage: node incremental-validation-bench.mjs AUTH_ROOT PRIVATE_FIXTURE_DIR')
const root = path.resolve(process.argv[2])
const fixtures = path.resolve(process.argv[3])
const require = createRequire(root + '/packages/crypto/package.json')
const sodium = require('libsodium-wrappers-sumo')
await sodium.ready
const auth = await import(root + '/packages/auth/dist/index.js')
if (process.argv[4] === '--generate') {
  const { createFixtures } = await import('./ios-profile/fixtures.cjs')
  await createFixtures({ webpack: async () => auth }, fixtures, [2, 10, 25, 50, 100], 1000)
  process.exit(0)
}
if (!fs.existsSync(fixtures + '/team-100.json') || !fs.existsSync(fixtures + '/messages.json')) {
  // Separate generation keeps the receiver's cryptographic fact caches cold.
  const generated = spawnSync(process.execPath, [fileURLToPath(import.meta.url), root, fixtures, '--generate'], {
    stdio: ['ignore', 'ignore', 'pipe'],
  })
  assert.equal(generated.status, 0, generated.stderr.toString())
}
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
  })
)
const messages = JSON.parse(fs.readFileSync(fixtures + '/messages.json')).map(m => ({
  ...m,
  encrypted: { ...m.encrypted, contents: Uint8Array.from(Buffer.from(m.encrypted.contents, 'base64')) },
}))
assert.equal(messages.length, 1000, 'Use a fresh fixture directory; this benchmark requires 1000 messages')
for (const n of [2, 10, 25, 50, 100]) {
  const f = JSON.parse(fs.readFileSync(fixtures + '/team-' + n + '.json'))
  counts = {}
  let start = performance.now()
  const team = auth.loadTeam(Uint8Array.from(Buffer.from(f.source, 'base64')), f.member, f.teamKeyring)
  assert.equal(team.members().length, n)
  console.log(JSON.stringify({ phase: 'load', users: n, ms: performance.now() - start, counts }))
  counts = {}
  start = performance.now()
  const count = [2, 100].includes(n) ? 1000 : 10
  for (const m of messages.slice(0, count)) {
    const plaintext = team.decrypt(m.encrypted)
    assert.deepEqual(plaintext, m.contents)
    assert.equal(team.verify({ ...m.signed, contents: plaintext }), true)
  }
  assert.equal(counts.crypto_sign_verify_detached, count)
  assert.ok((counts.crypto_box_open_easy || 0) <= 3)
  console.log(JSON.stringify({ phase: 'messages', users: n, count, ms: performance.now() - start, counts }))
  const bad = { ...messages[0].encrypted, contents: Uint8Array.from(messages[0].encrypted.contents) }
  bad.contents[0] ^= 1
  assert.throws(() => team.decrypt(bad))
  assert.equal(
    team.verify({ ...messages[0].signed, contents: { ...messages[0].contents, message: 'tampered' } }),
    false
  )
}
