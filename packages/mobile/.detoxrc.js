const path = require('path')

const shellQuote = value => `'${value.replace(/'/g, "'\\''")}'`

// The installed Tor pod lacks an arm64 simulator slice. Every standard simulator
// build must use the guarded wrapper with a separately prepared Tor.framework.
// Its owned output workspace reuses DerivedData while keeping evidence per run.
const iosSimulatorApp = (name, envFile, configuration = 'Debug') => {
  const output =
    process.env[`DETOX_IOS_ARM64_${name.toUpperCase().replace(/\./g, '_')}_OUTPUT`] ||
    `/tmp/quiet-${name}-arm64-validation`
  const framework =
    process.env.DETOX_IOS_ARM64_TOR_FRAMEWORK ||
    '/tmp/quiet-tor4059-source/build/Build/Products/Release-iphonesimulator/Tor.framework'
  return {
    type: 'ios.app',
    binaryPath: path.join(output, 'DerivedData/Build/Products', `${configuration}-iphonesimulator/Quiet.app`),
    build: [
      'python3',
      path.join(__dirname, 'scripts/tor-ios-simulator/build-storybook.py'),
      '--checkout',
      path.resolve(__dirname, '../..'),
      '--framework',
      framework,
      '--output',
      output,
      '--scheme',
      'Quiet',
      '--configuration',
      configuration,
      '--env-file',
      envFile,
    ]
      .map(shellQuote)
      .join(' '),
  }
}

