const fs = require('node:fs')
const path = require('node:path')
const { execFileSync } = require('node:child_process')
const { createHash } = require('node:crypto')
const { ENDPOINT } = require('./qssCommunity.cjs')

const ANDROID_APP_ID = 'com.quietmobile.debug'
const requiredAssets = [
  'assets/index.android.bundle',
  'assets/nodejs-project/bundle.cjs',
  'lib/arm64-v8a/libnode.so',
  'lib/arm64-v8a/libtor.so',
]

function androidSdkTool(tool, env = process.env) {
  const sdk = env.ANDROID_HOME || env.ANDROID_SDK_ROOT
  if (!sdk) throw new Error('Set ANDROID_HOME or ANDROID_SDK_ROOT to the Android SDK')
  if (tool === 'adb') return path.join(sdk, 'platform-tools', tool)
  if (tool === 'aapt2' && env.QUIET_ANDROID_AAPT2) return env.QUIET_ANDROID_AAPT2
  const builds = path.join(sdk, 'build-tools')
  const version = fs
    .readdirSync(builds)
    .filter(name => /^\d+\.\d+\.\d+$/.test(name))
    .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))
    .find(name => fs.existsSync(path.join(builds, name, tool)))
  if (!version) throw new Error(`Install Android SDK build-tools containing ${tool}`)
  return path.join(builds, version, tool)
}

function validateAndroidApkMetadata({ badging, resources, instrumentation, entries }) {
  if (!badging.startsWith(`package: name='${ANDROID_APP_ID}' `) || !badging.includes('application-debuggable')) {
    throw new Error('Require the standard debug Quiet APK, not Storybook or a release app')
  }
  // react-native-config generates these resources and BuildConfig fields from
  // the same env input. Inspect the packaged values, not a stale .env file.
  for (const [key, value] of Object.entries({
    QSS_ENDPOINT: ENDPOINT,
    QSS_ALLOWED: 'true',
    SHOULD_RUN_BACKEND_WORKER: 'true',
    NODE_ENV: 'development',
  })) {
    const block = resources.match(new RegExp(`resource 0x[0-9a-f]+ string/${key}\\n([\\s\\S]*?)(?=    resource |$)`))
    if (!block || block[1].trim() !== `() "${value}"`) {
      throw new Error(`Built Android QSS configuration has an unexpected ${key}`)
    }
  }
  if (
    !instrumentation.includes(`package="${ANDROID_APP_ID}.test"`) ||
    !/targetPackage\([^\n]+\)="com\.quietmobile\.debug"/.test(instrumentation) ||
    !instrumentation.includes('="androidx.test.runner.AndroidJUnitRunner"')
  ) {
    throw new Error('Require the instrumentation APK targeting this standard debug app')
  }
  const assets = new Set(entries.trim().split(/\r?\n/))
  if (requiredAssets.some(name => !assets.has(name))) {
    throw new Error('QSS APK must bundle the frontend, backend, ARM64 Node and Tor')
  }
}

function validateAndroidBuild(appConfig, env = process.env) {
  const app = path.resolve(appConfig.binaryPath)
  const testApp = path.resolve(appConfig.testBinaryPath)
  for (const filename of [app, testApp]) {
    if (!fs.statSync(filename).isFile()) throw new Error('Build both QSS Android APKs before testing')
  }
  const aapt2 = androidSdkTool('aapt2', env)
  const inspect = args => execFileSync(aapt2, args, { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 })
  validateAndroidApkMetadata({
    badging: inspect(['dump', 'badging', app]),
    resources: inspect(['dump', 'resources', app]),
    instrumentation: inspect(['dump', 'xmltree', testApp, '--file', 'AndroidManifest.xml']),
    entries: execFileSync('unzip', ['-Z1', app], { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 }),
  })
  const hash = filename => createHash('sha256').update(fs.readFileSync(filename)).digest('hex')
  return { app, testApp, appSHA256: hash(app), testAppSHA256: hash(testApp) }
}

module.exports = { ANDROID_APP_ID, androidSdkTool, validateAndroidBuild, validateAndroidApkMetadata }
