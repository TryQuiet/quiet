const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { execFileSync } = require('node:child_process')
const { ENDPOINT } = require('../e2e/utils/qssCommunity.cjs')
const { ANDROID_APP_ID, androidSdkTool, validateAndroidBuild } = require('../e2e/utils/androidQssBuild.cjs')
const {
  androidCommands,
  parseAndroidProcesses,
  snapshotAndroidProcesses,
  waitForAndroidProcessExit,
  verifyAndroidRouting,
} = require('../e2e/utils/androidProcesses.cjs')
const { validateMobileConfiguration, mobileLifecycle } = require('../e2e/utils/qssMobile.cjs')

const table = rows => ['UID PID PPID STAT NAME', ...rows].join('\n')
const app = `10123 200 1 S ${ANDROID_APP_ID}`
const tor = '10123 201 200 S /data/app/quiet/lib/arm64/libtor.so'
const orphanTor = '10123 201 1 S /data/app/quiet/lib/arm64/libtor.so'
const unrelated = '10456 300 1 S com.another.client'
const env = {
  ANDROID_HOME: '/owned/sdk',
  DETOX_ANDROID_DEVICE_ID: 'emulator-5586',
  ADB_SERVER_SOCKET: 'tcp:localhost:5039',
}

test('ADB commands target the exact owned device and preserve an isolated ADB server', async () => {
  const calls = []
  const adb = androidCommands(env.DETOX_ANDROID_DEVICE_ID, env, async (binary, args, options) => {
    calls.push({ binary, args, options })
    return { stdout: 'UsbFfs tcp:3003 tcp:3003\n' }
  })
  await verifyAndroidRouting(adb)
  assert.deepEqual(
    calls.map(call => call.args),
    [
      ['-s', 'emulator-5586', 'reverse', 'tcp:3003', 'tcp:3003'],
      ['-s', 'emulator-5586', 'reverse', '--list'],
    ]
  )
  assert(calls.every(call => call.binary === '/owned/sdk/platform-tools/adb' && call.options.env === env))
  assert.throws(() => androidCommands('another-device', env), /exact owned Android device/)
  await assert.rejects(
    verifyAndroidRouting(async () => 'UsbFfs tcp:3003 tcp:9000'),
    /reverse localhost/
  )
})

test('offline proof rejects an orphaned Tor process after the app disappears', async () => {
  let rows = [app, tor, unrelated]
  const adb = async (...args) => (args.includes('run-as') ? '10123' : table(rows))
  const snapshot = await snapshotAndroidProcesses(adb)
  assert.deepEqual(snapshot, { uid: 10123, count: 2 })
  rows = [orphanTor, unrelated]
  await assert.rejects(
    waitForAndroidProcessExit(adb, snapshot, 0),
    /1 owned Android app\/backend\/Tor processes remain/
  )
  rows = ['10123 205 1 S com.quietmobile.debug:restarted-service', unrelated]
  await assert.rejects(waitForAndroidProcessExit(adb, snapshot, 0), /remain online/)
  rows = [unrelated, '10123 201 1 Z [libtor.so]']
  await waitForAndroidProcessExit(adb, snapshot, 0)
})

test('incomplete process inspection cannot be mistaken for a stopped backend', async () => {
  for (const output of ['', 'PID NAME\n200 quiet', 'UID PID PPID STAT NAME\nu0_a123 200 1 S quiet']) {
    assert.throws(() => parseAndroidProcesses(output), /process/)
  }
  await assert.rejects(
    snapshotAndroidProcesses(async () => '0'),
    /owned standard debug app UID/
  )
  await assert.rejects(
    snapshotAndroidProcesses(async (...args) => (args.includes('run-as') ? '10123' : table([tor]))),
    /not running/
  )
  await assert.rejects(
    waitForAndroidProcessExit(
      async () => {
        throw new Error('ADB disconnected')
      },
      { uid: 10123 }
    ),
    /ADB disconnected/
  )
})

