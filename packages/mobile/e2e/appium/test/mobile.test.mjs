import test from 'node:test'
import assert from 'node:assert/strict'
import { validateConfig } from '../config.mjs'
import { iosCapabilities } from '../mobile.mjs'
import { Mobile } from '../mobile.mjs'

const app = process.execPath
const base = {
  platform: 'ios',
  udid: 'physical-device',
  disposable: true,
  app,
  desktopBinary: app,
  bundleId: 'com.quietmobile',
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
  assert.throws(
    () => validateConfig({ ...base, usePreinstalledWDA: 'yes', updatedWDABundleId: 'org.tryquiet.wda' }),
    /must be a boolean/
  )
  assert.equal(iosCapabilities(base)['appium:usePreinstalledWDA'], undefined)
})

test('iOS onboarding focuses the accessible wrapper and types a full invitation in one native text operation', async () => {
  const events = []
  const input = {
    async isDisplayed() {
      return true
    },
    async click() {
      events.push('focus')
    },
  }
  const mobile = new Mobile(base, { directory: process.cwd() })
  mobile.driver = {
    async waitUntil(check) {
      assert.equal(await check(), true)
    },
    async $(selector) {
      assert.equal(selector, "//*[@label='Invite link' or @name='Invite link']")
      return input
    },
    async sendKeys(value) {
      events.push(['type', value])
    },
  }

  const invitation = 'quiet://?invite=' + 'a'.repeat(1000)
  await mobile.input('Invite link', invitation)

  assert.deepEqual(events, ['focus', ['type', [invitation]]])
})

test('native onboarding input errors do not disclose entered values', async () => {
  const mobile = new Mobile(base, { directory: process.cwd() })
  mobile.driver = {
    async waitUntil(check) {
      assert.equal(await check(), true)
    },
    async $() {
      return {
        async isDisplayed() {
          return true
        },
        async click() {},
      }
    },
    async sendKeys() {
      throw new Error('driver included sensitive input')
    },
  }

  await assert.rejects(mobile.input('Invite link', 'quiet-test-invite'), error => {
    assert.equal(error.message, 'Could not fill the native onboarding field (input redacted)')
    assert.equal(error.message.includes('quiet-test-invite'), false)
    return true
  })
})

test('fresh join follows the redesigned onboarding before entering the invitation and username', async () => {
  const mobile = new Mobile(base, { directory: process.cwd() })
  const events = []
  mobile.tapId = async id => events.push(['tapId', id])
  mobile.tapText = async text => events.push(['tapText', text])
  mobile.input = async (placeholder, value) => events.push(['input', placeholder, value])
  mobile.screen = async id => events.push(['screen', id])
  mobile.allowNotifications = async () => events.push(['notifications'])
  await mobile.join('test-invitation', 'test-user')
  assert.deepEqual(events, [
    ['tapId', 'get-started-join'],
    ['tapId', 'join-with-invite-link'],
    ['tapId', 'paste-a-link'],
    ['input', 'Link', 'test-invitation'],
    ['tapText', 'Continue'],
    ['screen', 'username-registration-component'],
    ['input', 'Username', 'test-user'],
    ['tapText', 'Continue'],
    ['screen', 'terms-of-service-component'],
    ['tapId', 'terms-of-service-agree'],
    ['screen', 'channels_list'],
    ['notifications'],
    ['tapId', 'channel_tile_general'],
    ['screen', 'chat_general'],
  ])
  assert.equal(mobile.onboarding, false)
})

test('iOS screens are found by wrapper existence because WebDriverAgent reports React Native wrappers as not visible', async () => {
  const mobile = new Mobile(base, { directory: process.cwd() })
  const asked = []
  mobile.driver = {
    waitUntil: async condition => assert.equal(await condition(), true),
    $: async selector => {
      asked.push(selector)
      return { isExisting: async () => true, isDisplayed: async () => false }
    },
  }
  mobile.allowNotifications = async () => {}
  await mobile.screen('get-started-component')
  assert.deepEqual(asked, ['~get-started-component'])
})

test('Android screens still have to be displayed', async () => {
  const mobile = new Mobile({ ...base, platform: 'android', bundleId: 'com.quietmobile.debug' }, { directory: process.cwd() })
  const asked = []
  mobile.driver = {
    waitUntil: async condition => assert.equal(await condition(), true),
    $: async selector => {
      asked.push(selector)
      return { isExisting: async () => true, isDisplayed: async () => true }
    },
  }
  await mobile.screen('get-started-component')
  assert.equal(asked.length, 1)
})

test('a remote Appium host and its device-side app path are validated', () => {
  assert.doesNotThrow(() => validateConfig({ ...base, appiumHost: '127.0.0.1', deviceApp: '/Users/ci/Quiet.app' }))
  assert.throws(() => validateConfig({ ...base, appiumHost: 'bad host' }), /appiumHost/)
  assert.throws(() => validateConfig({ ...base, deviceApp: 'Quiet.app' }), /deviceApp/)
})
