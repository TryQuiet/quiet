import { jest } from '@jest/globals'
import { By } from 'selenium-webdriver'

import {
  App,
  Channel,
  CreateCommunityModal,
  GetStartedModal,
  JoinCommunityModal,
  JoiningLoadingPanel,
  LinkDevicesModal,
  RegisterUsernameModal,
  Sidebar,
} from '../selectors'
import { SettingsModalTabName } from '../enums'
import { createLogger } from '../logger'
import { FAKE_CAMERA_FILE_ENV, fakeCameraFile, removeFakeCameraFile, writeQrY4m } from '../fakeCamera'

const logger = createLogger('onboarding')
const previousLocalTransport = process.env.LOCAL_TRANSPORT

jest.setTimeout(1_200_000) // 20 minutes

// Device linking dials the other device directly; the local transport keeps
// Tor out of these runs the way deviceLinking.test.ts does.
beforeAll(() => {
  process.env.LOCAL_TRANSPORT = 'true'
})

afterAll(() => {
  if (previousLocalTransport == null) {
    delete process.env.LOCAL_TRANSPORT
    return
  }
  process.env.LOCAL_TRANSPORT = previousLocalTransport
})

const timeouts = {
  joinPanelVisible: 15_000,
  joinCompletion: 60_000,
}

// Chromium plays this clip as the camera (E2E_FAKE_CAMERA_FILE); it is written once the
// link it must show exists, before that client starts.
const joinCameraClip = fakeCameraFile('join')

afterAll(() => {
  removeFakeCameraFile(joinCameraClip)
})

const NOT_A_DEVICE_LINK_ERROR = 'This is not a device link. Use the link from Link devices on your other device.'

async function closeAndCleanupApps(apps: App[]): Promise<void> {
  for (const app of [...apps].reverse()) {
    try {
      if (app.isOpened) {
        await app.close()
      }
      await app.cleanup()
    } catch (error) {
      logger.error(`Error cleaning up app ${app.name}:`, error)
    }
  }
}

/** Get started → Create a new community → Choose username → general channel. */
async function createCommunity(owner: App, communityName: string, username: string): Promise<Channel> {
  await owner.openWithRetries()

  const getStarted = new GetStartedModal(owner.driver)
  expect(await getStarted.isReady()).toBeTruthy()
  await getStarted.createCommunity()

  const createModal = new CreateCommunityModal(owner.driver)
  expect(await createModal.isReady()).toBeTruthy()
  await createModal.typeCommunityName(communityName)
  await createModal.submit()

  const registerModal = new RegisterUsernameModal(owner.driver)
  expect(await registerModal.isReady()).toBeTruthy()
  await registerModal.typeUsername(username)
  await registerModal.submit()

  await new JoiningLoadingPanel(owner.driver).waitForJoinToComplete(timeouts.joinPanelVisible, timeouts.joinCompletion)
  const channel = new Channel(owner.driver, 'general')
  expect(await channel.isReady()).toBeTruthy()
  expect(await channel.isMessageInputReady()).toBeTruthy()
  return channel
}

async function getMemberInvitation(app: App): Promise<string> {
  const settings = await new Sidebar(app.driver).openSettings()
  expect(await settings.isReady()).toBeTruthy()
  await settings.switchTab(SettingsModalTabName.INVITE)
  const link = await (await settings.invitationLink()).getText()
  expect(link.length).toBeGreaterThan(0)
  await settings.closeTabThenModal()
  return link
}

async function getDeviceInvitation(app: App): Promise<string> {
  const settings = await new Sidebar(app.driver).openSettings()
  expect(await settings.isReady()).toBeTruthy()
  await settings.switchTab(SettingsModalTabName.LINKED_DEVICES)
  const link = await settings.deviceLink()
  expect(link.length).toBeGreaterThan(0)
  await settings.closeTabThenModal()
  return link
}

/**
 * One read of the "Linked devices" list on the share direction, which is
 * Settings → Linked devices once you are in a community. Opening the tab mounts
 * the surface, which is what asks the backend, so each call is a fresh answer.
 */
