const assert = require('node:assert/strict')
const { spawnSync } = require('node:child_process')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { test } = require('node:test')
const yaml = require('js-yaml')

const checkout = path.resolve(__dirname, '../../..')
const mobile = path.join(checkout, 'packages/mobile')
const workflow = yaml.load(fs.readFileSync(path.join(checkout, '.github/workflows/e2e-ios.yml'), 'utf8'))
const job = workflow.jobs['detox-ios']
const step = name => {
  const selected = job.steps.find(entry => entry.name === name)
  assert.ok(selected, `Workflow step exists: ${name}`)
  return selected
}
const udid = '01234567-89AB-CDEF-0123-456789ABCDEF'

function fixture(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'quiet-ios-workflow-'))
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }))
  const bin = path.join(directory, 'bin')
  fs.mkdirSync(bin)
  const env = {
    ...process.env,
    PATH: `${bin}${path.delimiter}${process.env.PATH}`,
    GITHUB_RUN_ID: '1234',
    GITHUB_RUN_ATTEMPT: '2',
    GITHUB_WORKSPACE: checkout,
    GITHUB_ENV: path.join(directory, 'environment'),
    GITHUB_OUTPUT: path.join(directory, 'output'),
    RUNNER_TEMP: directory,
    QUIET_TEST_LOG: path.join(directory, 'commands.jsonl'),
    QUIET_TEST_UDID: udid,
  }
  for (const [key, value] of Object.entries(job.env)) {
    env[key] = value.replaceAll('${{ github.workspace }}', checkout)
  }
  for (const name of ['xcrun', 'python3']) {
    fs.writeFileSync(
      path.join(bin, name),
      `#!${process.execPath}\n` +
        `const fs = require('node:fs');\n` +
        `const args = process.argv.slice(2);\n` +
        `fs.appendFileSync(process.env.QUIET_TEST_LOG, JSON.stringify({ tool: ${JSON.stringify(name)}, args }) + '\\n');\n` +
        `if (args.includes(process.env.QUIET_TEST_FAIL)) process.exit(23);\n` +
        `if (args.includes('prepare-run')) fs.mkdirSync(args[args.indexOf('--run-output') + 1], {mode: 0o700});\n` +
        `if (args[0] === 'simctl' && args[1] === 'create') console.log(process.env.QUIET_TEST_UDID);\n`,
      { mode: 0o755 }
    )
  }
  const run = (name, overrides = {}, cwd = checkout) =>
    spawnSync('bash', ['--noprofile', '--norc', '-e', '-o', 'pipefail', '-c', step(name).run], {
      cwd,
      env: { ...env, ...step(name).env, ...overrides },
      encoding: 'utf8',
      timeout: 30000,
    })
  const commands = () => fs.readFileSync(env.QUIET_TEST_LOG, 'utf8').trim().split('\n').map(JSON.parse)
  assert.equal(run('Set build paths').status, 0)
  for (const line of fs.readFileSync(env.GITHUB_ENV, 'utf8').trim().split('\n')) {
    const separator = line.indexOf('=')
    env[line.slice(0, separator)] = line.slice(separator + 1)
  }
  fs.unlinkSync(env.GITHUB_ENV)
  return { directory, bin, env, run, commands }
}

test('the workflow creates one exact runtime/device and hands its ID to subsequent steps', t => {
  const f = fixture(t)
  assert.equal(f.run('Create owned simulator').status, 0)
  assert.deepEqual(f.commands(), [
    {
      tool: 'xcrun',
      args: [
        'simctl',
        'create',
        'Quiet E2E 1234-2',
        'com.apple.CoreSimulator.SimDeviceType.iPhone-16-Pro',
        'com.apple.CoreSimulator.SimRuntime.iOS-18-5',
      ],
    },
  ])
  assert.equal(fs.readFileSync(f.env.GITHUB_ENV, 'utf8'), `DETOX_IOS_SIMULATOR_ID=${udid}\n`)
  assert.equal(fs.readFileSync(f.env.GITHUB_OUTPUT, 'utf8'), `udid=${udid}\n`)
})

