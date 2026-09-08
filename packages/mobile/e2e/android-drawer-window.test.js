const assert = require('node:assert/strict')
const describeAndroid = device.getPlatform() === 'android' ? describe : describe.skip

const expectDrawerFits = async () => {
  const viewport = await element(by.id('android-drawer-viewport')).getAttributes()
  const drawer = await element(by.id('android-window-drawer')).getAttributes()
  assert(drawer.height > 0, 'The drawer must have a positive height')
  assert(drawer.height <= viewport.height, 'The drawer must fit the available parent window')
  await expect(element(by.id('android-window-drawer'))).toBeVisible(100)
  await expect(element(by.id('android-window-drawer-close'))).toBeVisible(100)
  await expect(element(by.id('android-drawer-content-top'))).toBeVisible(100)
  await expect(element(by.id('android-drawer-content-bottom'))).toBeVisible(100)
  return viewport
}

describeAndroid('Android drawer window compatibility', () => {
  it('keeps drawer content and close control visible when its parent shrinks and the activity rotates', async () => {
    await device.launchApp({ newInstance: true })
    await device.setOrientation('portrait')
    await waitFor(element(by.id('BottomMenu.Sidebar'))).toBeVisible().withTimeout(120000)
    await element(by.id('BottomMenu.Sidebar')).tap()
    await waitFor(element(by.id('Storybook.ListView.SearchBar'))).toBeVisible().withTimeout(10000)
    await element(by.id('Storybook.ListView.SearchBar')).replaceText('AndroidCompatibility')
    await element(by.text('DrawerWindow')).tap()
    await element(by.id('BottomMenu.Canvas')).tap()

    await element(by.id('android-drawer-open')).tap()
    const expanded = await expectDrawerFits()
    await element(by.id('android-drawer-resize')).tap()
    const compact = await expectDrawerFits()
    assert(compact.height < expanded.height, 'The available parent window must actually shrink')
    await device.takeScreenshot('android-drawer-compact-portrait')

    try {
      await device.setOrientation('landscape')
      const landscape = await expectDrawerFits()
      assert(landscape.width > compact.width, 'The activity must actually rotate into a wider window')
      await device.takeScreenshot('android-drawer-compact-landscape')

      await element(by.id('android-window-drawer-close')).tap()
      await waitFor(element(by.id('android-window-drawer'))).not.toExist().withTimeout(10000)
      await element(by.id('android-drawer-open')).tap()
      await expectDrawerFits()
    } finally {
      await device.setOrientation('portrait')
    }
  })
})
