import press from './utils/press'
import write from './utils/write'
import info from './utils/info'
import checkVisualRegression from './utils/checkVisualRegression'
import baseScreenshotsUpdate from './utils/baseScreenshotsUpdate'
import { BASIC, STARTUP } from './utils/consts/timeouts'

const { ios } = info

/* eslint-disable no-undef */

// The onboarding redesign: Get started → Join community (three-way choice) →
// Open invite link → Paste a link to Join, and Get started → Create a
// community → Choose username. One device; no community is joined here.
describe('Onboarding', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      launchArgs: { detoxDebugVisibility: 'YES' },
      ...(ios ? { permissions: { notifications: 'YES' } } : {}),
    })
  })

  afterAll(async () => {
    await baseScreenshotsUpdate()
  })

  test('starts on Get started', async () => {
    await waitFor(element(by.text('Let’s get started...')))
      .toBeVisible()
      .withTimeout(STARTUP)
    await checkVisualRegression('get-started-component')
  })

  test('Join a community offers invite link, QR code and a disabled Recover account', async () => {
    await press(element(by.id('get-started-join')))
    await waitFor(element(by.text('Join community')))
      .toBeVisible()
      .withTimeout(BASIC)
    await expect(element(by.id('join-with-invite-link'))).toBeVisible()
    await expect(element(by.id('join-with-qr-code'))).toBeVisible()
    await expect(element(by.id('recover-account'))).toBeVisible()
    await checkVisualRegression('join-community-options-component')
  })

  test('Join with invite link explains, then offers Paste a link', async () => {
    await press(element(by.id('join-with-invite-link')))
    await waitFor(
      element(
        by.text('Open an invite link from a community admin. (If you just installed Quiet, open the invite again!)')
      )
    )
      .toBeVisible()
      .withTimeout(BASIC)
    await checkVisualRegression('open-invite-link-component')
    await press(element(by.id('paste-a-link')))
    await waitFor(element(by.text('Paste a link to Join')))
      .toBeVisible()
      .withTimeout(BASIC)
    await checkVisualRegression('join-community-component')
  })

  test('rejects a link that is not an invitation', async () => {
    await write(element(by.id('input')), 'not-a-link')
    if (!ios) await device.pressBack()
    await press(element(by.id('paste-link-continue')))
    await waitFor(element(by.text('Please check your invitation code and try again')))
      .toBeVisible()
      .withTimeout(BASIC)
  })

  test('back returns through the flow to Get started', async () => {
    await press(element(by.id('appbar_action_item')))
    await waitFor(element(by.text('Paste a link')))
      .toBeVisible()
      .withTimeout(BASIC)
    await press(element(by.id('appbar_action_item')))
    await waitFor(element(by.text('Join community')))
      .toBeVisible()
      .withTimeout(BASIC)
    await press(element(by.id('appbar_action_item')))
    await waitFor(element(by.text('Let’s get started...')))
      .toBeVisible()
      .withTimeout(BASIC)
  })

  test('Link devices lists no linked devices and offers Scan QR code', async () => {
    await press(element(by.id('get-started-link-devices')))
    await waitFor(element(by.text('No linked devices')))
      .toBeVisible()
      .withTimeout(BASIC)
    await expect(element(by.id('link-devices-scan-qr'))).toBeVisible()
    await checkVisualRegression('link-devices-component')
    await press(element(by.id('appbar_action_item')))
    await waitFor(element(by.text('Let’s get started...')))
      .toBeVisible()
      .withTimeout(BASIC)
  })

  test('Create a new community leads to Choose username', async () => {
    await press(element(by.id('get-started-create')))
    await waitFor(element(by.text('Create a community')))
      .toBeVisible()
      .withTimeout(BASIC)
    await checkVisualRegression('create-community-component')
    await write(element(by.id('input')), 'onboarding')
    if (!ios) await device.pressBack()
    await press(element(by.id('create-community-continue')))
    // Staging offers a server; the e2e build proceeds straight to registration.
    const registrationStep = element(by.text(/^(Not now|Choose username)$/))
    await waitFor(registrationStep).toBeVisible().withTimeout(30000)
    const step = await registrationStep.getAttributes()
    if (step.text === 'Not now' || step.label === 'Not now') {
      await press(element(by.text('Not now')))
    }
    await waitFor(element(by.text('Choose username')))
      .toBeVisible()
      .withTimeout(BASIC)
    await expect(element(by.text('Enter a username'))).toBeVisible()
    await checkVisualRegression('username-registration-component')
  })
})