async function readLinkedDevicesOnce(app: App): Promise<{ deviceId: string; deviceName: string }[]> {
  const settings = await new Sidebar(app.driver).openSettings()
  expect(await settings.isReady()).toBeTruthy()
  await settings.switchTab(SettingsModalTabName.LINKED_DEVICES)
  const devices = await new LinkDevicesModal(app.driver).linkedDevices()
  await settings.closeTabThenModal()
  return devices
}

/**
 * The list once it has at least `expectedCount` rows. The surface only asks the
 * backend when it mounts, so the retry reopens the tab rather than re-reading a
 * DOM that would never change on its own.
 */
async function linkedDevicesInSettings(
  app: App,
  expectedCount = 0,
  timeoutMs = 60_000
): Promise<{ deviceId: string; deviceName: string }[]> {
  const deadline = Date.now() + timeoutMs
  let devices = await readLinkedDevicesOnce(app)
  while (devices.length < expectedCount && Date.now() < deadline) {
    devices = await readLinkedDevicesOnce(app)
  }
  return devices
}

/** The same surface, asked whether it is drawing its "No linked devices" line. */
async function noLinkedDevicesInSettings(app: App): Promise<boolean> {
  const settings = await new Sidebar(app.driver).openSettings()
  expect(await settings.isReady()).toBeTruthy()
  await settings.switchTab(SettingsModalTabName.LINKED_DEVICES)
  const empty = await new LinkDevicesModal(app.driver).hasNoLinkedDevices()
  await settings.closeTabThenModal()
  return empty
}

