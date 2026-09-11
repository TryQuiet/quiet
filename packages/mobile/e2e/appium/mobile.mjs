import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { remote } from 'webdriverio'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
const exec = promisify(execFile)
export const literal = text => text.includes("'") ? `concat(${text.split("'").map(s => `'${s}'`).join(',"\'",')})` : `'${text}'`

export class Mobile {
  constructor(config, run) { this.config = config; this.run = run; this.driver = undefined }
  get android() { return this.config.platform === 'android' }
  id(value) { return this.android ? `//*[@resource-id=${literal(value)}]` : `~${value}` }
  text(value) { return this.android ? `//*[@text=${literal(value)}]` : `//*[@label=${literal(value)}]` }
  async visible(selector, timeout = 30000) {
    let element
    await this.driver.waitUntil(async () => {
      // The OS prompt may appear after the embedded backend becomes ready.
      // Poll for it while onboarding instead of assuming a fixed launch delay.
      if (this.onboarding) await this.allowNotifications()
      element = await this.driver.$(selector)
      return element.isDisplayed()
    }, { timeout, interval: 500, timeoutMsg: 'Expected native UI element did not become visible' })
    return element
  }
  async tapText(value, timeout) { await (await this.visible(this.text(value), timeout)).click() }
  async tapId(value) { await (await this.visible(this.id(value))).click() }
  async adb(...args) {
    const sdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT
    return exec(path.join(sdk, 'platform-tools/adb'), ['-P', String(this.config.adbPort || 5037), '-s', this.config.udid, ...args], { timeout: 20000, maxBuffer: 4 * 1024 * 1024 })
  }
  async start() {
    this.onboarding = true
    if (this.android) {
      await this.adb('reverse', 'tcp:3003', 'tcp:3003')
      const { stdout } = await this.adb('reverse', '--list')
      assert(stdout.includes('tcp:3003 tcp:3003'), 'The selected emulator needs the local QSS route')
    }
    this.driver = await remote({
      hostname: '127.0.0.1', port: this.config.appiumPort || 4725, logLevel: 'silent',
      connectionRetryCount: 0, connectionRetryTimeout: 180000,
      capabilities: {
        platformName: this.android ? 'Android' : 'iOS',
        'appium:automationName': this.android ? 'UiAutomator2' : 'XCUITest',
        'appium:udid': this.config.udid, 'appium:app': this.config.app,
        'appium:fullReset': true, 'appium:newCommandTimeout': 180,
        ...(this.android ? {
          'appium:appPackage': this.config.bundleId,
          'appium:appActivity': 'com.quietmobile.MainActivity',
          'appium:adbPort': this.config.adbPort || 5037,
          'appium:systemPort': this.config.systemPort || 8225,
          'appium:uiautomator2ServerInstallTimeout': 120000,
          'appium:androidInstallTimeout': 180000,
        } : {
          'appium:bundleId': this.config.bundleId,
          'appium:wdaLocalPort': this.config.wdaLocalPort || 8125,
          ...(this.config.platformVersion ? { 'appium:platformVersion': this.config.platformVersion } : {}),
          ...(this.config.xcodeOrgId ? { 'appium:xcodeOrgId': this.config.xcodeOrgId, 'appium:xcodeSigningId': 'Apple Development' } : {}),
          ...(this.config.updatedWDABundleId ? { 'appium:updatedWDABundleId': this.config.updatedWDABundleId } : {}),
        }),
      },
    })
    await this.driver.setOrientation('PORTRAIT')
    await this.allowNotifications()
    await this.visible(this.text('Join community'), 120000)
  }
  async allowNotifications() {
    if (this.android) {
      const allow = await this.driver.$('//*[@resource-id="com.android.permissioncontroller:id/permission_allow_button"]')
      if (await allow.isExisting()) {
        const message = await this.driver.$('//*[@resource-id="com.android.permissioncontroller:id/permission_message"]')
        assert(/notification/i.test(await message.getText()), 'Unexpected Android permission dialog')
        await allow.click()
      }
    } else {
      const alert = await this.driver.$('//XCUIElementTypeAlert')
      if (await alert.isExisting()) {
        const content = await alert.getText()
        assert(/notification/i.test(content), 'Unexpected OS permission dialog')
        await (await alert.$('~Allow')).click()
      }
    }
  }
  async input(placeholder, value) {
    const selector = this.android ? '//android.widget.EditText' : `//XCUIElementTypeTextField[@value=${literal(placeholder)}]`
    const input = await this.visible(selector)
    try { await input.setValue(value) } catch { throw new Error('Could not fill the native onboarding field (input redacted)') }
    if (this.android && await this.driver.isKeyboardShown()) await this.driver.back()
  }
  async join(invite, username) {
    await this.input('Invite link', invite)
    await this.tapText('Continue')
    await this.visible(this.text('Register a username'), 90000)
    await this.input('Enter a username', username)
    await this.tapText('Continue')
    await this.visible(this.id('terms-of-service-component'), 90000)
    await this.tapText('Agree & Continue')
    await this.visible(this.id('channels_list'), 120000)
    await this.allowNotifications()
    await this.tapId('channel_tile_general')
    await this.visible(this.id('chat_general'))
    this.onboarding = false
  }
  async message(text, username, channel = 'general') {
    await this.visible(this.id(`chat_${channel}`), 60000)
    const selector = this.android
      ? `//*[@resource-id=${literal(`userMessages-${username}`)}]//*[@resource-id="message-stored"]//*[@resource-id=${literal(text)}]`
      : `//*[@name=${literal(`userMessages-${username}`)}]//*[@name="message-stored"]//*[@name=${literal(text)}]`
    await this.visible(selector, 60000)
  }
  async background() {
    // Home/backgroundApp preserves push eligibility. Never force-stop here.
    if (this.android) {
      const { stdout } = await this.adb('shell', 'dumpsys', 'package', this.config.bundleId)
      assert.match(stdout, /android.permission.POST_NOTIFICATIONS: granted=true/, 'Notification permission must be granted through the OS')
      const clock = await this.adb('shell', 'date', '+%s')
      this.backgroundEpoch = Number(clock.stdout.trim())
      await this.driver.pressKeyCode(3)
    } else await this.driver.background(-1)
    await this.driver.waitUntil(async () => (await this.driver.queryAppState(this.config.bundleId)) !== 4, { timeout: 15000, timeoutMsg: 'Quiet remained in foreground' })
  }
  async openNotifications() {
    if (this.android) await this.driver.openNotifications()
    else {
      // Home screen -> Notification Center, using actual SpringBoard gestures.
      const { width, height } = await this.driver.getWindowRect()
      await this.driver.performActions([{ type: 'pointer', id: 'finger', parameters: { pointerType: 'touch' }, actions: [
        { type: 'pointerMove', duration: 0, x: Math.round(width / 2), y: 1 },
        { type: 'pointerDown', button: 0 }, { type: 'pointerMove', duration: 800, x: Math.round(width / 2), y: Math.round(height * 0.8) }, { type: 'pointerUp', button: 0 },
      ] }])
      await this.driver.releaseActions()
    }
  }
  async notificationAndTap({ text, username, channel, artifact }) {
    await this.openNotifications()
    const body = this.android ? `@${username}: ${text}` : text
    const selector = this.android
      ? `//*[@package="com.android.systemui" and @text=${literal(body)}]`
      : `//XCUIElementTypeOther[contains(@name, ${literal(body)})] | //XCUIElementTypeStaticText[@label=${literal(body)}]`
    const notification = await this.visible(selector, 120000)
    if (this.android) {
      // Match the title in the same row as this exact message, not another app.
      const row = await this.driver.$(`//*[@resource-id="com.android.systemui:id/expandableNotificationRow"][.//*[@package="com.android.systemui" and @text=${literal(body)}]]`)
      assert(await row.isExisting(), 'Expected a real System UI notification row')
      assert(await row.$(`.//*[@text=${literal(channel)}]`).isExisting(), 'Notification must display the human channel name')
      const { stdout } = await this.adb('logcat', '-d', '-v', 'epoch', '-T', `${this.backgroundEpoch}.000`, '-s', 'QssFirebaseMessaging:I')
      await fs.writeFile(path.join(this.run.directory, `${artifact}-receiver.log`), stdout, { mode: 0o600 })
      assert.match(stdout, /onMessageReceived from=/, 'Real Firebase service delivery must occur after backgrounding')
      assert(stdout.includes(`entries for teamId=${this.teamId}`), 'The native receiver must fetch this run\'s authenticated QSS team')
      assert.match(stdout, /Posting notification for cid=/, 'The production QSS push handler must authenticate and post the notification')
    } else {
      const title = `${username} in #${channel}`
      const container = await this.driver.$('//*[contains(@name, ' + literal(body) + ') and contains(@name, ' + literal(title) + ')]')
      assert(await container.isExisting(), 'The same Notification Center item must display the exact sender, channel, and body')
    }
    await this.artifacts(artifact)
    await notification.click()
    await this.driver.waitUntil(async () => (await this.driver.queryAppState(this.config.bundleId)) === 4, { timeout: 30000, timeoutMsg: 'Tapping the OS notification did not open Quiet' })
    await this.message(text, username, channel)
    await this.artifacts(`${artifact}-opened`)
    return { provider: this.android ? 'FCM' : 'FCM/APNs', osPresentation: true, tapped: true, channel, text, username,
      activationEvidence: this.android ? 'Firebase service receive and QSS handler post logs' : 'Decrypted unique peer text in OS notification; QPS provider payload contains only generic text',
    }
  }
  async artifacts(name) {
    if (!this.driver) return
    await fs.writeFile(path.join(this.run.directory, `${name}.xml`), await this.driver.getPageSource(), { mode: 0o600 })
    await fs.writeFile(path.join(this.run.directory, `${name}.png`), Buffer.from(await this.driver.takeScreenshot(), 'base64'), { mode: 0o600 })
  }
  async close() { if (this.driver) await this.driver.deleteSession() }
}
