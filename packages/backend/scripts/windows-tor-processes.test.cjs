const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { once } = require('node:events')
const { spawn } = require('node:child_process')
const test = require('node:test')

const discover = async directory => {
  const { getWindowsTorProcessIds } = await import('../src/nest/tor/windows-tor-processes.ts')
  return await getWindowsTorProcessIds(directory)
}

test('rejects an empty directory before querying any processes', async () => {
  await assert.rejects(discover(''), /data directory is required/)
})

test(
  'process discovery keeps the event loop responsive while its child command waits',
  {
    skip: process.platform === 'win32',
  },
  async () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'quiet-tor-discovery-'))
    const originalPath = process.env.PATH
    const events = []
    const heartbeat = setTimeout(() => events.push('heartbeat'), 50)
    try {
      // Replace only the OS command. The production helper still starts a real
      // child and waits for its stdout; a synchronous query blocks this heartbeat.
      fs.writeFileSync(
        path.join(directory, 'powershell.exe'),
        `#!/usr/bin/env node
setTimeout(() => process.stdout.write('123\\n'), 250)
`,
        { mode: 0o755 }
      )
      process.env.PATH = `${directory}${path.delimiter}${originalPath}`
      const pids = await discover(path.join(directory, "profile's TorDataDirectory"))
      events.push('discovered')
      assert.deepEqual(pids, ['123'])
      assert.deepEqual(events, ['heartbeat', 'discovered'])
    } finally {
      clearTimeout(heartbeat)
      process.env.PATH = originalPath
      fs.rmSync(directory, { recursive: true, force: true })
    }
  }
)

test(
  'retries one timed-out child query without blocking the event loop',
  { skip: process.platform === 'win32', timeout: 25_000 },
  async () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'quiet-tor-cold-query-'))
    const originalPath = process.env.PATH
    const attempts = path.join(directory, 'attempts')
    let heartbeat = false
    const timer = setTimeout(() => {
      heartbeat = true
    }, 50)
    try {
      fs.writeFileSync(
        path.join(directory, 'powershell.exe'),
        `#!/usr/bin/env node
const fs = require('node:fs')
const attempts = ${JSON.stringify(attempts)}
const count = fs.existsSync(attempts) ? Number(fs.readFileSync(attempts)) + 1 : 1
fs.writeFileSync(attempts, String(count))
if (count === 1) setTimeout(() => process.stdout.write('999\\n'), 10500)
else process.stdout.write('123\\n')
`,
        { mode: 0o755 }
      )
      process.env.PATH = `${directory}${path.delimiter}${originalPath}`
      assert.deepEqual(await discover(path.join(directory, 'TorDataDirectory')), ['123'])
      assert.equal(fs.readFileSync(attempts, 'utf8'), '2')
      assert.equal(heartbeat, true)
    } finally {
      clearTimeout(timer)
      process.env.PATH = originalPath
      fs.rmSync(directory, { recursive: true, force: true })
    }
  }
)

test(
  'does not retry a failed query or report it as an empty process list',
  { skip: process.platform === 'win32' },
  async () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'quiet-tor-query-failure-'))
    const originalPath = process.env.PATH
    const attempts = path.join(directory, 'attempts')
    try {
      fs.writeFileSync(
        path.join(directory, 'powershell.exe'),
        `#!/usr/bin/env node
require('node:fs').appendFileSync(${JSON.stringify(attempts)}, 'attempt\\n')
process.stderr.write('CIM query refused')
process.exitCode = 1
`,
        { mode: 0o755 }
      )
      process.env.PATH = `${directory}${path.delimiter}${originalPath}`
      await assert.rejects(discover(path.join(directory, 'TorDataDirectory')), /CIM query refused/)
      assert.equal(fs.readFileSync(attempts, 'utf8'), 'attempt\n')
    } finally {
      process.env.PATH = originalPath
      fs.rmSync(directory, { recursive: true, force: true })
    }
  }
)

test(
  'keeps a persistent query timeout bounded and fails instead of losing ownership information',
  { skip: process.platform === 'win32', timeout: 25_000 },
  async () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'quiet-tor-query-timeout-'))
    const originalPath = process.env.PATH
    const attempts = path.join(directory, 'attempts')
    try {
      fs.writeFileSync(
        path.join(directory, 'powershell.exe'),
        `#!/usr/bin/env node
require('node:fs').appendFileSync(${JSON.stringify(attempts)}, 'attempt\\n')
setInterval(() => {}, 1000)
`,
        { mode: 0o755 }
      )
      process.env.PATH = `${directory}${path.delimiter}${originalPath}`
      await assert.rejects(discover(path.join(directory, 'TorDataDirectory')), error => error.killed === true)
      assert.equal(fs.readFileSync(attempts, 'utf8'), 'attempt\nattempt\n')
    } finally {
      process.env.PATH = originalPath
      fs.rmSync(directory, { recursive: true, force: true })
    }
  }
)

test(
  'Windows CIM finds only this profile, including spaces and apostrophes',
  {
    skip: process.platform !== 'win32',
    timeout: 60_000,
  },
  async () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "quiet's tor process test "))
    const children = []
    const target = path.join(directory, 'TorDataDirectory')
    try {
      const executable = path.join(directory, 'tor.exe')
      const script = path.join(directory, 'hold.cjs')
      fs.copyFileSync(process.execPath, executable)
      fs.writeFileSync(script, 'setInterval(() => {}, 1000)')
      for (const profile of [target, `${target}-other`]) {
        const child = spawn(executable, [script, '--DataDirectory', profile], { stdio: 'ignore' })
        children.push(child)
        await once(child, 'spawn')
      }
      assert.deepEqual(await discover(target), [String(children[0].pid)])
      assert.deepEqual(await discover(`${target}-other`), [String(children[1].pid)])
      const exited = once(children[0], 'exit')
      children[0].kill()
      await exited
      assert.deepEqual(await discover(target), [])
      assert.deepEqual(await discover(`${target}-other`), [String(children[1].pid)])
    } finally {
      for (const child of children) {
        if (child.exitCode !== null || child.signalCode !== null) continue
        const exited = once(child, 'exit')
        child.kill()
        await exited
      }
      fs.rmSync(directory, { recursive: true, force: true })
    }
  }
)
