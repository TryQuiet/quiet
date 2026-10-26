// Runs scripts/updateLoopCheck.cjs: a feed served by one process, the real electron-updater plus the
// app's update hardening in another. Needs the compiled app code (`npm run build:main`).
const assert = require('node:assert')
const { spawn, spawnSync } = require('node:child_process')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const net = require('node:net')
const { test } = require('node:test')

const script = path.join(__dirname, 'updateLoopCheck.cjs')
const built = fs.existsSync(path.join(__dirname, '..', 'dist', 'main', 'updaterSecurity.js'))

const freePort = () =>
  new Promise(resolve => {
    const s = net.createServer().listen(0, '127.0.0.1', () => {
      const { port } = s.address()
      s.close(() => resolve(port))
    })
  })

test('update loop against a local HTTP feed: genuine update is accepted, every attack is refused', { skip: !built && !process.env.CI && 'run npm run build:main first' }, async () => {
  const dir = fs.mkdtempSync(path.join(process.env.TMPDIR || os.tmpdir(), 'quiet-loop-test-'))
  const keyFile = path.join(dir, 'public.key')
  const port = await freePort()
  const server = spawn(process.execPath, [script, 'serve', String(port), keyFile], { stdio: 'pipe' })
  try {
    await new Promise((resolve, reject) => {
      server.stdout.once('data', resolve)
      server.once('exit', code => reject(new Error(`feed server exited ${code}`)))
    })
    const run = spawnSync(process.execPath, [script, 'check', `http://127.0.0.1:${port}`, keyFile], {
      encoding: 'utf8',
      env: { ...process.env, QUIET_LOOP_TMP: dir },
    })
    const results = JSON.parse(run.stdout.slice(run.stdout.indexOf('[\n')))
    for (const r of results) assert.ok(r.ok, `${r.name}: expected ${r.expect}, got ${r.got} (${r.detail})`)
    assert.deepStrictEqual(
      results.map(r => r.name).sort(),
      ['control', 'downgrade', 'feed-hash-mismatch', 'garbage-signature', 'http-feed-config', 'prerelease-for-stable', 'replayed-old-signature', 'tampered', 'unsigned', 'wrong-signer']
    )
    assert.strictEqual(run.status, 0)
  } finally {
    server.kill()
    fs.rmSync(dir, { recursive: true, force: true })
  }
})
