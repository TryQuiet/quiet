import { jest } from '@jest/globals'

import {
  App,
  Channel,
  CreateCommunityModal,
  JoinCommunityModal,
  JoiningLoadingPanel,
  RegisterUsernameModal,
  Sidebar,
} from '../selectors'
import { SettingsModalTabName } from '../enums'
import { createLogger } from '../logger'
import { sleep } from '../utils'

const logger = createLogger('deviceLinking')
const previousLocalTransport = process.env.LOCAL_TRANSPORT

jest.setTimeout(1_200_000) // 20 minutes

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

function getDeviceLinkingTimeouts() {
  return process.env.LOCAL_TRANSPORT === 'true'
    ? {
        joinPanelVisible: 15_000,
        inviteGraphSync: 30_000,
        joinCompletion: 60_000,
      }
    : {
        joinPanelVisible: 60_000,
        inviteGraphSync: 180_000,
        joinCompletion: 360_000,
      }
}

async function createP2pCommunity(owner: App, communityName: string, username: string): Promise<Channel> {
  expect(communityName.length).toBeLessThanOrEqual(20)
  await owner.openWithRetries()

  const joinModal = new JoinCommunityModal(owner.driver)
  expect(await joinModal.isReady()).toBeTruthy()
  await joinModal.switchToCreateCommunity()

  const createModal = new CreateCommunityModal(owner.driver)
  expect(await createModal.isReady()).toBeTruthy()
  await createModal.typeCommunityName(communityName)
  await createModal.submit()

  const registerModal = new RegisterUsernameModal(owner.driver)
  expect(await registerModal.isReady()).toBeTruthy()
  await registerModal.typeUsername(username)
  await registerModal.submit()

  const timeouts = getDeviceLinkingTimeouts()
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

async function joinMember(app: App, invitationLink: string, username: string): Promise<Channel> {
  await app.openWithRetries()

  const joinModal = new JoinCommunityModal(app.driver)
  expect(await joinModal.isReady()).toBeTruthy()
  await joinModal.typeCommunityInviteLink(invitationLink)
  await joinModal.submit()

  const registerModal = new RegisterUsernameModal(app.driver)
  expect(await registerModal.isReady()).toBeTruthy()
  await registerModal.clearInput()
  await registerModal.typeUsername(username)
  await registerModal.submit()

  const timeouts = getDeviceLinkingTimeouts()
  await new JoiningLoadingPanel(app.driver).waitForJoinToComplete(timeouts.joinPanelVisible, timeouts.joinCompletion)
  const channel = new Channel(app.driver, 'general')
  expect(await channel.isReady()).toBeTruthy()
  expect(await channel.isMessageInputReady()).toBeTruthy()
  return channel
}

async function submitDeviceInvitation(app: App, invitationLink: string): Promise<JoiningLoadingPanel> {
  await app.openWithRetries()

  const joinModal = new JoinCommunityModal(app.driver)
  expect(await joinModal.isReady()).toBeTruthy()
  await joinModal.typeCommunityInviteLink(invitationLink)
  await joinModal.submit()

  const joinPanel = new JoiningLoadingPanel(app.driver)
  expect(await joinPanel.waitUntilVisible(getDeviceLinkingTimeouts().joinPanelVisible)).toBeTruthy()
  return joinPanel
}

async function expectLinkedDeviceReady(app: App, ownerUsername: string, expectedUserCount: number): Promise<void> {
  const channel = new Channel(app.driver, 'general')
  expect(await channel.isReady()).toBeTruthy()
  expect(await channel.isMessageInputReady()).toBeTruthy()

  const sidebar = new Sidebar(app.driver)
  await sidebar.waitForUserProfilesNum(expectedUserCount)
  expect((await sidebar.getCurrentUserNickname()).trim()).toBe(ownerUsername)
  expect(await sidebar.getUserProfileByNickname(ownerUsername)).toBeDefined()
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

describe('Device linking (P2P)', () => {
  beforeEach(() => {
    logger.info(`░░░ ${expect.getState().currentTestName}`)
  })

  it('links a new owner device while the owner and two unique members are online', async () => {
    const ownerUsername = 'device-owner-online'
    const owner = new App({ username: `${ownerUsername}-primary` })
    const firstMember = new App({ username: 'p2p-device-online-member-1' })
    const secondMember = new App({ username: 'p2p-device-online-member-2' })
    const linkedDevice = new App({ username: `${ownerUsername}-linked` })
    const apps = [owner, firstMember, secondMember, linkedDevice]
    const timeouts = getDeviceLinkingTimeouts()

    try {
      await createP2pCommunity(owner, `dlonline${Date.now().toString(36)}`, ownerUsername)

      // Create the device invitation first so both subsequently admitted members
      // learn its proof as part of the team graph they join.
      const deviceInvitation = await getDeviceInvitation(owner)
      const memberInvitation = await getMemberInvitation(owner)

      await joinMember(firstMember, memberInvitation, 'online-member-1')
      await joinMember(secondMember, memberInvitation, 'online-member-2')

      await Promise.all([
        new Sidebar(owner.driver).waitForUserProfilesNum(3),
        new Sidebar(firstMember.driver).waitForUserProfilesNum(3),
        new Sidebar(secondMember.driver).waitForUserProfilesNum(3),
      ])

      const joinPanel = await submitDeviceInvitation(linkedDevice, deviceInvitation)
      await joinPanel.waitForJoinToComplete(timeouts.joinPanelVisible, timeouts.joinCompletion)
      await expectLinkedDeviceReady(linkedDevice, ownerUsername, 3)
    } finally {
      await closeAndCleanupApps(apps)
    }
  })

  it('keeps a device join loading until an invite-aware peer returns online', async () => {
    const ownerUsername = 'device-owner-retry'
    const owner = new App({ username: `${ownerUsername}-primary` })
    const unawareMember = new App({ username: 'p2p-device-unaware-member' })
    const awarePeer1 = new App({ username: 'p2p-device-aware-peer-1' })
    const linkedDevice = new App({ username: `${ownerUsername}-linked` })
    const apps = [owner, unawareMember, awarePeer1, linkedDevice]
    const timeouts = getDeviceLinkingTimeouts()

    try {
      await createP2pCommunity(owner, `dlretry${Date.now().toString(36)}`, ownerUsername)
      const memberInvitation = await getMemberInvitation(owner)

      await joinMember(unawareMember, memberInvitation, 'unaware-member')
      await joinMember(awarePeer1, memberInvitation, 'aware-peer-1')
      await new Sidebar(owner.driver).waitForUserProfilesNum(3)

      // This member misses the device-invite graph update and remains unable to
      // validate the linked device's invitation proof.
      await unawareMember.close()

      awarePeer1.buildSetup.clearProcessOutput()
      const deviceInvitation = await getDeviceInvitation(owner)
      await awarePeer1.buildSetup.waitForProcessOutput('Chain updated, emitted updated event', timeouts.inviteGraphSync)

      // The owner and aware-peer-1 are the only peers that know the device invite.
      // Take both offline so every address in the invitation is initially unusable.
      await owner.close()
      await awarePeer1.close()

      const joinPanel = await submitDeviceInvitation(linkedDevice, deviceInvitation)

      // With all existing peers offline, the linked device must remain on the
      // joining panel instead of treating connection failures as admission.
      await sleep(10_000)
      expect(await joinPanel.waitUntilVisible(5_000)).toBeTruthy()

      // The owner stays offline. A non-owner member that received the invite edge
      // is sufficient to admit the owner's new device when it comes back.
      await awarePeer1.openWithRetries()
      const awareChannel = new Channel(awarePeer1.driver, 'general')
      expect(await awareChannel.isReady()).toBeTruthy()
      expect(await awareChannel.isMessageInputReady()).toBeTruthy()

      await joinPanel.waitForJoinToComplete(timeouts.joinPanelVisible, timeouts.joinCompletion)
      await expectLinkedDeviceReady(linkedDevice, ownerUsername, 3)
      expect(owner.isOpened).toBe(false)
      expect(unawareMember.isOpened).toBe(false)
    } finally {
      await closeAndCleanupApps(apps)
    }
  })
})
