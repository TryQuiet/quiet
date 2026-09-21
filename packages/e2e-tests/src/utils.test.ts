import { once } from 'events'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { BuildSetup } from './utils'

describe('Packaged client QSS configuration', () => {
  const originalEndpoint = process.env.QSS_ENDPOINT
  let directory: string

  beforeEach(() => {
    delete process.env.QSS_ENDPOINT
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'quiet-qss-client-'))
  })

  afterEach(() => {
    if (originalEndpoint === undefined) delete process.env.QSS_ENDPOINT
    else process.env.QSS_ENDPOINT = originalEndpoint
    for (const file of fs.readdirSync(directory)) fs.unlinkSync(path.join(directory, file))
    fs.rmdirSync(directory)
  })

  it.each([
    { enabled: true, inherited: undefined, client: undefined, expected: 'ws://127.0.0.1:3003' },
    { enabled: true, inherited: 'ws://127.0.0.1:3004', client: undefined, expected: 'ws://127.0.0.1:3004' },
    {
      enabled: true,
      inherited: 'ws://127.0.0.1:3004',
      client: 'ws://127.0.0.1:3005',
      expected: 'ws://127.0.0.1:3005',
    },
    { enabled: false, inherited: 'ws://127.0.0.1:3004', client: undefined, expected: 'ws://127.0.0.1:3004' },
  ])('passes the configured service to the child process: %j', async ({ enabled, inherited, client, expected }) => {
    if (inherited) process.env.QSS_ENDPOINT = inherited
    const capture = path.join(directory, 'environment.json')
    const childScript = path.join(directory, 'capture.cjs')
    // Exercise the real ChromeDriver process boundary without launching a GUI.
    // A separate Node process records exactly what the packaged app inherits.
    fs.writeFileSync(
      childScript,
      `require('fs').writeFileSync(process.env.QSS_TEST_CAPTURE, JSON.stringify({
        allowed: process.env.QSS_ALLOWED, endpoint: process.env.QSS_ENDPOINT
      })); setInterval(() => {}, 1000)`
    )
    const setup = new BuildSetup({
      chromeDriverPath: childScript,
      environment: { QSS_TEST_CAPTURE: capture, ...(client ? { QSS_ENDPOINT: client } : {}) },
    })
    try {
      await setup.createChromeDriver(enabled)
      expect(JSON.parse(fs.readFileSync(capture, 'utf8'))).toEqual({
        allowed: String(enabled),
        endpoint: expected,
      })
    } finally {
      if (setup.child && setup.child.exitCode === null) {
        const exited = once(setup.child, 'exit')
        setup.child.kill()
        await exited
      }
    }
  })
})
