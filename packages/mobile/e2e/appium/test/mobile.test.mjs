import test from 'node:test'
import assert from 'node:assert/strict'
import { validateConfig } from '../config.mjs'
import { iosCapabilities } from '../mobile.mjs'
import { Mobile } from '../mobile.mjs'

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

test('physical iOS onboarding focuses the accessible wrapper before typing', async () => {
  const events = []
  const input = {
    async isDisplayed() { return true },
    async click() { events.push('focus') },
  }
  const mobile = new Mobile(base, { directory: process.cwd() })
  mobile.driver = {
    async waitUntil(check) { assert.equal(await check(), true) },
    async $(selector) {
      assert.equal(selector, "//*[@label='Invite link' or @name='Invite link']")
      return input
    },
    async execute(command, value) { events.push(['type', command, value]) },
  }

  await mobile.input('Invite link', 'quiet-test-invite')

  assert.deepEqual(events, ['focus', ['type', 'mobile: keys', { keys: [...'quiet-test-invite'] }]])
})

test('native onboarding input errors do not disclose entered values', async () => {
  const mobile = new Mobile(base, { directory: process.cwd() })
  mobile.driver = {
    async waitUntil(check) { assert.equal(await check(), true) },
    async $() { return { async isDisplayed() { return true }, async click() {} } },
    async execute() { throw new Error('driver included sensitive input') },
  }

  await assert.rejects(mobile.input('Invite link', 'quiet-test-invite'), error => {
    assert.equal(error.message, 'Could not fill the native onboarding field (input redacted)')
    assert.equal(error.message.includes('quiet-test-invite'), false)
    return true
  })
})
