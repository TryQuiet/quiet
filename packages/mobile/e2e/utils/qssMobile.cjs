const path = require('node:path')
const { validateBuild } = require('./qssCommunity.cjs')
const { validateAndroidBuild, ANDROID_APP_ID } = require('./androidQssBuild.cjs')
const {
  androidCommands,
  snapshotAndroidProcesses,
  waitForAndroidProcessExit,
  verifyAndroidRouting,
} = require('./androidProcesses.cjs')
const { snapshotOwnedProcesses, waitForProcessExit } = require('./desktopProcesses.cjs')

function validateMobileConfiguration(device, config, env = process.env) {
  const platform = device.getPlatform()
  const configurations = platform === 'ios' ? ['ios.sim.e2e.qss'] : ['android.att.e2e.qss', 'android.emu.e2e.qss']
  if (!['ios', 'android'].includes(platform) || !configurations.includes(config.configurationName)) {
    throw new Error('Use the dedicated ios.sim.e2e.qss or android.att/emu.e2e.qss configuration')
  }
  const variable = platform === 'ios' ? 'DETOX_IOS_SIMULATOR_ID' : 'DETOX_ANDROID_DEVICE_ID'
  if (!env[variable] || device.id !== env[variable]) {
    throw new Error(`Select the exact owned mobile device using ${variable}`)
  }
  if (Object.values(config.apps).length !== 1) throw new Error('Select exactly one native QSS app')
  return platform
}

function createQssMobile(device, config, env = process.env) {
  const platform = validateMobileConfiguration(device, config, env)
  const appConfig = Object.values(config.apps)[0]
  const build =
    platform === 'ios' ? validateBuild(env.DETOX_IOS_ARM64_E2E_QSS_OUTPUT) : validateAndroidBuild(appConfig, env)
  if (path.resolve(appConfig.binaryPath) !== build.app) {
    throw new Error('Detox must install the exact app verified by the QSS build preflight')
  }
  const adb = platform === 'android' ? androidCommands(device.id, env) : undefined
  return mobileLifecycle(device, { platform, adb, build })
}

function mobileLifecycle(device, { platform, adb, build }) {
  let launched = false
  let stopped
  const offlineProofs = []

  const assertStopped = async () => {
    if (launched || !stopped) throw new Error('Stop the mobile client before accepting offline delivery')
    if (adb) await waitForAndroidProcessExit(adb, stopped)
    else await waitForProcessExit(stopped)
  }

  return {
    platform,
    build,
    offlineProofs,
    assertStopped,
    async launch(fresh = false) {
      if (stopped) await assertStopped()
      if (adb) await verifyAndroidRouting(adb)
      // Detox installs Android with -g, granting POST_NOTIFICATIONS before
      // startup. iOS needs the explicit permissions argument instead.
      await device.launchApp({
        newInstance: true,
        ...(fresh ? { delete: true, ...(platform === 'ios' ? { permissions: { notifications: 'YES' } } : {}) } : {}),
      })
      launched = true
      if (adb) {
        if (device._bundleId !== ANDROID_APP_ID) throw new Error('Detox launched a different Android package')
        // Fresh installation also configures reversePorts; verify the route
        // after it and again on every restart, without changing QSS identity.
        await verifyAndroidRouting(adb)
      }
    },
    async stop() {
      if (!launched) return
      try {
        stopped = adb
          ? await snapshotAndroidProcesses(adb)
          : snapshotOwnedProcesses(Number(device._processes[device._bundleId]))
      } finally {
        // A failed process preflight must still clean up the owned application.
        await device.terminateApp()
        launched = false
      }
      await assertStopped()
      offlineProofs.push({ platform, stopped: true, processCount: adb ? stopped.count : stopped.length })
    },
  }
}

module.exports = { validateMobileConfiguration, createQssMobile, mobileLifecycle }
