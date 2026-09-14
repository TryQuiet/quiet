import fs from 'fs'
import os from 'os'
import path from 'path'
import { BuildSetup } from './utils'

describe('desktop peer environment', () => {
  it.each(['socket.io-parser', ''])('passes an explicit DEBUG override (%j) to the real child process', async debug => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'quiet-peer-env-'))
    const receipt = path.join(directory, 'environment.json')
    const driver = path.join(directory, 'driver.cjs')
    // Use a real spawned process to observe the environment at the same boundary
    // as ChromeDriver. Capture only these test values, never the full environment.
    fs.writeFileSync(
      driver,
      `require('fs').writeFileSync(process.env.E2E_ENV_RECEIPT, JSON.stringify({
        debug: process.env.DEBUG,
        isE2E: process.env.IS_E2E,
        testMode: process.env.TEST_MODE,
        endpoint: process.env.QSS_ENDPOINT
      }))`
    )
    const setup = new BuildSetup({
      chromeDriverPath: driver,
      qssEndpoint: 'ws://127.0.0.1:3003',
      environment: {
        DEBUG: debug,
        IS_E2E: 'false',
        TEST_MODE: '',
        E2E_ENV_RECEIPT: receipt,
      },
    })
    try {
      await setup.createChromeDriver(true)
      expect(JSON.parse(fs.readFileSync(receipt, 'utf8'))).toEqual({
        debug,
        isE2E: 'false',
        testMode: '',
        endpoint: 'ws://127.0.0.1:3003',
      })
    } finally {
      if (setup.child?.exitCode == null) setup.child?.kill()
      for (const file of [receipt, driver]) if (fs.existsSync(file)) fs.unlinkSync(file)
      fs.rmdirSync(directory)
    }
  })
})
