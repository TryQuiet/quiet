const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { spawnSync } = require('node:child_process')
const { test } = require('node:test')
const yaml = require('js-yaml')

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiet-notification-android-'))
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  for (const folder of ['bin', 'packages/mobile/android']) fs.mkdirSync(path.join(root, folder), { recursive: true })
  const log = path.join(root, 'commands.jsonl')
  const record = `#!${process.execPath} --\nconst fs = require('node:fs'); const args = process.argv.slice(2); fs.appendFileSync(${JSON.stringify(log)}, JSON.stringify({tool:require('node:path').basename(process.argv[1]),args,envFile:process.env.ENVFILE})+'\\n');\n`
  return { root, log, record, env: { ...process.env, PATH: `${root}/bin:${process.env.PATH}`, GITHUB_ACTIONS: 'true', GITHUB_WORKSPACE: root, RUNNER_TEMP: root } }
}

for (const lane of ['onboarding', 'provider']) {
  test(`${lane} workflow builds the emulator ABI with the selected notification settings`, t => {
    const { root, log, record, env } = fixture(t)
    fs.copyFileSync(path.resolve(__dirname, '../.env.e2e.qss.push'), path.join(root, 'packages/mobile/.env.e2e.qss.push'))
    for (const name of ['sdkmanager', 'npm']) {
      fs.writeFileSync(path.join(root, 'bin', name), record + `if (process.env.FAIL_INPUTS && ${JSON.stringify(name)} === 'npm') process.exit(23);\n`, { mode: 0o755 })
    }
    fs.writeFileSync(path.join(root, 'packages/mobile/android/gradlew'), record, { mode: 0o755 })
    const workflow = yaml.load(fs.readFileSync(path.resolve(__dirname, '../../../.github/workflows/mobile-notification-e2e.yml'), 'utf8'))
    const emulator = workflow.jobs.android.steps.find(step => step.uses?.startsWith('reactivecircus/android-emulator-runner@'))
    const build = workflow.jobs.android.steps.find(step => step.name === 'Build Android for the selected lane').run
    const result = spawnSync('bash', ['-e', '-o', 'pipefail', '-c', build], { cwd: root, env: { ...env, QUIET_NOTIFICATION_LANE: lane }, encoding: 'utf8' })
    assert.equal(result.status, 0, result.stderr)
    const calls = fs.readFileSync(log, 'utf8').trim().split('\n').map(JSON.parse)
    assert.deepEqual(calls.map(call => call.tool), ['sdkmanager', 'npm', 'gradlew'])
    assert.deepEqual(calls[0].args, ['ndk;28.2.13676358'])
    assert.deepEqual(calls[1].args, ['--prefix', 'packages/mobile', 'run', 'prepare-android-x86_64'])
    assert.ok(calls[2].args.includes(`-PreactNativeArchitectures=${emulator.with.arch}`))
    const settings = fs.readFileSync(calls[2].envFile, 'utf8')
    assert.match(settings, /QUIET_E2E_QSS_ONLY=true/)
    assert.match(settings, new RegExp(`^QPS_ALLOWED=${lane === 'provider'}$`, 'm'))
    fs.writeFileSync(log, '')
    const failed = spawnSync('bash', ['-e', '-o', 'pipefail', '-c', build], { cwd: root, env: { ...env, QUIET_NOTIFICATION_LANE: lane, FAIL_INPUTS: '1' }, encoding: 'utf8' })
    assert.equal(failed.status, 23)
    assert.ok(!fs.readFileSync(log, 'utf8').includes('gradlew'), 'missing native inputs must stop before Gradle')
  })
}

for (const abi of ['x86_64,x86', 'arm64-v8a']) {
  test(`the real Android lane checks emulator ABI ${abi} and cleans up on early failure`, t => {
    const { root, env } = fixture(t)
    const bin = path.join(root, 'bin')
    const compose = path.join(root, 'notification-fixture/compose.json')
    fs.mkdirSync(path.dirname(compose))
    fs.writeFileSync(compose, '{"publicFixture":true}')
    fs.writeFileSync(path.join(bin, 'adb'), `#!/bin/sh\nprintf '%s\\n' '${abi}'\n`, { mode: 0o755 })
    fs.writeFileSync(path.join(bin, 'Xvfb'), '#!/bin/sh\nexit 0\n', { mode: 0o755 })
    fs.writeFileSync(path.join(bin, 'xdpyinfo'), '#!/bin/sh\nif [ -f "$RUNNER_TEMP/display-seen" ]; then exit 37; fi\ntouch "$RUNNER_TEMP/display-seen"\n', { mode: 0o755 })
    const result = spawnSync('bash', [path.resolve(__dirname, '../e2e/appium/ci-android.sh')], { cwd: root, env: { ...env, QUIET_NOTIFICATION_LANE: 'onboarding' }, encoding: 'utf8', timeout: 10000 })
    assert.equal(result.status, abi.startsWith('x86_64') ? 37 : 1, result.stderr)
    assert.match(result.stdout, new RegExp(`failed during ${abi.startsWith('x86_64') ? 'display' : 'emulator-abi'}`), result.stderr)
    assert.equal(fs.existsSync(compose), false, 'early failures must still remove the provider runtime file')
  })
}
