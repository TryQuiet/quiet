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
import { registerDeviceLinkingDmStages } from './deviceLinking.dms.shared'

const previousLocalTransport = process.env.LOCAL_TRANSPORT

jest.setTimeout(1_200_000) // 20 minutes

beforeAll(() => {
  // As in deviceLinking.test.ts: CI's release-only Tor job sets this to false explicitly, so do
  // not override a gate that is already set.
  if (process.env.LOCAL_TRANSPORT == null) process.env.LOCAL_TRANSPORT = 'true'
})

afterAll(() => {
  if (previousLocalTransport == null) {
    delete process.env.LOCAL_TRANSPORT
    return
  }
  process.env.LOCAL_TRANSPORT = previousLocalTransport
})

function timeouts() {
  return process.env.LOCAL_TRANSPORT === 'true'
    ? {
        joinPanelVisible: 15_000,
        startupModalReady: 180_000,
        joinCompletion: 60_000,
        profileSync: 60_000,
        messageSync: 60_000,
      }
    : {
        joinPanelVisible: 60_000,
        startupModalReady: 360_000,
        joinCompletion: 360_000,
        profileSync: 360_000,
        messageSync: 360_000,
      }
}

describe('Direct messages across linked devices (P2P)', () => {
  registerDeviceLinkingDmStages({
    label: 'p2p',
    get timeouts() {
      return timeouts()
    },

    async createCommunity(owner: App, communityName: string, username: string): Promise<Channel> {
      expect(communityName.length).toBeLessThanOrEqual(20)
      await owner.openWithRetries()

      const joinModal = new JoinCommunityModal(owner.driver)
      expect(await joinModal.isReady(timeouts().startupModalReady)).toBeTruthy()
      await joinModal.switchToCreateCommunity()

      const createModal = new CreateCommunityModal(owner.driver)
      expect(await createModal.isReady()).toBeTruthy()
      await createModal.typeCommunityName(communityName)
      await createModal.submit()

      const registerModal = new RegisterUsernameModal(owner.driver)
      expect(await registerModal.isReady()).toBeTruthy()
      await registerModal.typeUsername(username)
      await registerModal.submit()

      await new JoiningLoadingPanel(owner.driver).waitForJoinToComplete(
        timeouts().joinPanelVisible,
        timeouts().joinCompletion
      )
      const channel = new Channel(owner.driver, 'general')
      expect(await channel.isReady()).toBeTruthy()
      expect(await channel.isMessageInputReady()).toBeTruthy()
      return channel
    },

    async joinMember(app: App, invitationLink: string, username: string): Promise<Channel> {
      await app.openWithRetries()

      const joinModal = new JoinCommunityModal(app.driver)
      expect(await joinModal.isReady(timeouts().startupModalReady)).toBeTruthy()
      await joinModal.typeCommunityInviteLink(invitationLink)
      await joinModal.submit()

      const registerModal = new RegisterUsernameModal(app.driver)
      expect(await registerModal.isReady()).toBeTruthy()
      await registerModal.clearInput()
      await registerModal.typeUsername(username)
      await registerModal.submit()

      await new JoiningLoadingPanel(app.driver).waitForJoinToComplete(
        timeouts().joinPanelVisible,
        timeouts().joinCompletion
      )
      const channel = new Channel(app.driver, 'general')
      expect(await channel.isReady()).toBeTruthy()
      expect(await channel.isMessageInputReady()).toBeTruthy()
      return channel
    },

    async getMemberInvitation(app: App): Promise<string> {
      const settings = await new Sidebar(app.driver).openSettings()
      expect(await settings.isReady()).toBeTruthy()
      await settings.switchTab(SettingsModalTabName.INVITE)
      const link = await (await settings.invitationLink()).getText()
      expect(link.length).toBeGreaterThan(0)
      await settings.closeTabThenModal()
      return link
    },

    async getDeviceInvitation(app: App): Promise<string> {
      const settings = await new Sidebar(app.driver).openSettings()
      expect(await settings.isReady()).toBeTruthy()
      await settings.switchTab(SettingsModalTabName.LINKED_DEVICES)
      const link = await (await settings.deviceLink()).getText()
      expect(link.length).toBeGreaterThan(0)
      await settings.closeTabThenModal()
      return link
    },

    async submitDeviceInvitation(app: App, invitationLink: string): Promise<JoiningLoadingPanel> {
      await app.openWithRetries()

      const joinModal = new JoinCommunityModal(app.driver)
      expect(await joinModal.isReady(timeouts().startupModalReady)).toBeTruthy()
      await joinModal.typeCommunityInviteLink(invitationLink)
      await joinModal.submit()

      const joinPanel = new JoiningLoadingPanel(app.driver)
      expect(await joinPanel.waitUntilVisible(timeouts().joinPanelVisible)).toBeTruthy()
      return joinPanel
    },

    async reopen(app: App): Promise<void> {
      await app.openWithRetries()
      const channel = new Channel(app.driver, 'general')
      expect(await channel.isReady()).toBeTruthy()
      expect(await channel.isMessageInputReady()).toBeTruthy()
    },
  })
})
