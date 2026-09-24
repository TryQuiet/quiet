import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const retry = fileURLToPath(new URL('./retry-network-command.sh', import.meta.url))

async function fixture(t, statuses) {
  const dir = await mkdtemp(path.join(tmpdir(), 'quiet-network-retry-'))
  t.after(() => rm(dir, { recursive: true, force: true }))
  let requests = 0
  const server = createServer((_request, response) => {
    const status = statuses[Math.min(requests++, statuses.length - 1)]
    response.writeHead(status)
    response.end(status === 200 ? 'downloaded artifact' : 'download failed')
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  t.after(() => new Promise(resolve => server.close(resolve)))
  const child = path.join(dir, 'download with spaces.mjs')
  await writeFile(child, `
    import { writeFileSync } from 'node:fs';
    const response = await fetch(process.argv[2]);
    if (!response.ok) {
      console.error('HTTPError: Response code ' + response.status);
      process.exit(23);
    }
    writeFileSync(process.argv[3], await response.text());
    console.log('installed', process.argv[4]);
  `)
  return { dir, child, requests: () => requests, url: `http://127.0.0.1:${server.address().port}/artifact` }
}

function run(args, env = {}, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn('bash', [retry, ...args], {
      env: { ...process.env, QUIET_NETWORK_RETRY_DELAY_SECONDS: '0', ...env },
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let output = ''
    child.stdout.on('data', data => { output += data })
    child.stderr.on('data', data => { output += data })
    child.on('error', reject)
    child.on('exit', (code, signal) => resolve({ code, signal, output }))
  })
}

test('bootstrap retry removes incomplete package installs after a network reset', async t => {
  const dir = await mkdtemp(path.join(tmpdir(), 'quiet-bootstrap-retry-'))
  t.after(() => rm(dir, { recursive: true, force: true }))
  const script = path.join(dir, 'bootstrap.mjs')
  await writeFile(script, `
    import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
    const count = existsSync('attempt') ? Number(readFileSync('attempt', 'utf8')) : 0;
    writeFileSync('attempt', String(count + 1));
    const moduleDir = 'packages/desktop/node_modules/bluebird';
    if (count === 0) {
      mkdirSync(moduleDir, { recursive: true });
      writeFileSync(moduleDir + '/package.json', '{"main":"js/release/bluebird.js"}');
      console.error('npm error code ECONNRESET');
      process.exit(1);
    }
    if (existsSync(moduleDir)) {
      console.error('partial dependency survived retry');
      process.exit(2);
    }
    mkdirSync(moduleDir + '/js/release', { recursive: true });
    writeFileSync(moduleDir + '/js/release/bluebird.js', 'module.exports = true');
    console.log('bootstrap completed');
  `)
  const result = await run([process.execPath, script], { QUIET_NETWORK_RETRY_CLEAN_PACKAGE_MODULES: 'true' }, dir)
  assert.equal(result.code, 0, result.output)
  assert.ok(result.output.includes('bootstrap completed'))
  assert.equal(await readFile(path.join(dir, 'attempt'), 'utf8'), '2')
})

test('ordinary retries leave existing package installs alone', async t => {
  const dir = await mkdtemp(path.join(tmpdir(), 'quiet-ordinary-retry-'))
  t.after(() => rm(dir, { recursive: true, force: true }))
  const partial = path.join(dir, 'packages/desktop/node_modules/bluebird/package.json')
  await mkdir(path.dirname(partial), { recursive: true })
  await writeFile(partial, '{}')
  const result = await run([process.execPath, '-e', 'console.error("ECONNRESET"); process.exit(1)'], {}, dir)
  assert.equal(result.code, 1, result.output)
  assert.equal(await readFile(partial, 'utf8'), '{}')
})

for (const status of [429, 500, 504]) {
  test(`recovers a real HTTP ${status} download without changing arguments`, async t => {
    const f = await fixture(t, [status, 200])
    const destination = path.join(f.dir, 'artifact with spaces')
    const literal = 'scope {one,two} $(do-not-run) `literal`'
    const result = await run([process.execPath, f.child, f.url, destination, literal], { TMPDIR: f.dir })
    assert.equal(result.code, 0, result.output)
    assert.equal(f.requests(), 2)
    assert.ok(result.output.includes(literal))
    const { readFile } = await import('node:fs/promises')
    assert.equal(await readFile(destination, 'utf8'), 'downloaded artifact')
    assert.deepEqual((await readdir(f.dir)).sort(), ['artifact with spaces', 'download with spaces.mjs'])
  })
}

test('persistent transport failures stop after three attempts and preserve the exit code', async t => {
  const f = await fixture(t, [504])
  const result = await run([process.execPath, f.child, f.url, path.join(f.dir, 'artifact')])
  assert.equal(result.code, 23, result.output)
  assert.equal(f.requests(), 3)
})

for (const status of [401, 403, 404]) {
  test(`HTTP ${status} fails immediately`, async t => {
    const f = await fixture(t, [status, 200])
    const result = await run([process.execPath, f.child, f.url, path.join(f.dir, 'artifact')])
    assert.equal(result.code, 23, result.output)
    assert.equal(f.requests(), 1)
  })
}

for (const diagnostic of ['error TS2322: wrong type', 'checksum mismatch', 'test assertion failed']) {
  test(`${diagnostic} is not retried`, async () => {
    const result = await run([process.execPath, '-e', `console.error(${JSON.stringify(diagnostic)}); process.exit(37)`])
    assert.equal(result.code, 37, result.output)
    assert.equal(result.output.trim(), diagnostic)
  })
}

test('an earlier network warning does not conceal a compiler failure', async () => {
  const result = await run([process.execPath, '-e', 'console.error("HTTPError: Response code 504\\nerror TS2322: wrong type"); process.exit(37)'])
  assert.equal(result.code, 37, result.output)
  assert.ok(!result.output.includes('retrying'))
})

test('a Gradle wrapper timeout is retried, but interruption is not', async () => {
  const message = 'java.io.IOException: Downloading from https://services.gradle.org/distributions/gradle-8.13-all.zip failed: timeout'
  const timedOut = await run([process.execPath, '-e', `console.error(${JSON.stringify(message)}); process.exit(1)`])
  assert.equal(timedOut.code, 1)
  assert.equal(timedOut.output.split(message).length - 1, 3)
  const interrupted = await run([process.execPath, '-e', `console.error(${JSON.stringify(message)}); process.exit(130)`])
  assert.equal(interrupted.code, 130)
  assert.ok(!interrupted.output.includes('retrying'))
})
