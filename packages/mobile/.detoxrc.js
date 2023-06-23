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
    'ios.debug': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/Quiet.app',
      build:
        'ENVFILE=../.env.development xcodebuild -workspace ios/Quiet.xcworkspace -scheme Quiet -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build -arch x86_64',
    },
    'ios.storybook': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Release-iphonesimulator/Quiet.app',
      build:
        'ENVFILE=../.env.storybook xcodebuild -workspace ios/Quiet.xcworkspace -scheme Quiet -configuration Release -sdk iphonesimulator -derivedDataPath ios/build -arch x86_64',
    },
    'ios.release': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Release-iphonesimulator/Quiet.app',
      build:
        'ENVFILE=../.env.production xcodebuild -workspace ios/Quiet.xcworkspace -scheme Quiet -configuration Release -sdk iphonesimulator -derivedDataPath ios/build',
    },
  },
  devices: {
    simulator: {
      type: 'ios.simulator',
      device: {
        type: 'iPhone 14',
      },
    },
    attached: {
      type: 'android.attached',
      device: {
        adbName: '.*',
      },
    },
    emulator: {
      type: 'android.emulator',
      device: {
        avdName: 'emulator',
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
    'ios.sim.storybook': {
      device: 'simulator',
      app: 'ios.storybook',
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
    'android.att.debug': {
      device: 'attached',
      app: 'android.debug',
      artifacts: {
        rootDir: './e2e/artifacts/android',
        plugins: {
          instruments: 'all',
        },
      },
    },
    'android.att.storybook': {
      device: 'attached',
      app: 'android.storybook',
      artifacts: {
        rootDir: './e2e/artifacts/android',
        plugins: {
          instruments: 'all',
        },
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
        plugins: {
          instruments: 'all',
        },
      },
    },
    'android.emu.storybook': {
      device: 'emulator',
      app: 'android.storybook',
      artifacts: {
        rootDir: './e2e/artifacts/android',
        plugins: {
          instruments: 'all',
        },
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
