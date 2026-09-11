// Run with the existing android.att.storybook configuration on API 35 and 36.
// This covers Android dispatch into production UI components without a backend.
/* global device, element, by, waitFor */
const assert = require('node:assert/strict')
const describeAndroid = device.getPlatform() === 'android' ? describe : describe.skip

const channelState = () => element(by.id('android-compatibility-channel-state'))
const previewState = () => element(by.id('android-compatibility-preview-state'))
const previewTitle = () => element(by.text('#Android compatibility preview'))

const openChannel = async () => {
  await element(by.id('channel_tile_general')).tap()
  await waitFor(element(by.id('chat_general')))
    .toBeVisible()
    .withTimeout(10000)
  await expect(channelState()).toHaveText('general')
}

describeAndroid('Android SDK compatibility', () => {
  beforeEach(async () => {
    // Relaunch so a failed modal/Back assertion cannot hide the next test's
    // reset button or leave the next scenario in an unexpected native window.
    await device.launchApp({ newInstance: true })
    await device.setOrientation('portrait')
    await waitFor(element(by.id('BottomMenu.Sidebar')))
      .toBeVisible()
      .withTimeout(120000)
    await element(by.id('BottomMenu.Sidebar')).tap()
    await waitFor(element(by.id('Storybook.ListView.SearchBar')))
      .toBeVisible()
      .withTimeout(10000)
    await element(by.id('Storybook.ListView.SearchBar')).replaceText('AndroidCompatibility')
    await element(by.text('SystemBack')).tap()
    await element(by.id('BottomMenu.Canvas')).tap()
    await waitFor(element(by.id('android-compatibility-reset')))
      .toBeVisible()
      .withTimeout(10000)
    await element(by.id('android-compatibility-reset')).tap()
    await waitFor(element(by.id('channels_list')))
      .toBeVisible()
      .withTimeout(10000)
    await expect(channelState()).toHaveText('(none)')
    await expect(previewState()).toHaveText('closed')
  })

  it('dismisses the keyboard before leaving the channel and clears the selected channel on Back', async () => {
    await openChannel()
    await element(by.id('input')).tap()
    await element(by.id('input')).replaceText('Android compatibility draft')
    await expect(element(by.id('input'))).toBeVisible(100)
    await expect(element(by.id('send_message_button'))).toBeVisible(100)

    // Send a real Android Back event, not an appbar tap or direct JS callback.
    await device.pressBack()
    await expect(element(by.id('chat_general'))).toBeVisible()
    await expect(element(by.id('input'))).toHaveText('Android compatibility draft')
    await expect(channelState()).toHaveText('general')

    await device.pressBack()
    await waitFor(element(by.id('channels_list')))
      .toBeVisible()
      .withTimeout(10000)
    // A native-stack pop alone is insufficient: ChannelScreen must also clear
    // Redux's current channel so unread-message handling works after leaving.
    await expect(channelState()).toHaveText('(none)')
    await expect(element(by.id('chat_general'))).not.toBeVisible()
  })

  it('closes the native image preview on Back without leaving its channel', async () => {
    await openChannel()
    await waitFor(element(by.id('android-compatibility-image-state')))
      .toHaveText('ready')
      .withTimeout(10000)
    await element(by.id('android-compatibility-open-preview')).tap()
    await waitFor(previewTitle()).toBeVisible().withTimeout(10000)
    await expect(element(by.id('image-preview-image'))).toBeVisible(100)
    await device.takeScreenshot('android-compatibility-image-preview')

    await device.pressBack()
    await waitFor(previewTitle()).not.toBeVisible().withTimeout(10000)
    await expect(previewState()).toHaveText('closed')
    await expect(element(by.id('chat_general'))).toBeVisible()
    await expect(channelState()).toHaveText('general')
  })

  it('keeps the channel and modal usable after rotation', async () => {
    await openChannel()
    await element(by.id('input')).tap()
    await element(by.id('input')).replaceText('Keep this draft after rotation')
    await device.pressBack()
    const portrait = await element(by.id('chat_general')).getAttributes()
    try {
      await device.setOrientation('landscape')
      await waitFor(element(by.id('chat_general')))
        .toBeVisible()
        .withTimeout(10000)
      const landscape = await element(by.id('chat_general')).getAttributes()
      assert(landscape.width > portrait.width, 'The channel must actually rotate into a wider window')
      assert(landscape.width > landscape.height, 'The channel must have landscape dimensions')
      await expect(element(by.id('input'))).toBeVisible(100)
      await expect(element(by.id('input'))).toHaveText('Keep this draft after rotation')
      await expect(channelState()).toHaveText('general')
      await device.takeScreenshot('android-compatibility-channel-landscape')

      await waitFor(element(by.id('android-compatibility-image-state')))
        .toHaveText('ready')
        .withTimeout(10000)
      await element(by.id('android-compatibility-open-preview')).tap()
      await waitFor(previewTitle()).toBeVisible().withTimeout(10000)
      // The old width/aspect-ratio layout extends below the landscape window.
      // Requiring the entire native image view to be visible catches clipping.
      await expect(element(by.id('image-preview-image'))).toBeVisible(100)
      await device.takeScreenshot('android-compatibility-preview-landscape')
      await device.pressBack()
      await expect(previewState()).toHaveText('closed')
      await expect(channelState()).toHaveText('general')
      await expect(element(by.id('input'))).toHaveText('Keep this draft after rotation')
    } finally {
      await device.setOrientation('portrait')
    }
  })

  it('preserves keyboard edits through rotation and restores the portrait composer', async () => {
    await openChannel()
    let draft = ''
    try {
      for (const orientation of ['portrait', 'landscape', 'portrait']) {
        await device.setOrientation(orientation)
        await waitFor(element(by.id('chat_general')))
          .toBeVisible()
          .withTimeout(10000)
        await expect(element(by.id('input'))).toHaveText(draft)
        await element(by.id('input')).tap()
        draft = `Keyboard-visible ${orientation} draft`
        await element(by.id('input')).replaceText(draft)
        await device.takeScreenshot(`android-composer-keyboard-${orientation}`)
        // Android may use its full-screen extract editor in landscape. The app
        // controls are intentionally covered until Back dismisses that editor.
        if (orientation === 'portrait') {
          await expect(element(by.id('input'))).toBeVisible(100)
          await expect(element(by.id('send_message_button'))).toBeVisible(100)
        }
        await expect(element(by.id('input'))).toHaveText(draft)
        await device.pressBack()
        await expect(element(by.id('input'))).toBeVisible(100)
        await expect(element(by.id('input'))).toHaveText(draft)
        await expect(channelState()).toHaveText('general')
      }
    } finally {
      await device.setOrientation('portrait')
    }
  })
})
