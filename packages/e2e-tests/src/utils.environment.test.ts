import { once } from 'events'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { BuildSetup } from './utils'

describe('desktop QSS endpoint configuration', () => {
  const originalEndpoint = process.env.QSS_ENDPOINT
  let directory: string
  let app: BuildSetup | undefined

  beforeEach(() => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'quiet-qss-endpoint-'))
  })

  afterEach(async () => {
    if (app?.child && app.child.exitCode === null) {
      const exited = once(app.child, 'exit')
      app.child.kill()
      await exited
    }
    app = undefined
    for (const file of fs.readdirSync(directory)) fs.unlinkSync(path.join(directory, file))
    fs.rmdirSync(directory)
    if (originalEndpoint === undefined) delete process.env.QSS_ENDPOINT
    else process.env.QSS_ENDPOINT = originalEndpoint
  })

  it.each([
    ['explicit option', 'ws://localhost:13003', 'ws://localhost:13004', 'ws://localhost:13005', 'ws://localhost:13003'],
    ['client environment', undefined, 'ws://localhost:13004', 'ws://localhost:13005', 'ws://localhost:13004'],
    ['host environment', undefined, undefined, 'ws://localhost:13005', 'ws://localhost:13005'],
    ['local default', undefined, undefined, undefined, 'ws://127.0.0.1:3003'],
  ])('passes the %s endpoint to the actual desktop driver child', async (_name, option, client, host, expected) => {
    if (host === undefined) delete process.env.QSS_ENDPOINT
    else process.env.QSS_ENDPOINT = host
    const driver = path.join(directory, 'driver.cjs')
    const result = path.join(directory, 'endpoint.json')
    fs.writeFileSync(
      driver,
      "require('fs').writeFileSync(process.env.QUIET_ENDPOINT_TEST_RESULT, JSON.stringify({ endpoint: process.env.QSS_ENDPOINT, allowed: process.env.QSS_ALLOWED })); setInterval(() => {}, 1000)"
    )
    app = new BuildSetup({
      chromeDriverPath: driver,
      qssEndpoint: option,
      environment: {
        APPDATA: directory,
        QUIET_ENDPOINT_TEST_RESULT: result,
        ...(client === undefined ? {} : { QSS_ENDPOINT: client }),
      },
    })

    await app.createChromeDriver(true)

    expect(JSON.parse(fs.readFileSync(result, 'utf8'))).toEqual({ endpoint: expected, allowed: 'true' })
    expect(process.env.QSS_ENDPOINT).toBe(host)
  })
})
