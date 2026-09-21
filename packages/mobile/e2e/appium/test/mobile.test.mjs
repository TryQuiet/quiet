import test from 'node:test'
import assert from 'node:assert/strict'
import { validateConfig } from '../config.mjs'
import { iosCapabilities } from '../mobile.mjs'

const app = process.execPath
const base = {
  platform: 'ios', udid: 'physical-device', disposable: true,
  app, desktopBinary: app, bundleId: 'com.quietmobile',
}

test('physical iOS runs can reuse an explicitly selected signed WebDriverAgent', () => {
  const config = validateConfig({
    ...base,
    platformVersion: '18.5',
    wdaLocalPort: 8125,
    updatedWDABundleId: 'org.tryquiet.existing-wda',
    usePreinstalledWDA: true,
  })
  assert.deepEqual(iosCapabilities(config), {
    'appium:bundleId': 'com.quietmobile',
    'appium:wdaLocalPort': 8125,
    'appium:platformVersion': '18.5',
    'appium:updatedWDABundleId': 'org.tryquiet.existing-wda',
    'appium:usePreinstalledWDA': true,
  })
})

test('preinstalled WebDriverAgent selection is explicit and requires its bundle ID', () => {
  assert.throws(() => validateConfig({ ...base, usePreinstalledWDA: true }), /installed bundle ID/)
  assert.throws(() => validateConfig({ ...base, usePreinstalledWDA: 'yes', updatedWDABundleId: 'org.tryquiet.wda' }), /must be a boolean/)
  assert.equal(iosCapabilities(base)['appium:usePreinstalledWDA'], undefined)
})
