// Uses production ChannelScreen and the native photo picker on API 35/36.
// Requires an English-language Android emulator with the system photo picker.
const createPhotoPicker = require('./utils/androidPhotoPicker')
const describeAndroid = device.getPlatform() === 'android' ? describe : describe.skip
const draft = 'Keep this draft while choosing a photo'
const thumbnail = () => element(by.id('attachment-preview-image'))

describeAndroid('Android photo picker compatibility', () => {
  let picker

  beforeAll(async () => {
    picker = await createPhotoPicker(device)
    await picker.seed()
  })

  afterAll(async () => {
    await device.enableSynchronization()
    if (picker) await picker.cleanup()
  })

  beforeEach(async () => {
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
    await element(by.id('channel_tile_general')).tap()
    await waitFor(element(by.id('chat_general')))
      .toBeVisible()
      .withTimeout(10000)
    await element(by.id('input')).tap()
    await element(by.id('input')).replaceText(draft)
    await device.pressBack()
    await expect(thumbnail()).not.toExist()
  })

  const assertDraft = async () => {
    await expect(element(by.id('android-compatibility-channel-state'))).toHaveText('general')
    await expect(element(by.id('input'))).toHaveText(draft)
  }

  const openPicker = async () => {
    await device.disableSynchronization()
    await picker.openFromChannel()
    await picker.waitUntilOpen()
  }

  it('cancels the native photo picker without leaving the channel or changing the draft', async () => {
    try {
      await openPicker()
      await device.pressBack()
    } finally {
      await device.enableSynchronization()
    }
    await assertDraft()
    await expect(thumbnail()).not.toExist()
  })

  it('selects a real local photo, displays its cached thumbnail, and removes it without losing the draft', async () => {
    let verifyCopy
    try {
      await openPicker()
      verifyCopy = await picker.selectFixture()
    } finally {
      await device.enableSynchronization()
    }
    await waitFor(thumbnail()).toBeVisible().withTimeout(10000)
    await verifyCopy(await thumbnail().getAttributes())
    await assertDraft()
    await device.takeScreenshot('android-native-photo-selected')
    await element(by.label('Remove image attachment')).tap()
    await expect(thumbnail()).not.toExist()
    await assertDraft()
  })
})
