const assert = require('node:assert/strict')
const { execFile } = require('node:child_process')
const path = require('node:path')
const { promisify } = require('node:util')

const execFileAsync = promisify(execFile)
const appId = 'com.quietmobile.storybook.debug'
const describeAndroid = device.getPlatform() === 'android' ? describe : describe.skip

const appPid = async () => {
  const adb = path.join(process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT, 'platform-tools', 'adb')
  const { stdout } = await execFileAsync(adb, ['-s', device.id, 'shell', 'pidof', appId], { timeout: 15000 })
  assert(/^\d+$/.test(stdout.trim()), 'Expected one running Storybook process')
  return stdout.trim()
}

const openChannelFixture = async () => {
  await waitFor(element(by.id('BottomMenu.Sidebar'))).toBeVisible().withTimeout(120000)
  await element(by.id('BottomMenu.Sidebar')).tap()
  await waitFor(element(by.id('Storybook.ListView.SearchBar'))).toBeVisible().withTimeout(10000)
  await element(by.id('Storybook.ListView.SearchBar')).replaceText('AndroidCompatibility')
  await element(by.text('SystemBack')).tap()
  await element(by.id('BottomMenu.Canvas')).tap()
  await waitFor(element(by.id('android-compatibility-reset'))).toBeVisible().withTimeout(10000)
  await element(by.id('android-compatibility-reset')).tap()
  await element(by.id('channel_tile_general')).tap()
  await waitFor(element(by.id('chat_general'))).toBeVisible().withTimeout(10000)
}

describeAndroid('Android activity recreation', () => {
  it('restores an activity with native Screens state and keeps channel navigation usable', async () => {
    await device.launchApp({ newInstance: true })
    await device.setOrientation('portrait')
    await openChannelFixture()
    const originalPid = await appPid()

    // Detox 20.51.4's invocation bridge calls a helper included only in the
    // AndroidTest APK. Activity.recreate() exercises saved fragment state;
    // rotation is insufficient because MainActivity handles configChanges.
    const response = await device.deviceDriver.invocationManager.execute({
      target: { type: 'Class', value: 'com.quietmobile.ActivityRecreationHelper' },
      method: 'recreateCurrentActivity',
      args: [],
    })
    const recreation = JSON.parse(response.result)
    assert(recreation.screenFragments > 0, 'The original activity must contain native Screens fragments')
    assert.equal(recreation.hasSavedInstanceState, true, 'Android must supply saved instance state to the new activity')
    assert.notEqual(recreation.recreatedActivity, recreation.originalActivity, 'Android must create a different activity')
    assert.equal(await appPid(), originalPid, 'Activity recreation must preserve the app process')

    // The fixture owns a component-local store, so select it again after React's
    // root remounts. Do not launchApp/reloadReactNative here: a crash must fail.
    await openChannelFixture()
    await expect(element(by.id('android-compatibility-channel-state'))).toHaveText('general')
    await element(by.id('input')).tap()
    try {
      await waitFor(element(by.id('input'))).toBeVisible(100).withTimeout(5000)
    } catch (error) {
      require('node:fs').writeFileSync('/tmp/quiet-rn-api35-recreation-hierarchy.xml', await device.generateViewHierarchyXml(true))
      console.log('recreation layout', await element(by.id('chat_general')).getAttributes(), await element(by.id('input')).getAttributes())
      throw error
    }
    await element(by.id('input')).replaceText('A draft after activity recreation')
    await device.pressBack()
    await expect(element(by.id('input'))).toHaveText('A draft after activity recreation')
    await expect(element(by.id('chat_general'))).toBeVisible()
    await device.pressBack()
    await waitFor(element(by.id('channels_list'))).toBeVisible().withTimeout(10000)
    await expect(element(by.id('android-compatibility-channel-state'))).toHaveText('(none)')
  })
})
