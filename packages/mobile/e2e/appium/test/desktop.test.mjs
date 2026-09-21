import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

test('notification desktop enables push in its actual driver child even when the host disables it', t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'quiet-notification-desktop-'))
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }))
  const capture = path.join(directory, 'environment.json')
  const driver = path.join(directory, 'driver.cjs')
  fs.writeFileSync(driver, `require('fs').writeFileSync(${JSON.stringify(capture)}, JSON.stringify({
    qps: process.env.QPS_ALLOWED, qss: process.env.QSS_ALLOWED, endpoint: process.env.QSS_ENDPOINT
  })); setInterval(() => {}, 1000);`)
  const script = `
    import { Desktop } from './desktop.mjs';
    import { once } from 'node:events';
    const desktop = new Desktop(
      { desktopBinary: process.execPath, chromeDriverPath: ${JSON.stringify(driver)} },
      { desktop: 'notification-sender' },
      { target: 'staging', endpoint: 'wss://qss-dev.quiet-services.app' },
      { directory: ${JSON.stringify(directory)} }
    );
    try { await desktop.app.buildSetup.createChromeDriver(true); }
    finally {
      const child = desktop.app.buildSetup.child;
      if (child && child.exitCode === null) {
        const exited = once(child, 'exit'); child.kill(); await exited;
      }
    }
  `
  const environment = { ...process.env, APPDATA: directory, QPS_ALLOWED: 'false' }
  delete environment.NODE_TEST_CONTEXT
  const result = spawnSync(process.execPath, ['--import', 'tsx', '--input-type=module', '-e', script], {
    cwd: fileURLToPath(new URL('..', import.meta.url)), env: environment, encoding: 'utf8', timeout: 30000,
  })
  assert.equal(result.status, 0, result.stderr)
  assert.deepEqual(JSON.parse(fs.readFileSync(capture, 'utf8')), {
    qps: 'true', qss: 'true', endpoint: 'wss://qss-dev.quiet-services.app',
  })
})
