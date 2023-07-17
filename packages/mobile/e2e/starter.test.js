import press from './utils/press'
import write from './utils/write'
import info from './utils/info'
import checkVisualRegression from './utils/checkVisualRegression'
import baseScreenshotsUpdate from './utils/baseScreenshotsUpdate'

const { ios } = info

/* eslint-disable no-undef */
describe('User', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true, launchArgs: { detoxDebugVisibility: 'YES' } })
  })

  afterAll(async () => {
    // Base screenshots will only be updated, if run with -base-update flag
    await baseScreenshotsUpdate()
  })

  test('should see join community screen', async () => {
    await waitFor(element(by.text('Join community')))
      .toBeVisible()
      .withTimeout(20000)

    const componentName = 'join-community-component'
    await checkVisualRegression(componentName)
  })

  test('switches to create community screen', async () => {
    await press(element(by.text('create a new community')))

    await waitFor(element(by.text('Create a community')))
      .toBeVisible()
      .withTimeout(5000)

    const componentName = 'create-community-component'
    await checkVisualRegression(componentName)
  })

  test('enters community name', async () => {
    await write(element(by.id('input')), 'rockets')

    if (!ios) await device.pressBack()

    await press(element(by.text('Continue')), true)

    await waitFor(element(by.text('Register a username')))
      .toBeVisible()
      .withTimeout(5000)
  })

  test('enters username', async () => {
    const componentName = 'username-registration-component'
    await checkVisualRegression(componentName)

    await write(element(by.id('input')), 'rick')

    await press(element(by.text('Continue')), true)
  })

  test('should see connection process screen', async () => {
    await waitFor(element(by.id('connection-process-title')))
      .toBeVisible()
      .withTimeout(20000)
  })

  test('sees channels list', async () => {
    await waitFor(element(by.id('channels_list')))
      .toBeVisible()
      .withTimeout(20000)
  })

  test('minimizes and restores the app', async () => {
    await device.sendToHome()

    await new Promise((resolve) => {
      setTimeout(() => { resolve() }, 3000)
    })

    await device.launchApp({ newInstance: false })

    await waitFor(element(by.text('Starting Quiet')))
      .toBeVisible()
      .withTimeout(5000)

    // User comes back to channel list
    await waitFor(element(by.id('channels_list')))
      .toBeVisible()
      .withTimeout(15000)
  })

  test('enters #general channel', async () => {
    await press(element(by.text('#general')))

    await waitFor(element(by.id('chat_general')))
      .toBeVisible()
      .withTimeout(5000)
  })

  test('sends message to #general channel', async () => {
    await press(element(by.id('input')))
    await write(element(by.id('input')), "We're no strangers to love")

    await press(element(by.id('send_message_button')), true)

    await waitFor(element(by.id("We're no strangers to love")))
      .toBeVisible()
      .withTimeout(5000)

    if (!ios) await device.pressBack()
  })

  test('navigates back to channels list', async () => {
    await press(element(by.id('appbar_action_item')))

    await waitFor(element(by.id('channels_list')))
      .toBeVisible()
      .withTimeout(5000)
  })

  test('opens context menu', async () => {
    await press(element(by.id('open_menu')))

    await waitFor(element(by.id('context_menu_Rockets')))
      .toBeVisible()
      .withTimeout(5000)

    const componentName = 'context_menu_Rockets'
    await checkVisualRegression(componentName)
  })

  test('creates new channel', async () => {
    await press(element(by.id('Create channel')))

    const componentName = 'create-channel-component'
    await checkVisualRegression(componentName)

    await press(element(by.id('input')))
    await write(element(by.id('input')), 'roll')

    await press(element(by.text('Continue')), true)

    await waitFor(element(by.id('chat_roll')))
      .toBeVisible()
      .withTimeout(5000)
  })

  test('deletes channel', async () => {
    await press(element(by.id('open_menu')))

    await press(element(by.id('Delete channel')))

    await waitFor(element(by.text('Are you sure?')))
      .toBeVisible()
      .withTimeout(5000)

    const componentName = 'delete-channel-component'
    await checkVisualRegression(componentName)

    await press(element(by.text('Delete channel')).atIndex(1))

    await waitFor(element(by.id('channels_list')))
      .toBeVisible()
      .withTimeout(5000)
  })

  test('sees channel deletion information in #general channel', async () => {
    await press(element(by.text('#general')))

    await waitFor(element(by.text('@rick deleted #roll')))
      .toBeVisible()
      .withTimeout(5000)
  })

  test('deletes #general channel', async () => {
    await press(element(by.id('open_menu')))

    await press(element(by.id('Delete channel')))

    await waitFor(element(by.text('Are you sure?')))
      .toBeVisible()
      .withTimeout(5000)

    await press(element(by.text('Delete channel')).atIndex(1))

    await waitFor(element(by.id('channels_list')))
      .toBeVisible()
      .withTimeout(5000)
  })

  test('sees channel recreation information in #general channel', async () => {
    await press(element(by.text('#general')))

    await waitFor(element(by.text('@rick deleted all messages in #general')))
      .toBeVisible()
      .withTimeout(5000)
  })

  test('leaves community', async () => {
    await press(element(by.id('appbar_action_item')))

    await press(element(by.id('open_menu')))

    await press(element(by.id('Leave community')))

    await waitFor(element(by.text('Are you sure you want to leave?')))
      .toBeVisible()
      .withTimeout(5000)

    const componentName = 'leave-community-component'
    await checkVisualRegression(componentName)

    await press(element(by.text('Leave community')).atIndex(1))

    await waitFor(element(by.text('Join community')))
      .toBeVisible()
      .withTimeout(10000)
  })
})
