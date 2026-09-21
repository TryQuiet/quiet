import { jest } from '@jest/globals'

import {
  App,
  Channel,
  CreateCommunityModal,
  JoinCommunityModal,
  JoiningLoadingPanel,
  RegisterUsernameModal,
  ServerOfferModal,
  Sidebar,
  TermsOfServiceModal,
} from '../selectors'
import { SettingsModalTabName } from '../enums'
import { registerDeviceLinkingDmStages } from './deviceLinking.dms.shared'

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

const TIMEOUTS = {
  joinPanelVisible: 15_000,
  startupModalReady: 180_000,
  joinCompletion: 360_000,
  profileSync: 120_000,
  messageSync: 120_000,
}

/**
 * The same conversation as deviceLinking.dms.test.ts, on a community that keeps its data with the
 * storage service. The DM key is still boxed to the participants' account keys, so the server is
 * one more replica that cannot read any of it - and the linked device still can.
 */
describe('Direct messages across linked devices (QSS)', () => {
  registerDeviceLinkingDmStages({
    label: 'qss',
    timeouts: TIMEOUTS,

    async createCommunity(owner: App, communityName: string, username: string): Promise<Channel> {
      expect(communityName.length).toBeLessThanOrEqual(20)
      await owner.openWithRetries(undefined, true)

      const joinModal = new JoinCommunityModal(owner.driver)
      expect(await joinModal.isReady(TIMEOUTS.startupModalReady)).toBeTruthy()
      await joinModal.switchToCreateCommunity()

      const createModal = new CreateCommunityModal(owner.driver)
      expect(await createModal.isReady()).toBeTruthy()
      await createModal.typeCommunityName(communityName)
      await createModal.submit()

      const serverOfferModal = new ServerOfferModal(owner.driver)
      expect(await serverOfferModal.isReady()).toBeTruthy()
      await serverOfferModal.chooseUseServer()

      const registerModal = new RegisterUsernameModal(owner.driver)
      expect(await registerModal.isReady()).toBeTruthy()
      await registerModal.typeUsername(username)
      await registerModal.submit()

      const termsModal = new TermsOfServiceModal(owner.driver)
      expect(await termsModal.isReady()).toBeTruthy()
      await termsModal.chooseAgreeAndJoin()

      await new JoiningLoadingPanel(owner.driver).waitForJoinToComplete(
        TIMEOUTS.joinPanelVisible,
        TIMEOUTS.joinCompletion
      )
      const channel = new Channel(owner.driver, 'general')
      expect(await channel.isReady()).toBeTruthy()
      expect(await channel.isMessageInputReady()).toBeTruthy()
      return channel
    },

    async joinMember(app: App, invitationLink: string, username: string): Promise<Channel> {
      await app.openWithRetries(undefined, true)

      const joinModal = new JoinCommunityModal(app.driver)
      expect(await joinModal.isReady(TIMEOUTS.startupModalReady)).toBeTruthy()
      await joinModal.typeCommunityInviteLink(invitationLink)
      await joinModal.submit()

      const registerModal = new RegisterUsernameModal(app.driver)
      expect(await registerModal.isReady()).toBeTruthy()
      await registerModal.clearInput()
      await registerModal.typeUsername(username)
      await registerModal.submit()

      const termsModal = new TermsOfServiceModal(app.driver)
      expect(await termsModal.isReady()).toBeTruthy()
      await termsModal.chooseAgreeAndJoin()

      await new JoiningLoadingPanel(app.driver).waitForJoinToComplete(
        TIMEOUTS.joinPanelVisible,
        TIMEOUTS.joinCompletion
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
      await app.openWithRetries(undefined, true)

      const joinModal = new JoinCommunityModal(app.driver)
      expect(await joinModal.isReady(TIMEOUTS.startupModalReady)).toBeTruthy()
      await joinModal.typeCommunityInviteLink(invitationLink)
      await joinModal.submit()

      const joinPanel = new JoiningLoadingPanel(app.driver)
      expect(await joinPanel.waitUntilVisible(TIMEOUTS.joinPanelVisible)).toBeTruthy()
      return joinPanel
    },

    async reopen(app: App): Promise<void> {
      await app.openWithRetries(undefined, true)
      const channel = new Channel(app.driver, 'general')
      expect(await channel.isReady()).toBeTruthy()
      expect(await channel.isMessageInputReady()).toBeTruthy()
    },
  })
})
