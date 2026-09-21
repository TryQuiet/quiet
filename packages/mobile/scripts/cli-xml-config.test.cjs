// Run from packages/mobile: node --test scripts/cli-xml-config.test.cjs
const assert = require('node:assert/strict')
const fs = require('node:fs')
const { createRequire } = require('node:module')
const path = require('node:path')
const test = require('node:test')

const projectRoot = path.resolve(__dirname, '..')
// Resolve through the CLI's declared dependencies, including nested installs.
const requireAndroidPlatform = createRequire(require.resolve('@react-native-community/cli-platform-android'))
const requireAndroidConfig = createRequire(requireAndroidPlatform.resolve('@react-native-community/cli-config-android'))
const requireIosPlatform = createRequire(require.resolve('@react-native-community/cli-platform-ios'))
const requireApplePlatform = createRequire(requireIosPlatform.resolve('@react-native-community/cli-platform-apple'))

test('Android CLI discovers the launcher activity from the application manifest', () => {
  const { default: getMainActivity } = requireAndroidConfig('./config/getMainActivity')
  assert.equal(getMainActivity(path.join(projectRoot, 'android/app/src/main/AndroidManifest.xml')), '.MainActivity')
})

test('Apple CLI reads the launch configuration from the shared Quiet scheme', () => {
  const { getBuildConfigurationFromXcScheme } = requireApplePlatform('./tools/getBuildConfigurationFromXcScheme')
  assert.equal(
    getBuildConfigurationFromXcScheme('Quiet', 'Release', path.join(projectRoot, 'ios'), { schemes: ['Quiet'] }),
    'Debug'
  )
})

test('the Apple CLI XML parser preserves plist metadata and keychain entitlements', () => {
  const { XMLParser, XMLValidator } = requireApplePlatform('fast-xml-parser')
  const parser = new XMLParser({ ignoreAttributes: false })
  const readPlist = filename => {
    const xml = fs.readFileSync(path.join(projectRoot, 'ios/Quiet', filename), 'utf8')
    assert.equal(XMLValidator.validate(xml), true, filename)
    const { plist } = parser.parse(xml)
    assert.equal(plist['@_version'], '1.0')
    return plist.dict
  }

  const info = readPlist('Info.plist')
  assert.ok(info.key.includes('CFBundleIdentifier'))
  assert.ok(info.string.includes('$(PRODUCT_BUNDLE_IDENTIFIER)'))
  const urlTypes = info.array.find(value => value.dict?.key.includes('CFBundleURLSchemes'))
  assert.equal(urlTypes.dict.array.string, 'quiet')

  for (const filename of ['Quiet.entitlements', 'QuietDebug.entitlements']) {
    const entitlements = readPlist(filename)
    assert.ok(entitlements.key.includes('keychain-access-groups'))
    assert.ok(entitlements.array.some(value => value.string === '$(AppIdentifierPrefix)com.quietmobile'))
  }
})
