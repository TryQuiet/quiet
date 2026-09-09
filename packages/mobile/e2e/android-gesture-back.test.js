// Requires an Android emulator using gesture navigation. These are real edge
// touch gestures handled by SystemUI, not injected KEYCODE_BACK events.
const assert = require('node:assert/strict')
const { execFile } = require('node:child_process')
const path = require('node:path')
const { promisify } = require('node:util')

const execFileAsync = promisify(execFile)
const describeAndroid = device.getPlatform() === 'android' ? describe : describe.skip
const channelState = () => element(by.id('android-compatibility-channel-state'))
const previewTitle = () => element(by.text('#Android compatibility preview'))

const shell = async (...args) => {
  const adb = path.join(process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT, 'platform-tools', 'adb')
  return (await execFileAsync(adb, ['-s', device.id, 'shell', ...args], { timeout: 15000 })).stdout.trim()
}

const waitForKeyboard = async visible => {
  const deadline = Date.now() + 10000
  do {
    const dump = await shell('dumpsys', 'input_method')
    if (dump.match(/mDecorViewVisible=(true|false)/)?.[1] === String(visible)) return
    await new Promise(resolve => setTimeout(resolve, 250))
  } while (Date.now() < deadline)
  throw new Error(`Android's keyboard did not become ${visible ? 'visible' : 'hidden'}`)
}

const swipeBackFromEdge = async (anchor = element(by.id('chat_general'))) => {
  const ui = device.getUiDevice()
  // Detox permits only one in-flight interaction, including these read calls.
  const width = await ui.getDisplayWidth()
  const height = await ui.getDisplayHeight()
  const content = await anchor.getAttributes()
  const y = Math.round(content.frame.y + content.frame.height / 2)
  assert(y > 0 && y < height, 'The gesture must cross visible content inside the physical display')
  // Start at the physical left edge and travel well beyond Android's Back
  // activation distance. UIAutomator injects a continuous touch path in pixels.
  const completed = await ui.swipe(1, y, Math.round(width * 0.4), y, 30)
  assert.equal(completed, true, 'UIAutomator must inject the complete edge gesture')
}

describeAndroid('Android system Back gestures', () => {
  it('dismisses the keyboard, leaves the channel, and closes its image modal through edge gestures', async () => {
    assert.equal(await shell('settings', 'get', 'secure', 'navigation_mode'), '2', 'Use an emulator with gesture navigation')
    await device.launchApp({ newInstance: true })
    await device.setOrientation('portrait')
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
    await element(by.id('input')).tap()
    await element(by.id('input')).replaceText('Keep this draft after an edge gesture')
    await waitForKeyboard(true)

    await swipeBackFromEdge()
    await waitForKeyboard(false)
    await expect(element(by.id('chat_general'))).toBeVisible()
    await expect(channelState()).toHaveText('general')
    await expect(element(by.id('input'))).toHaveText('Keep this draft after an edge gesture')

    await swipeBackFromEdge()
    await waitFor(element(by.id('channels_list'))).toBeVisible().withTimeout(10000)
    await expect(channelState()).toHaveText('(none)')

    await element(by.id('channel_tile_general')).tap()
    await waitFor(element(by.id('chat_general'))).toBeVisible().withTimeout(10000)
    await waitFor(element(by.id('android-compatibility-image-state'))).toHaveText('ready').withTimeout(10000)
    await element(by.id('android-compatibility-open-preview')).tap()
    await waitFor(previewTitle()).toBeVisible().withTimeout(10000)
    await swipeBackFromEdge(element(by.id('image-preview-image')))
    await waitFor(previewTitle()).not.toBeVisible().withTimeout(10000)
    await expect(element(by.id('android-compatibility-preview-state'))).toHaveText('closed')
    await expect(element(by.id('chat_general'))).toBeVisible()
    await expect(channelState()).toHaveText('general')
  })
})
