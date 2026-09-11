import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

test('real Node failures retain locations and cleanup failure without exposing private data', t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'quiet-safe-reporter-'))
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }))
  const report = path.join(directory, 'failures.jsonl')
  const secret = 'quiet://invitation?secret=PRIVATE_SENTINEL_CREDENTIAL'
  const environment = { ...process.env, REPORTER_TEST_SECRET: secret }
  delete environment.NODE_TEST_CONTEXT
  const result = spawnSync(process.execPath, [
    '--test', '--test-reporter=spec', '--test-reporter-destination=stdout',
    '--test-reporter=./safe-reporter.mjs', `--test-reporter-destination=${report}`,
    'test/fixtures/reporter-failures.mjs',
  ], { cwd: fileURLToPath(new URL('..', import.meta.url)),
    env: environment, encoding: 'utf8', timeout: 30000 })
  assert.equal(result.status, 1, 'The reporter must preserve a failing test exit status')
  assert(result.stdout.includes(secret), 'The fixture must put private data in the raw runner output')
  const publicOutput = fs.readFileSync(report, 'utf8')
  for (const privateValue of [secret, 'PRIVATE_SENTINEL', 'private title', 'different private assertion value', directory]) {
    assert(!publicOutput.includes(privateValue), 'Public diagnostics exposed private runner data')
  }
  const events = publicOutput.trim().split('\n').map(line => JSON.parse(line))
  const failures = events.filter(event => event.event === 'test-failure')
  assert.equal(failures.length, 4)
  assert(failures.some(event => event.errorCodes.includes('ERR_ASSERTION')))
  assert(failures.some(event => event.errorTypes.includes('hookFailed')))
  const browser = failures.find(event => event.errorClasses.includes('SessionNotCreatedError'))
  assert.deepEqual(browser.errorCategories, ['chromium-sandbox', 'browser-startup'])
  for (const failure of failures) {
    assert(failure.locations.some(location => location.file === 'packages/mobile/e2e/appium/test/fixtures/reporter-failures.mjs'))
    assert(failure.locations.every(location => Number.isInteger(location.line) && location.line > 0))
  }
  const summary = events.findLast(event => event.event === 'report-complete')
  assert.equal(summary.failedEvents, 4)
  assert.equal(summary.passedEvents, 1)
})