test('shared mobile lifecycle reinstalls only once, checks every restart route, and proves offline intervals', async () => {
  let rows = [unrelated]
  const launches = []
  let routeChecks = 0
  const adb = async (...args) => {
    if (args[0] === 'reverse') {
      if (args[1] === '--list') routeChecks++
      return 'UsbFfs tcp:3003 tcp:3003'
    }
    return args.includes('run-as') ? '10123' : table(rows)
  }
  const device = {
    _bundleId: ANDROID_APP_ID,
    async launchApp(options) {
      launches.push(options)
      rows = [app, tor, unrelated]
    },
    async terminateApp() {
      rows = [unrelated]
    },
  }
  const mobile = mobileLifecycle(device, { platform: 'android', adb, build: {} })
  await assert.rejects(mobile.assertStopped(), /Stop the mobile client/)
  await mobile.launch(true)
  await assert.rejects(mobile.assertStopped(), /Stop the mobile client/)
  await mobile.stop()
  await mobile.assertStopped()
  await mobile.launch()
  await mobile.stop()
  assert.deepEqual(launches, [{ newInstance: true, delete: true }, { newInstance: true }])
  assert.equal(routeChecks, 4)
  assert.deepEqual(mobile.offlineProofs, [
    { platform: 'android', stopped: true, processCount: 2 },
    { platform: 'android', stopped: true, processCount: 2 },
  ])
})

test('cleanup terminates the owned app even if process inspection fails', async () => {
  let terminated = false
  const adb = async (...args) => {
    if (args[0] === 'reverse') return 'UsbFfs tcp:3003 tcp:3003'
    throw new Error('Process inspection failed')
  }
  const device = {
    _bundleId: ANDROID_APP_ID,
    async launchApp() {},
    async terminateApp() {
      terminated = true
    },
  }
  const mobile = mobileLifecycle(device, { platform: 'android', adb, build: {} })
  await mobile.launch(true)
  await assert.rejects(mobile.stop(), /Process inspection failed/)
  assert.equal(terminated, true)
})

test('platform selection rejects ambiguous devices and an ordinary non-QSS build', () => {
  const device = { id: env.DETOX_ANDROID_DEVICE_ID, getPlatform: () => 'android' }
  const config = { configurationName: 'android.att.e2e.qss', apps: { default: {} } }
  assert.equal(validateMobileConfiguration(device, config, env), 'android')
  assert.throws(() => validateMobileConfiguration(device, config, {}), /exact owned mobile device/)
  assert.throws(
    () => validateMobileConfiguration(device, { ...config, configurationName: 'android.att.e2e' }, env),
    /dedicated/
  )
  const iosDevice = { id: 'owned-simulator', getPlatform: () => 'ios' }
  assert.equal(
    validateMobileConfiguration(
      iosDevice,
      { ...config, configurationName: 'ios.sim.e2e.qss' },
      {
        DETOX_IOS_SIMULATOR_ID: iosDevice.id,
      }
    ),
    'ios'
  )
})

test('Detox selects one exact Android device and preserves localhost QSS routing', () => {
  const configPath = path.resolve(__dirname, '../.detoxrc.js')
  const config = JSON.parse(
    execFileSync(
      process.execPath,
      ['-e', 'process.stdout.write(JSON.stringify(require(process.argv[1])))', configPath],
      {
        encoding: 'utf8',
        env: { ...process.env, DETOX_ANDROID_DEVICE_ID: 'device.with+regex:5555' },
      }
    )
  )
  assert.equal(config.configurations['android.att.e2e.qss'].device, 'attached_qss')
  const selector = new RegExp(config.devices.attached_qss.device.adbName)
  assert(selector.test('device.with+regex:5555'))
  assert(!selector.test('deviceXwithregex:5555'))
  assert(!selector.test('prefix-device.with+regex:5555'))
  assert.deepEqual(config.apps['android.e2e.qss'].reversePorts, [8081, 3003])
  assert.equal(config.configurations['android.emu.e2e.qss'].app, 'android.e2e.qss')
  assert(config.apps['android.e2e.qss'].testBinaryPath.endsWith('-androidTest.apk'))
})

