import compare from './utils/compare'

/* eslint-disable no-undef */
describe('User', () => {
  const ios = device.getPlatform() === 'ios'

  const press = async (element, double = false) => {
    if (ios) {
      await element.tap()
    } else {
      if (double) element.longPress() // Idle
      await element.longPress()
    }
  }

  const type = async (element, text) => {
    if (ios) {
      await element.typeText(text)
    } else {
      await element.longPress()
      await element.typeText(text)
    }
  }

  const enableVisualRegression = Boolean(process.argv.filter(x => x.startsWith('-enable-visual-regression'))[0])
  const ci = Boolean(process.argv.filter(x => x.startsWith('-ci'))[0])

  const checkVisualRegression = async componentName => {
    if (!enableVisualRegression) return
    const imagePath = await element(by.id(componentName)).takeScreenshot(`${componentName}`)

    const platform = device.getPlatform()
    const environment = ci ? 'ci' : 'local'

    let basePath = `${__dirname}/visual-regressions/${environment}/${platform}/starter-base-screenshots/${componentName}.png`

    await compare(imagePath, basePath)
  }

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
    await type(element(by.id('input')), 'rockets')

    if (!ios) await device.pressBack()

    await press(element(by.text('Continue')), true)

    await waitFor(element(by.text('Register a username')))
      .toBeVisible()
      .withTimeout(5000)
  })

  test('enters username', async () => {
    const componentName = 'username-registration-component'
    await checkVisualRegression(componentName)

    await type(element(by.id('input')), 'rick')

    await press(element(by.text('Continue')), true)

    await waitFor(element(by.text('You created a username')))
      .toBeVisible()
      .withTimeout(10000)

    await press(element(by.id('button')))
  })

  test('sees channels list', async () => {
    await waitFor(element(by.id('channels_list')))
      .toBeVisible()
      .withTimeout(20000)
  })

  test('enters #general channel', async () => {
    await press(element(by.text('#general')))

    await waitFor(element(by.id('chat_general')))
      .toBeVisible()
      .withTimeout(5000)
  })

  test('sends message to #general channel', async () => {
    await press(element(by.id('input')))
    await type(element(by.id('input')), "We're no strangers to love")

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
    await type(element(by.id('input')), 'roll')

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
