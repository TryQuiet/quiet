const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { spawnSync } = require('node:child_process')
const { test } = require('node:test')
const yaml = require('js-yaml')

for (const lane of ['onboarding', 'provider']) {
  test(`the real ${lane} shell lane builds the installed Tor framework before signing`, t => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiet-notification-workflow-'))
    t.after(() => fs.rmSync(root, { recursive: true, force: true }))
    const bin = path.join(root, 'bin')
    const log = path.join(root, 'commands.jsonl')
    for (const folder of ['bin', 'packages/mobile/ios', 'packages/backend', 'packages/desktop/node_modules/.bin', 'notification-credentials']) {
      fs.mkdirSync(path.join(root, folder), { recursive: true })
    }
    if (lane === 'provider') fs.writeFileSync(path.join(root, 'packages/mobile/ios/GoogleService-Info.plist'), 'public fixture')
    const record = `#!${process.execPath} --\nconst fs = require('node:fs'); const args = process.argv.slice(2); fs.appendFileSync(${JSON.stringify(log)}, JSON.stringify({tool:require('node:path').basename(process.argv[1]),args})+String.fromCharCode(10));\n`
    for (const name of ['npm', 'electron-builder']) {
      fs.writeFileSync(path.join(name === 'npm' ? bin : path.join(root, 'packages/desktop/node_modules/.bin'), name), record, { mode: 0o755 })
    }
    fs.writeFileSync(path.join(bin, 'uname'), '#!/bin/sh\necho "Darwin arm64"\n', { mode: 0o755 })
    fs.writeFileSync(path.join(bin, 'python3'), record + `if (args[0] === '-') { const r = require('node:child_process').spawnSync('/usr/bin/python3', args, {stdio:'inherit'}); process.exit(r.status); } if (args[0].endsWith('/build-ios.py') && process.env.QUIET_FAIL_BUILD) process.exit(23);\n`, { mode: 0o755 })
    const env = { ...process.env, PATH: `${bin}:${process.env.PATH}`, GITHUB_ACTIONS: 'true', GITHUB_WORKSPACE: root, RUNNER_TEMP: root, QUIET_NOTIFICATION_LANE: lane }
    const script = path.resolve(__dirname, '../e2e/appium/ci-ios-build.sh')
    const result = spawnSync('bash', [script], { env, encoding: 'utf8', timeout: 30000 })
    assert.equal(result.status, 0, result.stderr)
    const calls = fs.readFileSync(log, 'utf8').trim().split('\n').map(JSON.parse)
    const buildIndex = calls.findIndex(call => call.args[0]?.endsWith('/build-ios.py'))
    assert.ok(buildIndex >= 0)
    const build = calls[buildIndex].args
    assert.equal(build[build.indexOf('--env-file') + 1], lane === 'provider' ? '.env.e2e.qss.staging' : '.env.e2e.qss')
    assert.ok(!build.includes('--framework'))
    assert.ok(calls.findIndex(call => call.args[0]?.endsWith('/sign-ios-simulator.py') && call.args.includes('--app')) > buildIndex)
    if (lane === 'onboarding') fs.unlinkSync(path.join(root, 'packages/mobile/ios/GoogleService-Info.plist'))
    fs.writeFileSync(log, '')
    const failed = spawnSync('bash', [script], { env: { ...env, QUIET_FAIL_BUILD: '1' }, encoding: 'utf8', timeout: 30000 })
    assert.equal(failed.status, 23)
    assert.ok(!fs.readFileSync(log, 'utf8').includes('"--app"'), 'failed native build must stop before signing')
  })
}

test('notification CI uses deployed locked pods and the current builder lane', () => {
  const workflow = yaml.load(fs.readFileSync(path.resolve(__dirname, '../../../.github/workflows/mobile-notification-ios.yml'), 'utf8'))
  assert.ok(!workflow.jobs['tor-simulator'])
  const steps = workflow.jobs['appium-ios'].steps
  assert.ok(steps.some(step => step.run?.includes('pod install --deployment')))
  assert.ok(steps.some(step => step.run === 'bash packages/mobile/e2e/appium/ci-ios-build.sh'))
})