test('missing runtime or malformed simulator output fails before exporting a device', t => {
  const f = fixture(t)
  for (const overrides of [{ QUIET_TEST_FAIL: 'create' }, { QUIET_TEST_UDID: 'no device' }]) {
    assert.notEqual(f.run('Create owned simulator', overrides).status, 0)
    assert.equal(fs.existsSync(f.env.GITHUB_ENV), false)
    assert.equal(fs.existsSync(f.env.GITHUB_OUTPUT), false)
  }
  assert.equal(step('Remove owned simulator').if, "always() && steps.simulator.outputs.udid != ''")
})

test('boot failure propagates, and cleanup still deletes only the owned simulator', t => {
  const f = fixture(t)
  assert.equal(f.run('Boot owned simulator', { DETOX_IOS_SIMULATOR_ID: udid, QUIET_TEST_FAIL: 'boot' }).status, 23)
  assert.equal(f.run('Remove owned simulator', { DETOX_IOS_SIMULATOR_ID: udid, QUIET_TEST_FAIL: 'shutdown' }).status, 0)
  assert.deepEqual(
    f.commands().map(command => command.args),
    [
      ['simctl', 'boot', udid],
      ['simctl', 'shutdown', udid],
      ['simctl', 'delete', udid],
    ]
  )
})

test('successful boot waits for readiness; screenshot targets the same owned simulator', t => {
  const f = fixture(t)
  assert.equal(f.run('Boot owned simulator', { DETOX_IOS_SIMULATOR_ID: udid }).status, 0)
  assert.equal(f.run('Take screenshot', { DETOX_IOS_SIMULATOR_ID: udid }).status, 0)
  assert.deepEqual(
    f.commands().map(command => command.args),
    [
      ['simctl', 'boot', udid],
      ['simctl', 'bootstatus', udid, '-b'],
      ['simctl', 'io', udid, 'screenshot', path.join(f.directory, 'quiet-ios-screenshot.png')],
    ]
  )
})

test('actual pinned Detox CLI forwards the workflow framework/output into the guarded staging builder', t => {
  const f = fixture(t)
  const result = f.run('Build bundled Detox app', {}, mobile)
  assert.equal(result.status, 0, result.stderr)
  const expected = [
    path.join(mobile, 'scripts/tor-ios-simulator/build-storybook.py'),
    '--checkout',
    checkout,
    '--framework',
    f.env.DETOX_IOS_ARM64_TOR_FRAMEWORK,
    '--output',
    f.env.DETOX_IOS_ARM64_DEBUG_OUTPUT,
    '--scheme',
    'Quiet',
    '--configuration',
    'Debug',
    '--env-file',
    '.env.staging',
  ]
  assert.deepEqual(f.commands(), [{ tool: 'python3', args: expected }])
  assert.notEqual(f.run('Build bundled Detox app', { QUIET_TEST_FAIL: '--scheme' }, mobile).status, 0)

  const selected = spawnSync(
    process.execPath,
    [
      '-e',
      "const config=require('./.detoxrc.js'); console.log(JSON.stringify({app:config.apps['ios.debug'],device:config.devices.simulator_ci.device}))",
    ],
    { cwd: mobile, env: { ...f.env, DETOX_IOS_SIMULATOR_ID: udid }, encoding: 'utf8' }
  )
  assert.equal(selected.status, 0, selected.stderr)
  const config = JSON.parse(selected.stdout)
  assert.deepEqual(config.device, { id: udid })
  assert.equal(
    config.app.binaryPath,
    path.join(f.env.DETOX_IOS_ARM64_DEBUG_OUTPUT, 'DerivedData/Build/Products/Debug-iphonesimulator/Quiet.app')
  )
})

test('temporary Firebase resource is valid, refuses replacement, and has bounded cleanup', t => {
  const f = fixture(t)
  // Use real Python and plistlib for the resource creation, rather than the build recorder.
  fs.unlinkSync(path.join(f.bin, 'python3'))
  const ios = path.join(f.directory, 'packages/mobile/ios')
  fs.mkdirSync(ios, { recursive: true })
  const resource = path.join(ios, 'GoogleService-Info.plist')
  assert.equal(f.run('Prepare simulator build resource', {}, ios).status, 0)
  const parsed = spawnSync('python3', [
    '-c',
    'import plistlib,sys; assert plistlib.load(open(sys.argv[1], "rb")) == {}',
    resource,
  ])
  assert.equal(parsed.status, 0)
  const original = fs.readFileSync(resource)
  assert.notEqual(f.run('Prepare simulator build resource', {}, ios).status, 0)
  assert.deepEqual(fs.readFileSync(resource), original)
  assert.equal(step('Remove temporary build resource').if, "always() && steps.firebase.outcome == 'success'")
  assert.equal(f.run('Remove temporary build resource', {}, f.directory).status, 0)
  assert.equal(fs.existsSync(resource), false)
})

