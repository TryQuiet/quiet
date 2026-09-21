const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { spawnSync } = require('node:child_process')
const { test } = require('node:test')
const yaml = require('js-yaml')

for (const platform of ['android', 'ios']) {
  test(`the real ${platform} provider lane stops at staging preflight without starting a local server`, t => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiet-staging-workflow-'))
    t.after(() => fs.rmSync(root, { recursive: true, force: true }))
    const bin = path.join(root, 'bin')
    fs.mkdirSync(bin)
    const tools = {
      uname: '#!/bin/sh\necho "Darwin arm64"\n',
      adb: '#!/bin/sh\necho x86_64,x86\n',
      Xvfb: '#!/bin/sh\nexit 0\n',
      fluxbox: '#!/bin/sh\nexit 0\n',
      xdpyinfo: '#!/bin/sh\nexit 0\n',
      node: '#!/bin/sh\nprintf "%s\\n" "$@" > "$RUNNER_TEMP/staging-command"\nexit 42\n',
      python3: '#!/bin/sh\ntouch "$RUNNER_TEMP/unexpected-local-fixture"\nexit 99\n',
      brew: '#!/bin/sh\ntouch "$RUNNER_TEMP/unexpected-local-fixture"\nexit 99\n',
    }
    for (const [name, source] of Object.entries(tools)) fs.writeFileSync(path.join(bin, name), source, { mode: 0o755 })
    const result = spawnSync('bash', [path.resolve(__dirname, `../e2e/appium/ci-${platform}.sh`)], {
      cwd: root,
      env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, GITHUB_ACTIONS: 'true', GITHUB_WORKSPACE: root,
        RUNNER_TEMP: root, QUIET_NOTIFICATION_LANE: 'provider', QUIET_QSS_LOCAL_FIXTURE_OUTPUT: '/stale/inherited/fixture' },
      encoding: 'utf8', timeout: 10000,
    })
    assert.equal(result.status, 42, result.stderr)
    const args = fs.readFileSync(path.join(root, 'staging-command'), 'utf8').trim().split('\n')
    assert.deepEqual(args, ['packages/mobile/e2e/appium/staging.mjs', '--prepare', path.join(root, platform === 'ios' ? 'notification-ios-run' : 'notification-run')])
    assert.equal(fs.existsSync(path.join(root, 'unexpected-local-fixture')), false)
    assert.match(result.stdout, /notification lane failed during/)
  })
}

test('both provider workflows request only native Firebase client secrets', () => {
  for (const [filename, job] of [['mobile-notification-e2e.yml', 'android'], ['mobile-notification-ios.yml', 'appium-ios']]) {
    const workflow = yaml.load(fs.readFileSync(path.resolve(__dirname, '../../../.github/workflows', filename), 'utf8'))
    const steps = workflow.jobs[job].steps
    const credentials = steps.find(step => step.name === 'Validate staging Firebase client configuration')
    assert.match(credentials.run, /--staging$/)
    assert.ok(Object.keys(credentials.env).every(key => ['ANDROID_FIREBASE_KEY', 'IOS_FIREBASE_KEY'].includes(key)))
    assert.ok(!JSON.stringify(workflow).includes('secrets.QSS_AWS_'))
    assert.ok(!JSON.stringify(workflow).includes('secrets.FIREBASE_IOS_PRIVATE_KEY'))
    const preflight = steps.findIndex(step => step.name === 'Check staging health and automated enrollment')
    const build = steps.findIndex(step => step.name === (job === 'android' ? 'Build the shared QSS-only backend' : 'Build native clients for the selected lane'))
    assert.ok(preflight > 0 && preflight < build, 'unavailable staging enrollment must fail before native builds')
  }
})
