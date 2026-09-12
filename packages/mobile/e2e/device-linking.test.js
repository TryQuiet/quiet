import info from './utils/info'

const { ios } = info

/* eslint-disable no-undef */

// Device linking needs two devices: one that already has the community and
// mints a device link (Settings / community menu → Linked devices), and this
// one, which pastes it under Get started → Link devices → Scan QR code. The
// Detox harness here drives a single app instance and no second device
// (emulator or desktop) is wired into it, so the multiplayer scenario is
// described but skipped. Provide the link through DEVICE_LINK to run the
// joiner half against a device you started by hand.
const deviceLink = process.env.DEVICE_LINK
const describeIfLink = deviceLink ? describe : describe.skip

describeIfLink('Device linking (joiner half)', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      launchArgs: { detoxDebugVisibility: 'YES' },
      ...(ios ? { permissions: { notifications: 'YES' } } : {}),
    })
  })

  test('links this device from a pasted device link and lands in the community', async () => {
    await waitFor(element(by.text('Let’s get started...')))
      .toBeVisible()
      .withTimeout(120000)
    await element(by.id('get-started-link-devices')).tap()
    await waitFor(element(by.text('No linked devices')))
      .toBeVisible()
      .withTimeout(10000)
    await element(by.id('link-devices-scan-qr')).tap()
    await waitFor(element(by.text('Scan QR code')))
      .toBeVisible()
      .withTimeout(10000)
    await element(by.id('input')).typeText(deviceLink)
    if (!ios) await device.pressBack()
    await element(by.id('paste-link-continue')).tap()
    await waitFor(element(by.id('channels_list')))
      .toBeVisible()
      .withTimeout(300000)
  })
})