test('workflow prepares Tor before compiling and uses the same staging app for both suites', () => {
  assert.ok(
    job.steps.indexOf(step('Prepare pinned ARM simulator Tor')) < job.steps.indexOf(step('Build bundled Detox app'))
  )
  for (const name of ['Run basic tests', 'Verify message acknowledgment and persistence']) {
    assert.match(step(name).run, /^\.\/node_modules\/\.bin\/detox test .* -c ios\.sim\.debug\.ci /)
  }
  for (const entry of job.steps.filter(entry => entry.run)) {
    const syntax = spawnSync('bash', ['-n'], { input: entry.run, encoding: 'utf8' })
    assert.equal(syntax.status, 0, `${entry.name}: ${syntax.stderr}`)
  }
})

test('QSS build retires the baseline cache and uses a separate guarded environment workspace', t => {
  const f = fixture(t)
  assert.notEqual(f.env.DETOX_IOS_ARM64_E2E_QSS_OUTPUT, f.env.DETOX_IOS_ARM64_DEBUG_OUTPUT)
  const result = f.run('Build bundled QSS Detox app', { DETOX_IOS_SIMULATOR_ID: udid }, mobile)
  assert.equal(result.status, 0, result.stderr)
  assert.deepEqual(f.commands(), [
    { tool: 'xcrun', args: ['simctl', 'shutdown', udid] },
    { tool: 'python3', args: ['scripts/qss-e2e/prepare-runner.py', '--retire-baseline', f.env.DETOX_IOS_ARM64_DEBUG_OUTPUT, '--checkout', checkout] },
    { tool: 'python3', args: [
      path.join(mobile, 'scripts/tor-ios-simulator/build-storybook.py'),
      '--checkout', checkout, '--framework', f.env.DETOX_IOS_ARM64_TOR_FRAMEWORK,
      '--output', f.env.DETOX_IOS_ARM64_E2E_QSS_OUTPUT,
      '--scheme', 'Quiet', '--configuration', 'Debug', '--env-file', '.env.e2e.qss',
    ] },
  ])
  assert.notEqual(f.run('Build bundled QSS Detox app', { DETOX_IOS_SIMULATOR_ID: udid, QUIET_TEST_FAIL: '--scheme' }, mobile).status, 0)
})

test('QSS suites prepare independent runs, keep private failure logs, and preserve exit failures', t => {
  const f = fixture(t)
  const fakeMobile = path.join(f.directory, 'mobile')
  const detox = path.join(fakeMobile, 'node_modules/.bin/detox')
  fs.mkdirSync(path.dirname(detox), { recursive: true })
  fs.writeFileSync(detox, `#!${process.execPath}\n` +
    `const fs = require('node:fs');\n` +
    `const runtime = Object.fromEntries(['IS_E2E','TEST_MODE','IS_LOCAL','LOG_TO_FILE'].filter(key => process.env[key] !== undefined).map(key => [key, process.env[key]]));\n` +
    `fs.appendFileSync(process.env.QUIET_TEST_LOG, JSON.stringify({tool:'detox',args:process.argv.slice(2),run:process.env.QUIET_QSS_E2E_RUN_DIR,runtime})+'\\n');\n` +
    `console.error('PRIVATE-INVITATION-CANARY'); process.exit(Number(process.env.QUIET_DETOX_EXIT || 0));\n`, { mode: 0o755 })
  for (const [name, output, args] of [
    ['Run single-player QSS test', f.env.QUIET_QSS_SINGLE_RUN, ['test', 'qss-community', '-c', 'ios.sim.e2e.qss']],
    ['Run desktop and iOS QSS tests', f.env.QUIET_QSS_MIXED_RUN, ['test', '-c', 'ios.sim.e2e.qss', '--config', 'e2e/jest.desktop.config.js']],
  ]) {
    const result = f.run(name, { QUIET_DETOX_EXIT: '37' }, fakeMobile)
    assert.equal(result.status, 37)
    assert.doesNotMatch(result.stdout + result.stderr, /PRIVATE-INVITATION-CANARY/)
    assert.match(fs.readFileSync(path.join(output, 'detox-private.log'), 'utf8'), /PRIVATE-INVITATION-CANARY/)
    assert.equal(fs.statSync(path.join(output, 'detox-private.log')).mode & 0o777, 0o600)
    const calls = f.commands().slice(-2)
    assert.deepEqual(calls[0], { tool: 'python3', args: ['scripts/qss-e2e/fixture.py', 'prepare-run', '--output', f.env.QUIET_QSS_LOCAL_FIXTURE_OUTPUT, '--run-output', output] })
    const runtime = name === 'Run desktop and iOS QSS tests'
      ? { IS_E2E: 'true', TEST_MODE: 'true', IS_LOCAL: 'true', LOG_TO_FILE: 'false' }
      : {}
    assert.deepEqual(calls[1], { tool: 'detox', run: output, runtime, args: [...args, '--artifacts-location', path.join(output, 'artifacts'), '--json', '--outputFile', path.join(output, 'jest-private.json')] })
    assert.notEqual(f.run(name, {}, fakeMobile).status, 0, 'Existing run directory must not be reused')
  }
})