describe('Onboarding', () => {
  beforeEach(() => {
    logger.info(`░░░ ${expect.getState().currentTestName}`)
  })

  it('Get started → three-way join → paste link → username', async () => {
    const owner = new App({ username: 'onboarding-join-owner' })
    const joiner = new App({ username: 'onboarding-join-member' })
    const apps = [owner, joiner]

    try {
      await createCommunity(owner, `onbjoin${Date.now().toString(36)}`, 'onboardingowner')
      const invitation = await getMemberInvitation(owner)

      await joiner.openWithRetries()

      const getStarted = new GetStartedModal(joiner.driver)
      expect(await getStarted.isReady()).toBeTruthy()
      await getStarted.joinCommunity()

      const joinModal = new JoinCommunityModal(joiner.driver)
      expect(await joinModal.isReady()).toBeTruthy()

      // Recover account → Account recovery; "Use invite link" reaches the same
      // paste step, and the back arrow retraces the trail to the three-way choice
      await joinModal.recoverAccount()
      expect(await joinModal.isRecoverMoreOptionsDisabled()).toBe(true)
      await joinModal.recoverWithInviteLink()
      await joinModal.back()
      await joinModal.waitForStep('Join with invite link')
      await joinModal.back()
      await joinModal.waitForStep('Recover account')
      await joinModal.back()
      await joinModal.waitForStep('Join community')

      // Join with invite link → Open invite link → Paste a link
      await joinModal.joinWithInviteLink()
      await joinModal.typeCommunityInviteLink(invitation)
      await joinModal.submit()

      const registerModal = new RegisterUsernameModal(joiner.driver)
      expect(await registerModal.isReady()).toBeTruthy()
      await registerModal.clearInput()
      await registerModal.typeUsername('onboardingmember')
      await registerModal.submit()

      await new JoiningLoadingPanel(joiner.driver).waitForJoinToComplete(
        timeouts.joinPanelVisible,
        timeouts.joinCompletion
      )
      const channel = new Channel(joiner.driver, 'general')
      expect(await channel.isReady()).toBeTruthy()
      await new Sidebar(owner.driver).waitForUserProfilesNum(2)
    } finally {
      await closeAndCleanupApps(apps)
    }
  })

  it('Get started → Join with QR code → scan → username', async () => {
    const owner = new App({ username: 'onboarding-scan-owner' })
    const joiner = new App({
      username: 'onboarding-scan-member',
      environment: { [FAKE_CAMERA_FILE_ENV]: joinCameraClip },
    })
    const apps = [owner, joiner]

    try {
      await createCommunity(owner, `onbscan${Date.now().toString(36)}`, 'scanowner')
      const invitation = await getMemberInvitation(owner)
      writeQrY4m(invitation, joinCameraClip)

      await joiner.openWithRetries()

      const getStarted = new GetStartedModal(joiner.driver)
      expect(await getStarted.isReady()).toBeTruthy()
      await getStarted.joinCommunity()

      const joinModal = new JoinCommunityModal(joiner.driver)
      expect(await joinModal.isReady()).toBeTruthy()
      await joinModal.joinWithQrCode()
      // The camera sheet, not a paste field
      expect(await joiner.driver.findElements(By.xpath("//*[@data-testid='paste-link-input']"))).toHaveLength(0)

      // The scanned code takes the paste field's path: Choose username
      const registerModal = new RegisterUsernameModal(joiner.driver)
      expect(await registerModal.isReady()).toBeTruthy()
      await registerModal.clearInput()
      await registerModal.typeUsername('scanmember')
      await registerModal.submit()

      await new JoiningLoadingPanel(joiner.driver).waitForJoinToComplete(
        timeouts.joinPanelVisible,
        timeouts.joinCompletion
      )
      const channel = new Channel(joiner.driver, 'general')
      expect(await channel.isReady()).toBeTruthy()
      await new Sidebar(owner.driver).waitForUserProfilesNum(2)
    } finally {
      await closeAndCleanupApps(apps)
    }
  })

  // Every step of the redesign is reachable and reversible before anything is
  // committed. One app, no community: this is the modal graph, not a join.
  it('walks back out of each onboarding branch to Get started', async () => {
    const app = new App({ username: 'onboarding-navigation' })

    try {
      await app.openWithRetries()
      const getStarted = new GetStartedModal(app.driver)
      expect(await getStarted.isReady()).toBeTruthy()

      // Link devices → Display QR code → back to the Link devices choice → back to Get started
      await getStarted.linkDevices()
      const linkDevices = new LinkDevicesModal(app.driver)
      expect(await linkDevices.isReady()).toBeTruthy()
      await linkDevices.displayQrCode()
      expect(await linkDevices.isOnDisplayQrStep()).toBeTruthy()
      // connection.selectors.deviceLinkUrl returns '' without a current community, so
      // this step cannot show a QR code here however long it waits: it reports why.
      // Assert that settled copy, so the test cannot pass on a blank container, on
      // the transient loading line, or on a QR that should be impossible here.
      expect(await linkDevices.settledDeviceLinkStatus()).toBe('Device link unavailable')
      await linkDevices.back()
      expect(await linkDevices.isReady()).toBeTruthy()
      await linkDevices.back()
      expect(await getStarted.isReady()).toBeTruthy()

      // Join community → back to Get started → Create a new community. This is the
      // branch of switchToCreateCommunity that the other suites never reach, because
      // they call it while the app is still on Get started.
      await getStarted.joinCommunity()
      const joinModal = new JoinCommunityModal(app.driver)
      // enter() waits for the choice screen itself. isReady() also accepts the Get
      // started entry, so it can return before the click lands and let
      // switchToCreateCommunity take its no-back path, proving nothing.
      await joinModal.enter()
      await joinModal.switchToCreateCommunity()
      expect(await new CreateCommunityModal(app.driver).isReady()).toBeTruthy()
    } finally {
      await closeAndCleanupApps([app])
    }
  })

  it('Get started → create → username', async () => {
    const owner = new App({ username: 'onboarding-create-owner' })

    try {
      const channel = await createCommunity(owner, `onbcreate${Date.now().toString(36)}`, 'onboardingcreator')
      await channel.sendMessage('hello from the new community', 'onboardingcreator')
      const messages = await channel.getUserMessages('onboardingcreator')
      expect(messages.length).toBeGreaterThan(0)
    } finally {
      await closeAndCleanupApps([owner])
    }
  })

  describe('device linking (multiplayer)', () => {
    const ownerUsername = 'onboardingdevices'
    const owner = new App({ username: `${ownerUsername}-primary` })
    // B links by pasting the link (the Paste link row); the join scenario above covers the camera.
    const linkedDevice = new App({ username: `${ownerUsername}-linked` })
    const apps = [owner, linkedDevice]

    afterAll(async () => {
      await closeAndCleanupApps(apps)
    })

    it('A creates a community and generates a device link; B links through Get started → Link devices → Paste link', async () => {
      await createCommunity(owner, `onbdev${Date.now().toString(36)}`, ownerUsername)
      // Nothing is linked yet, so the share direction draws its empty list.
      expect(await noLinkedDevicesInSettings(owner)).toBe(true)
      const memberInvitation = await getMemberInvitation(owner)
      const deviceInvitation = await getDeviceInvitation(owner)

      await linkedDevice.openWithRetries()
      const getStarted = new GetStartedModal(linkedDevice.driver)
      expect(await getStarted.isReady()).toBeTruthy()
      await getStarted.linkDevices()

      const linkDevices = new LinkDevicesModal(linkedDevice.driver)
      expect(await linkDevices.isReady()).toBeTruthy()
      // "Paste link" opens the paste step directly, not the camera
      await linkDevices.pasteLink()
      expect(
        await linkedDevice.driver.findElements(By.xpath("//*[@data-testid='link-devices-scanner-viewfinder']"))
      ).toHaveLength(0)

      // A member invitation is refused: the error shows under the input and nothing starts
      await linkDevices.typeDeviceLink(memberInvitation)
      await linkDevices.submit()
      expect(await linkDevices.waitForPasteLinkError(NOT_A_DEVICE_LINK_ERROR)).toBe(NOT_A_DEVICE_LINK_ERROR)
      expect(
        await linkedDevice.driver.findElements(By.xpath("//*[@data-testid='joiningPanelComponent']"))
      ).toHaveLength(0)
      expect(await linkedDevice.driver.findElements(By.xpath("//*[@data-testid='paste-link-input']"))).toHaveLength(1)
      // The refusal raised no consent sheet, because nothing was going to be linked.
      expect(await linkedDevice.driver.findElements(By.xpath("//*[@data-testid='device-link-consent']"))).toHaveLength(
        0
      )

      // The real device link links this device, once its consent is given (submit confirms it)
      await linkDevices.clearLink()
      await linkDevices.typeDeviceLink(deviceInvitation)
      await linkDevices.submit()

      const joinPanel = new JoiningLoadingPanel(linkedDevice.driver)
      expect(await joinPanel.waitUntilVisible(timeouts.joinPanelVisible)).toBeTruthy()
      await joinPanel.waitForJoinToComplete(timeouts.joinPanelVisible, timeouts.joinCompletion)
    })

    it('both devices show the community as the same user', async () => {
      const channel = new Channel(linkedDevice.driver, 'general')
      expect(await channel.isReady()).toBeTruthy()
      expect(await channel.isMessageInputReady()).toBeTruthy()

      const sidebar = new Sidebar(linkedDevice.driver)
      expect((await sidebar.getCurrentUserNickname()).trim()).toBe(ownerUsername)
      expect((await new Sidebar(owner.driver).getCurrentUserNickname()).trim()).toBe(ownerUsername)
    })

    it('a message sent from B appears on A', async () => {
      const message = `sent from the linked device ${Date.now().toString(36)}`
      const channelB = new Channel(linkedDevice.driver, 'general')
      await channelB.sendMessage(message, ownerUsername)

      const channelA = new Channel(owner.driver, 'general')
      expect(await channelA.isReady()).toBeTruthy()
      await channelA.waitForUserMessageByText(ownerUsername, message)
    })

    it("A's device list shows B, and B's shows A", async () => {
      const onA = await linkedDevicesInSettings(owner, 1)
      const onB = await linkedDevicesInSettings(linkedDevice, 1)
      expect(onA).toHaveLength(1)
      expect(onB).toHaveLength(1)

      // A surface lists every device on the account except the one it runs on, so
      // the single row A sees must be B's device: if it were some third device, B
      // would be listing it too. The same argument the other way round names A.
      const seenByA = onA[0].deviceId
      const seenByB = onB[0].deviceId
      expect(onB.map(device => device.deviceId)).not.toContain(seenByA)
      expect(onA.map(device => device.deviceId)).not.toContain(seenByB)
      expect(seenByA).not.toEqual(seenByB)
      expect(onA[0].deviceName.length).toBeGreaterThan(0)
      expect(onB[0].deviceName.length).toBeGreaterThan(0)
    })

    // #3400 ships no device removal, and this line carries #3471 (removal
    // gated off), so there is nothing to unlink with yet. Kept as the shape
    // of the scenario for when device removal lands.
    it.skip('unlink from A → B loses access', async () => {
      logger.warn('Device removal is not implemented on this branch')
    })
  })
})