// Build actual Android resource tables/manifest APKs for the preflight test.
// Native payloads are small fixtures: this verifies packaging/config rejection,
// while the Detox suite runs the real APK and proves the runtime end to end.
test(
  'APK preflight inspects compiled resources and rejects stale environments or incomplete native packaging',
  {
    skip:
      !process.env.ANDROID_HOME && !process.env.ANDROID_SDK_ROOT
        ? 'Android SDK required for real aapt2 fixtures'
        : false,
  },
  t => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'quiet-android-qss-build-'))
    t.after(() => fs.rmSync(directory, { recursive: true, force: true }))
    const aapt2 = androidSdkTool('aapt2')
    const sdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT
    const platform = fs
      .readdirSync(path.join(sdk, 'platforms'))
      .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))[0]
    const framework = path.join(sdk, 'platforms', platform, 'android.jar')
    const manifest = (packageName, content) =>
      `<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="${packageName}">${content}</manifest>`
    const appPath = path.join(directory, 'app.apk')
    const testAppPath = path.join(directory, 'test.apk')
    const appManifest = path.join(directory, 'app.xml')
    const testManifest = path.join(directory, 'test.xml')
    fs.writeFileSync(appManifest, manifest(ANDROID_APP_ID, '<application android:debuggable="true"/>'))
    const buildTest = target => {
      fs.writeFileSync(
        testManifest,
        manifest(
          `${ANDROID_APP_ID}.test`,
          `<instrumentation android:name="androidx.test.runner.AndroidJUnitRunner" android:targetPackage="${target}"/>`
        )
      )
      execFileSync(aapt2, ['link', '-o', testAppPath, '-I', framework, '--manifest', testManifest])
    }
    buildTest(ANDROID_APP_ID)
    fs.mkdirSync(path.join(directory, 'res/values'), { recursive: true })
    const buildApp = (endpoint = ENDPOINT, omitBackend = false) => {
      fs.writeFileSync(
        path.join(directory, 'res/values/config.xml'),
        `<resources>${Object.entries({
          QSS_ENDPOINT: endpoint,
          QSS_ALLOWED: 'true',
          SHOULD_RUN_BACKEND_WORKER: 'true',
          NODE_ENV: 'development',
        })
          .map(([key, value]) => `<string name="${key}">${value}</string>`)
          .join('')}</resources>`
      )
      execFileSync(aapt2, [
        'compile',
        '--dir',
        path.join(directory, 'res'),
        '-o',
        path.join(directory, 'resources.zip'),
      ])
      execFileSync(aapt2, [
        'link',
        '-o',
        appPath,
        '-I',
        framework,
        '--manifest',
        appManifest,
        path.join(directory, 'resources.zip'),
      ])
      execFileSync('python3', [
        '-c',
        'import sys,zipfile; z=zipfile.ZipFile(sys.argv[1],"a"); [z.writestr(name,b"native test fixture") for name in sys.argv[2:]]; z.close()',
        appPath,
        'assets/index.android.bundle',
        'lib/arm64-v8a/libnode.so',
        'lib/arm64-v8a/libtor.so',
        ...(omitBackend ? [] : ['assets/nodejs-project/bundle.cjs']),
      ])
    }
    const config = { binaryPath: appPath, testBinaryPath: testAppPath }
    buildApp()
    assert.equal(validateAndroidBuild(config).app, appPath)
    buildApp('wss://qss-prod.quiet-services.app')
    assert.throws(() => validateAndroidBuild(config), /unexpected QSS_ENDPOINT/)
    buildApp('ws://10.0.2.2:3003')
    assert.throws(() => validateAndroidBuild(config), /unexpected QSS_ENDPOINT/)
    buildApp(ENDPOINT, true)
    assert.throws(() => validateAndroidBuild(config), /must bundle/)
    buildApp()
    buildTest('com.quietmobile.storybook.debug')
    assert.throws(() => validateAndroidBuild(config), /instrumentation APK/)
  }
)
