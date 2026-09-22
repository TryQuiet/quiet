import { jest } from '@jest/globals'

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
  const link = await (await settings.deviceLink()).getText()
  expect(link.length).toBeGreaterThan(0)
  await settings.closeTabThenModal()
  return link
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
      // Recover account has no mechanism yet
      expect(await joinModal.isRecoverAccountDisabled()).toBe(true)

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

  // Desktop has no camera, so the QR-code branch of the three-way choice lands on the
  // same paste field. It is a second route into the join flow, not a second join, so it
  // needs its own run to prove the branch reaches admission.
  it('Get started → join with QR code → paste link → username', async () => {
    const owner = new App({ username: 'onboarding-qr-owner' })
    const joiner = new App({ username: 'onboarding-qr-member' })
    const apps = [owner, joiner]

    try {
      await createCommunity(owner, `onbqr${Date.now().toString(36)}`, 'onboardingqrowner')
      const invitation = await getMemberInvitation(owner)

      await joiner.openWithRetries()

      const getStarted = new GetStartedModal(joiner.driver)
      expect(await getStarted.isReady()).toBeTruthy()
      await getStarted.joinCommunity()

      const joinModal = new JoinCommunityModal(joiner.driver)
      expect(await joinModal.isReady()).toBeTruthy()
      await joinModal.joinWithQrCode()
      await joinModal.typeCommunityInviteLink(invitation)
      await joinModal.submit()

      const registerModal = new RegisterUsernameModal(joiner.driver)
      expect(await registerModal.isReady()).toBeTruthy()
      await registerModal.clearInput()
      await registerModal.typeUsername('onboardingqrmember')
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
      expect(await linkDevices.isDisplayingQrCode()).toBeTruthy()
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
    const linkedDevice = new App({ username: `${ownerUsername}-linked` })
    const apps = [owner, linkedDevice]

    afterAll(async () => {
      await closeAndCleanupApps(apps)
    })

    it('A creates a community and generates a device link; B links through Get started → Link devices', async () => {
      await createCommunity(owner, `onbdev${Date.now().toString(36)}`, ownerUsername)
      const deviceInvitation = await getDeviceInvitation(owner)

      await linkedDevice.openWithRetries()
      const getStarted = new GetStartedModal(linkedDevice.driver)
      expect(await getStarted.isReady()).toBeTruthy()
      await getStarted.linkDevices()

      const linkDevices = new LinkDevicesModal(linkedDevice.driver)
      expect(await linkDevices.isReady()).toBeTruthy()
      // Desktop has no camera: "Scan QR code" takes the pasted device link
      await linkDevices.scanQrCode()
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

    // The backend on this line exposes no linked-device listing (the branch's
    // GET_LINKED_DEVICES handler was dropped in favour of develop's backend), so
    // there is no device list to assert on yet.
    it.skip("A's device list shows B", async () => {
      logger.warn('Listing linked devices is not implemented on this line')
    })

    // #3400 ships no device removal, and this line carries #3471 (removal
    // gated off), so there is nothing to unlink with yet. Kept as the shape
    // of the scenario for when device removal lands.
    it.skip('unlink from A → B loses access', async () => {
      logger.warn('Device removal is not implemented on this branch')
    })
  })
})
