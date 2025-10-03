import press from './utils/press'
import write from './utils/write'
import info from './utils/info'
import checkVisualRegression from './utils/checkVisualRegression'
import { BASIC, LONG, STARTUP } from './utils/consts/timeouts'
import baseScreenshotsUpdate from './utils/baseScreenshotsUpdate'

const { ios } = info

/* eslint-disable no-undef */
describe('QSS Onboarding', () => {
  describe('Add Server path shows ToS', () => {
    beforeAll(async () => {
      await device.launchApp({ newInstance: true, launchArgs: { detoxDebugVisibility: 'YES' } })
    })

    afterAll(async () => {
      // close app
      await device.terminateApp()
      await baseScreenshotsUpdate()
    })

    test('should see join community screen', async () => {
      await waitFor(element(by.text('Join community')))
        .toBeVisible()
        .withTimeout(STARTUP)
      await checkVisualRegression('join-community-component')
    })

    test('switches to create community screen', async () => {
      await press(element(by.text('create a new community')))

      await waitFor(element(by.text('Create a community')))
        .toBeVisible()
        .withTimeout(BASIC)
      await checkVisualRegression('create-community-component')
    })

    test('enters community name and continues', async () => {
      await write(element(by.id('input')), 'qss-onboarding')
      if (!ios) await device.pressBack()
      await device.disableSynchronization()
      await press(element(by.text('Continue')), true)
    })

    test('shows Server Offer and accepts it', async () => {
      await waitFor(element(by.id('server-offer-drawer')))
        .toBeVisible()
        .withTimeout(BASIC)

      // Visual checkpoint of the drawer content
      await checkVisualRegression('server-offer-component')

      await press(element(by.text('Add server')))
    })

    test('registers username and proceeds to ToS', async () => {
      await waitFor(element(by.text('Register a username')))
        .toBeVisible()
        .withTimeout(BASIC)
      await checkVisualRegression('username-registration-component')

      await write(element(by.id('input')), 'owner-qss-mobile')

      await press(element(by.text('Continue')), true)
      await device.enableSynchronization()
    })

    test('sees Terms of Use and agrees', async () => {
      await waitFor(element(by.id('terms-of-service-component')))
        .toBeVisible()
        .withTimeout(LONG)

      await press(element(by.text('Agree & Continue')))
    })

    test('lands on channels list and can open #general', async () => {
      await waitFor(element(by.id('channels_list')))
        .toBeVisible()
        .withTimeout(LONG)

      await press(element(by.text('#general')))
      await waitFor(element(by.id('chat_general')))
        .toBeVisible()
        .withTimeout(BASIC)
    })
  })

  describe('Not Now path skips ToS', () => {
    beforeAll(async () => {
      // Relaunch with delete:true to clear persisted state between flows
      await device.launchApp({ delete: true, newInstance: true, launchArgs: { detoxDebugVisibility: 'YES' } })
    })
    afterAll(async () => {
      // close app
      await device.terminateApp()
      await baseScreenshotsUpdate()
    })

    test('navigates to create and submits name', async () => {
      await waitFor(element(by.text('Join community')))
        .toBeVisible()
        .withTimeout(STARTUP)

      await press(element(by.text('create a new community')))

      await waitFor(element(by.text('Create a community')))
        .toBeVisible()
        .withTimeout(BASIC)

      await write(element(by.id('input')), 'qss-noserver')
      if (!ios) await device.pressBack()
      await device.disableSynchronization()
      await press(element(by.text('Continue')), true)
    })

    test('chooses Not now on Server Offer', async () => {
      await waitFor(element(by.id('server-offer-drawer')))
        .toBeVisible()
        .withTimeout(BASIC)

      await press(element(by.text('Not now')))
    })

    test('registers username; ToS is not shown', async () => {
      await waitFor(element(by.text('Register a username')))
        .toBeVisible()
        .withTimeout(BASIC)

      await write(element(by.id('input')), 'owner-local')
      await press(element(by.text('Continue')), true)
      await device.enableSynchronization()

      // Verify ToS does NOT appear (short timeout)
      await waitFor(element(by.id('terms-of-service-component')))
        .not.toBeVisible()
        .withTimeout(2000)
    })

    test('joins and sees general channel without ToS', async () => {
      await waitFor(element(by.id('channels_list')))
        .toBeVisible()
        .withTimeout(LONG)

      await press(element(by.text('#general')))
      await waitFor(element(by.id('chat_general')))
        .toBeVisible()
        .withTimeout(BASIC)
    })
  })
})