test('QSS cleanup runs only for initialized owned native process state', t => {
  const f = fixture(t)
  assert.equal(step('Stop owned QSS fixture').if, 'always()')
  assert.equal(f.run('Stop owned QSS fixture').status, 0)
  assert.equal(fs.existsSync(f.env.QUIET_TEST_LOG), false)
  fs.mkdirSync(f.env.QUIET_QSS_LOCAL_FIXTURE_OUTPUT)
  fs.writeFileSync(path.join(f.env.QUIET_QSS_LOCAL_FIXTURE_OUTPUT, 'native-processes.json'), '{}')
  assert.equal(f.run('Stop owned QSS fixture').status, 0)
  assert.deepEqual(f.commands(), [{ tool: 'python3', args: ['packages/mobile/scripts/qss-e2e/fixture.py', 'stop', '--output', f.env.QUIET_QSS_LOCAL_FIXTURE_OUTPUT] }])
  assert.equal(f.run('Stop owned QSS fixture', { QUIET_TEST_FAIL: 'stop' }).status, 23)
})

test('workflow orders resource-limited builds and baseline/QSS coverage without publishing QSS secrets', () => {
  assert.equal(job['runs-on'], 'macos-15')
  assert.equal(job.env.DEVELOPER_DIR, '/Applications/Xcode_26.3.app/Contents/Developer')
  const order = [
    'Prepare hosted runner disk', 'Install dependencies', 'Build desktop and shared backend for QSS',
    'Build bundled Detox app', 'Preserve baseline build receipt', 'Run basic tests',
    'Verify message acknowledgment and persistence', 'Take screenshot',
    'Build bundled QSS Detox app', 'Start native QSS fixture', 'Boot owned simulator for QSS',
    'Run single-player QSS test', 'Run desktop and iOS QSS tests', 'Stop owned QSS fixture', 'Remove owned simulator',
  ].map(name => job.steps.indexOf(step(name)))
  assert.deepEqual([...order].sort((a, b) => a - b), order)
  assert.equal(job.env.TEST_MODE, undefined)
  assert.equal(step('Build desktop and shared backend for QSS').env.TEST_MODE, 'true')
  assert.match(step('Install dependencies').run, /@quiet\/desktop,e2e-tests/)
  assert.match(step('Start native QSS fixture').run, /up --runtime native/)
  assert.doesNotMatch(step('Start native QSS fixture').run, /docker|ssh|brew services/)
  assert.match(step('Prepare pinned QSS Node').run, /e9404633bc02a5162c5c573b1e2490f5fb44648345d64a958b17e325729a5e42/)
  const uploads = step('Upload diagnostics').with.path.trim().split('\n')
  assert.deepEqual(uploads.filter(entry => entry.includes('qss')), ['${{ runner.temp }}/quiet-qss-arm64-validation/result.json', '${{ runner.temp }}/quiet-qss-ci-summary.json'])
})
