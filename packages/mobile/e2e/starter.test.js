/* eslint-disable no-undef */
describe('User', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true, launchArgs: { detoxDebugVisibility: 'YES' } })
  })

  // beforeEach(async () => {
  //   await device.reloadReactNative()
  // })

  test('should see join community screen', async () => {
    await waitFor(element(by.text('Join community')))
      .toBeVisible()
      .withTimeout(20000)
  })

  test('switches to create community screen', async () => {
    await element(by.text('create a new community')).longPress()

    await waitFor(element(by.text('Create a community')))
      .toBeVisible()
      .withTimeout(5000)
  })

  test('enters community name', async () => {
    await element(by.id('input')).longPress()
    await element(by.id('input')).typeText('rockets')

    await device.pressBack()

    await element(by.id('button')).longPress() // Idle (important though)
    await element(by.text('Continue')).longPress()

    await waitFor(element(by.text('Register a username')))
      .toBeVisible()
      .withTimeout(5000)
  })

  test('enters username', async () => {
    await element(by.id('input')).longPress()
    await element(by.id('input')).typeText('rick')

    await element(by.id('button')).longPress() // Idle (important though)
    await element(by.text('Continue')).longPress()

    await waitFor(element(by.text('You created a username')))
      .toBeVisible()
      .withTimeout(10000)

    await element(by.id('button')).longPress()
  })

  test('sees channels list', async () => {
    await waitFor(element(by.id('channels_list')))
      .toBeVisible()
      .withTimeout(5000)
  })

  test('enters #general channel', async () => {
    await element(by.text('#general')).longPress()

    await waitFor(element(by.id('chat_general')))
      .toBeVisible()
      .withTimeout(5000)
  })

  test('sends message to #general channel', async () => {
    await element(by.id('input')).longPress()
    await element(by.id('input')).typeText("We're no strangers to love")

    await element(by.id('send_message_button')).longPress() // Idle (important though)
    await element(by.id('send_message_button')).longPress()

    await waitFor(element(by.id("We're no strangers to love")))
      .toBeVisible()
      .withTimeout(5000)

    await device.pressBack()
  })

  test('navigates back to channels list', async () => {
    await element(by.id('appbar_action_item')).longPress()

    await waitFor(element(by.id('channels_list')))
      .toBeVisible()
      .withTimeout(5000)
  })

  test('opens context menu', async () => {
    await element(by.id('open_menu')).longPress()

    await waitFor(element(by.id('context_menu_Rockets')))
      .toBeVisible()
      .withTimeout(5000)
  })

  test('leaves community', async () => {
    await element(by.id('Leave community')).longPress()

    await waitFor(element(by.text('Are you sure you want to leave?')))
      .toBeVisible()
      .withTimeout(5000)

    await element(by.text('Leave community')).atIndex(1).longPress()

    await waitFor(element(by.text('Join community')))
      .toBeVisible()
      .withTimeout(10000)
  })
})
