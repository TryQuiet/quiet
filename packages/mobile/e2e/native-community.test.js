// Run against a standard app on an owned simulator/emulator. This deliberately
// clears its app data and uses the production backend with Detox synchronization.
/* global device, element, by, waitFor */
describe('Native community persistence', () => {
  const message = 'Quiet native runtime validation message'

  beforeAll(async () => {
    await device.launchApp({
      delete: true,
      newInstance: true,
      ...(device.getPlatform() === 'ios' ? { permissions: { notifications: 'YES' } } : {}),
    })
    await device.setOrientation('portrait')
  })

  afterAll(async () => {
    await device.terminateApp()
  })

  it('creates a community, sends with the keyboard open, and restores the message after a process restart', async () => {
    await waitFor(element(by.text('Join community')))
      .toBeVisible()
      .withTimeout(120000)
    await element(by.text('create a new community')).tap()
    await waitFor(element(by.id('create-community-component')))
      .toBeVisible()
      .withTimeout(10000)
    await element(by.id('input')).typeText('native-validation')
    await element(by.text('Continue')).tap()

    // Staging offers a server; the e2e build proceeds straight to registration.
    // In both cases this community is created without an external Quiet server.
    const registrationStep = element(by.text(/^(Not now|Register a username)$/))
    await waitFor(registrationStep).toBeVisible().withTimeout(30000)
    const step = await registrationStep.getAttributes()
    if (step.text === 'Not now' || step.label === 'Not now') {
      await element(by.text('Not now')).tap()
    }

    await waitFor(element(by.id('username-registration-component')))
      .toBeVisible()
      .withTimeout(10000)
    await element(by.id('input')).typeText('nativeowner')
    await element(by.text('Continue')).tap()
    await waitFor(element(by.id('channels_list')))
      .toBeVisible()
      .withTimeout(120000)
    await element(by.id('channel_tile_general')).tap()
    await waitFor(element(by.id('chat_general')))
      .toExist()
      .withTimeout(10000)
    // RN 0.81's RCTTextInputComponentView replaces a recycled single-line field
    // with RCTUITextView; RCTCopyBackedTextInput does not preserve its testID.
    const composer = element(
      (device.getPlatform() === 'ios' ? by.type('RCTUITextView') : by.id('input')).withAncestor(by.id('chat_general'))
    )
    await waitFor(composer).toBeVisible().withTimeout(30000)

    await composer.tap()
    await composer.typeText(message)
    // Do not dismiss the keyboard to reach Send: that hides layout regressions.
    await expect(composer).toBeVisible()
    await expect(element(by.id('send_message_button'))).toBeVisible()
    await element(by.id('send_message_button')).tap()
    // Optimistic messages are cached in Redux too. Require the backend's stored
    // acknowledgment before restarting, so an unsent cached draft cannot pass.
    await waitFor(element(by.id(message).withAncestor(by.id('message-stored'))))
      .toBeVisible()
      .withTimeout(30000)
    await expect(composer).toHaveText('')

    // A new process must reopen the saved community instead of onboarding again.
    await device.terminateApp()
    await device.launchApp({ newInstance: true })
    await waitFor(element(by.id('channels_list')))
      .toBeVisible()
      .withTimeout(120000)
    // RCTDevLoadingView hides bundled iOS debug builds' Metro banner after 15s.
    await waitFor(element(by.text('Native-validation')))
      .toBeVisible()
      .withTimeout(20000)
    await element(by.id('channel_tile_general')).tap()
    await waitFor(element(by.id(message)))
      .toBeVisible()
      .withTimeout(30000)
  }, 360000)
})