/** @type {Detox.DetoxConfig} */
module.exports = {
  testRunner: {
    args: {
      $0: 'jest',
      config: 'e2e/jest.config.js',
    },
    jest: {
      setupTimeout: 120000,
    },
  },
  apps: {
    'android.debug': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/standard/debug/app-standard-debug.apk',
      build:
        'cd android && ENVFILE=../.env.development ./gradlew assembleStandardDebug assembleStandardDebugAndroidTest -DtestBuildType=debug',
      reversePorts: [8081],
    },
    'android.e2e': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/standard/debug/app-standard-debug.apk',
      build:
        'cd android && ENVFILE=../.env.e2e ./gradlew assembleStandardDebug assembleStandardDebugAndroidTest -DtestBuildType=debug',
    },
    'android.e2e.qss': {
      type: 'android.apk',
      binaryPath:
        process.env.DETOX_ANDROID_E2E_QSS_APK || 'android/app/build/outputs/apk/standard/debug/app-standard-debug.apk',
      testBinaryPath:
        process.env.DETOX_ANDROID_E2E_QSS_TEST_APK ||
        'android/app/build/outputs/apk/androidTest/standard/debug/app-standard-debug-androidTest.apk',
      build:
        'cd android && ENVFILE=../.env.e2e.qss ./gradlew assembleStandardDebug assembleStandardDebugAndroidTest -DtestBuildType=debug',
      reversePorts: [8081, 3003],
    },
    'android.storybook': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/storybook/debug/app-storybook-debug.apk',
      build:
        'cd android && ENVFILE=../.env.storybook ./gradlew assembleStorybookDebug assembleStorybookDebugAndroidTest -DtestBuildType=debug',
      reversePorts: [8082],
    },
    'android.release': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/standard/release/app-standard-release.apk',
      build:
        'cd android && ENVFILE=../.env.production ./gradlew assembleStandardRelease assembleStandardReleaseAndroidTest -DtestBuildType=release',
    },
    'ios.debug': iosSimulatorApp('debug', '.env.staging'),
    'ios.e2e': iosSimulatorApp('e2e', '.env.e2e'),
    'ios.e2e.qss': iosSimulatorApp('e2e.qss', '.env.e2e.qss'),
    'ios.storybook.arm64': {
      type: 'ios.app',
      // Prebuilt by scripts/tor-ios-simulator/build-storybook.py; the installed Tor pod lacks an arm64 simulator slice.
      binaryPath:
        process.env.DETOX_IOS_ARM64_STORYBOOK_APP ||
        '/tmp/quiet-storybook-arm64-validation/DerivedData/Build/Products/Debug-iphonesimulator/Quiet.app',
    },
    'ios.release': iosSimulatorApp('release', '.env.production', 'Release'),
  },
  devices: {
    simulator: {
      type: 'ios.simulator',
      bootArgs: '--arch=arm64',
      device: process.env.DETOX_IOS_SIMULATOR_ID
        ? { id: process.env.DETOX_IOS_SIMULATOR_ID }
        : { type: 'iPhone 15 Pro' },
    },
    simulator_storybook_arm64: {
      type: 'ios.simulator',
      bootArgs: '--arch=arm64',
      device: process.env.DETOX_IOS_SIMULATOR_ID
        ? { id: process.env.DETOX_IOS_SIMULATOR_ID }
        : { type: 'iPhone 15 Pro', os: 'iOS 18.5' },
    },
    simulator_ci: {
      type: 'ios.simulator',
      bootArgs: '--arch=arm64',
      device: process.env.DETOX_IOS_SIMULATOR_ID ? { id: process.env.DETOX_IOS_SIMULATOR_ID } : { type: 'iPhone 15' },
    },
    attached: {
      type: 'android.attached',
      device: {
        adbName: '.*',
      },
    },
    attached_qss: {
      type: 'android.attached',
      device: {
        adbName: process.env.DETOX_ANDROID_DEVICE_ID
          ? `^${process.env.DETOX_ANDROID_DEVICE_ID.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`
          : '^$', // QSS scenarios erase app data; require an exact owned device.
      },
    },
    emulator_qss: {
      type: 'android.emulator',
      device: {
        avdName: process.env.DETOX_ANDROID_QSS_AVD || 'quiet_qss_e2e',
      },
    },
    emulator: {
      type: 'android.emulator',
      device: {
        avdName: 'emulator',
      },
    },
    emulator_ci: {
      type: 'android.emulator',
      device: {
        avdName: 'emulator_ci',
      },
    },
  },
  configurations: {
    'ios.sim.debug': {
      device: 'simulator',
      app: 'ios.debug',
      artifacts: {
        rootDir: './e2e/artifacts/ios',
        plugins: {
          instruments: 'all',
        },
      },
    },
    'ios.sim.e2e.qss': {
      device: 'simulator',
      app: 'ios.e2e.qss',
      artifacts: {
        rootDir: './e2e/artifacts/ios',
        plugins: {
          instruments: 'all',
        },
      },
    },
    'ios.sim.debug.ci': {
      device: 'simulator_ci',
      app: 'ios.debug',
      artifacts: {
        rootDir: './e2e/artifacts/ios',
        plugins: {
          instruments: 'all',
        },
      },
    },
    'ios.sim.storybook': {
      device: 'simulator_storybook_arm64',
      app: 'ios.storybook.arm64',
      artifacts: {
        rootDir: './e2e/artifacts/ios',
        plugins: {
          instruments: 'all',
        },
      },
    },
    'ios.sim.storybook.arm64': {
      device: 'simulator_storybook_arm64',
      app: 'ios.storybook.arm64',
      artifacts: {
        rootDir: './e2e/artifacts/ios',
        plugins: {
          instruments: 'all',
        },
      },
    },
    'ios.sim.release': {
      device: 'simulator',
      app: 'ios.release',
    },
    'ios.sim.e2e': {
      device: 'simulator',
      app: 'ios.e2e',
      artifacts: {
        rootDir: './e2e/artifacts/ios',
        plugins: {
          instruments: 'all',
        },
      },
    },
    'android.att.debug': {
      device: 'attached',
      app: 'android.debug',
      artifacts: {
        rootDir: './e2e/artifacts/android',
      },
    },
    'android.att.e2e': {
      device: 'attached',
      app: 'android.e2e',
      artifacts: {
        rootDir: './e2e/artifacts/android',
      },
    },
    'android.att.e2e.qss': {
      device: 'attached_qss',
      app: 'android.e2e.qss',
      artifacts: {
        rootDir: './e2e/artifacts/android',
      },
    },
    'android.att.storybook': {
      device: 'attached',
      app: 'android.storybook',
      artifacts: {
        rootDir: './e2e/artifacts/android',
      },
    },
    'android.att.release': {
      device: 'attached',
      app: 'android.release',
    },
    'android.emu.debug': {
      device: 'emulator',
      app: 'android.debug',
      artifacts: {
        rootDir: './e2e/artifacts/android',
      },
    },
    'android.emu.e2e.qss': {
      device: 'emulator_qss',
      app: 'android.e2e.qss',
      artifacts: {
        rootDir: './e2e/artifacts/android',
      },
    },
    'android.emu.debug.ci': {
      device: 'emulator_ci',
      app: 'android.debug',
      artifacts: {
        rootDir: './e2e/artifacts/android',
      },
    },
    'android.emu.storybook': {
      device: 'emulator',
      app: 'android.storybook',
      artifacts: {
        rootDir: './e2e/artifacts/android',
      },
    },
    'android.emu.release': {
      device: 'emulator',
      app: 'android.release',
    },
  },
  artifacts: {
    rootDir: './e2e/artifacts',
    plugins: {
      screenshot: {
        shouldTakeAutomaticSnapshots: true,
        keepOnlyFailedTestsArtifacts: false,
        takeWhen: {
          testStart: true,
          testDone: true,
        },
      },
    },
  },
}
