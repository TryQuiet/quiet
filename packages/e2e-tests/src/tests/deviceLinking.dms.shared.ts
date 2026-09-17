import { App, Channel, JoiningLoadingPanel, NewMessage, Sidebar } from '../selectors'
import { createLogger } from '../logger'

const logger = createLogger('deviceLinking:dms')

/**
 * Everything the two transports do differently: creating a community, joining one, and handing a
 * device invitation to a second app. The DM story itself is the same either way.
 */
export interface DeviceLinkingDmHarness {
  /** 'p2p' or 'qss'; only used to keep community and user names distinct between the suites. */
  label: string
  createCommunity(app: App, communityName: string, username: string): Promise<Channel>
  joinMember(app: App, invitationLink: string, username: string): Promise<Channel>
  getMemberInvitation(app: App): Promise<string>
  getDeviceInvitation(app: App): Promise<string>
  submitDeviceInvitation(app: App, invitationLink: string): Promise<JoiningLoadingPanel>
  /** Bring an app that was closed mid-suite back up, already in its community. */
  reopen(app: App): Promise<void>
  timeouts: {
    joinPanelVisible: number
    joinCompletion: number
    profileSync: number
    messageSync: number
  }
}

export async function closeAndCleanupApps(apps: App[]): Promise<void> {
  for (const app of [...apps].reverse()) {
    try {
      if (app.isOpened) await app.close()
      await app.cleanup()
    } catch (error) {
      logger.error(`Error cleaning up app ${app.name}:`, error)
    }
  }
}

/**
 * A DM belongs to the person, not to the device they started it on. These stages follow one
 * conversation across an owner who links a second device halfway through it: the history that
 * predates the link, replies sent from either device, a conversation started on the new device,
 * one that arrives while it is shut, and what the other side sees of the owner being online.
 */
export function registerDeviceLinkingDmStages(harness: DeviceLinkingDmHarness): void {
  const suffix = `${harness.label}${Date.now().toString(36)}`.slice(0, 20)
  const ownerUsername = `dmlink-owner-${harness.label}`
  const memberUsername = `dmlink-member-${harness.label}`

  const owner = new App({ username: `${ownerUsername}-primary` })
  const linkedDevice = new App({ username: `${ownerUsername}-linked` })
  const member = new App({ username: memberUsername })
  const apps = [owner, linkedDevice, member]

  const messages = {
    beforeLinking: `Sent before the owner had two devices ${suffix}`,
    ownerReplyFromLinked: `Replying from the owner's second device ${suffix}`,
    startedOnLinked: `A conversation I started on my new device ${suffix}`,
    whileLinkedClosed: `Sent while the second device was shut ${suffix}`,
  }

  let memberInvitation: string
  let deviceInvitation: string

  let ownerDm: Channel
  let memberDm: Channel
  let linkedDm: Channel

  afterAll(async () => {
    await closeAndCleanupApps(apps)
  })

  beforeEach(() => {
    logger.info(`░░░ ${expect.getState().currentTestName}`)
  })

  describe('A member opens a DM with the owner, who then links a second device', () => {
    it('the owner creates a community and invites a member', async () => {
      await harness.createCommunity(owner, `dmlink${suffix}`.slice(0, 20), ownerUsername)
      // The device invitation is created first, so the member learns its proof as part of the
      // team graph they join - the same ordering develop's device-linking suites rely on.
      deviceInvitation = await harness.getDeviceInvitation(owner)
      memberInvitation = await harness.getMemberInvitation(owner)
      await harness.joinMember(member, memberInvitation, memberUsername)
      await new Sidebar(owner.driver).waitForUserProfilesNum(2, harness.timeouts.profileSync)
    })

    it('the member starts a DM with the owner', async () => {
      const newMessage = new NewMessage(member.driver)
      await newMessage.open()
      const created = await newMessage.createNewDm([ownerUsername], messages.beforeLinking)
      expect(created.error).toBeUndefined()
      expect(created.success).toBeTruthy()
      expect(created.successfulUsers).toEqual([ownerUsername])

      memberDm = new Channel(member.driver, ownerUsername)
      expect(await memberDm.isOpen(undefined, false, 60_000)).toBeTruthy()
      await memberDm.getMessageIdsByText(messages.beforeLinking, memberUsername, harness.timeouts.messageSync)
    })

    it('the owner sees that DM on their first device', async () => {
      ownerDm = await new Sidebar(owner.driver).switchDm(memberUsername)
      await ownerDm.getMessageIdsByText(messages.beforeLinking, memberUsername, harness.timeouts.messageSync)
    })

    it('the owner links a second device', async () => {
      const joinPanel = await harness.submitDeviceInvitation(linkedDevice, deviceInvitation)
      await joinPanel.waitForJoinToComplete(harness.timeouts.joinPanelVisible, harness.timeouts.joinCompletion)

      const general = new Channel(linkedDevice.driver, 'general')
      expect(await general.isReady()).toBeTruthy()
      const sidebar = new Sidebar(linkedDevice.driver)
      // It is the owner, not a third person: the community still holds two people.
      await sidebar.waitForUserProfilesNum(2, harness.timeouts.profileSync)
      expect((await sidebar.getCurrentUserNickname()).trim()).toBe(ownerUsername)
    })

    it('the linked device shows the DM and the history that predates it', async () => {
      linkedDm = await new Sidebar(linkedDevice.driver).switchDm(memberUsername)
      await linkedDm.getMessageIdsByText(messages.beforeLinking, memberUsername, harness.timeouts.messageSync)
    })

    it("a reply from the linked device reaches both, under the owner's name", async () => {
      const ids = await linkedDm.sendMessage(messages.ownerReplyFromLinked, ownerUsername)
      // The author is the owner on every replica, never the device.
      expect(
        await ownerDm.getMessageIdsByText(messages.ownerReplyFromLinked, ownerUsername, harness.timeouts.messageSync)
      ).toEqual(ids)
      expect(
        await memberDm.getMessageIdsByText(messages.ownerReplyFromLinked, ownerUsername, harness.timeouts.messageSync)
      ).toEqual(ids)
    })

    it('a DM started on the linked device reaches the first device and the member', async () => {
      // The owner already has a DM with this member, so starting one again from the new device
      // must land in the same conversation rather than a second one.
      const newMessage = new NewMessage(linkedDevice.driver)
      await newMessage.open()
      const created = await newMessage.createNewDm([memberUsername], messages.startedOnLinked)
      expect(created.error).toBeUndefined()
      expect(created.success).toBeTruthy()

      const started = new Channel(linkedDevice.driver, memberUsername)
      expect(await started.isOpen(undefined, false, 60_000)).toBeTruthy()
      const ids = await started.getMessageIdsByText(
        messages.startedOnLinked,
        ownerUsername,
        harness.timeouts.messageSync
      )
      expect(
        await ownerDm.getMessageIdsByText(messages.startedOnLinked, ownerUsername, harness.timeouts.messageSync)
      ).toEqual(ids)
      expect(
        await memberDm.getMessageIdsByText(messages.startedOnLinked, ownerUsername, harness.timeouts.messageSync)
      ).toEqual(ids)
    })

    it('a DM sent while the linked device is shut arrives when it reopens', async () => {
      await linkedDevice.close()
      const ids = await memberDm.sendMessage(messages.whileLinkedClosed, memberUsername)
      await ownerDm.getMessageIdsByText(messages.whileLinkedClosed, memberUsername, harness.timeouts.messageSync)

      await harness.reopen(linkedDevice)
      const reopened = await new Sidebar(linkedDevice.driver).switchDm(memberUsername)
      expect(
        await reopened.getMessageIdsByText(messages.whileLinkedClosed, memberUsername, harness.timeouts.messageSync)
      ).toEqual(ids)
      // And the history from before the link is still there after a restart.
      await reopened.getMessageIdsByText(messages.beforeLinking, memberUsername, harness.timeouts.messageSync)
      linkedDm = reopened
    })

    it('the member sees the owner online while either owner device is up, and offline with none', async () => {
      const memberSidebar = new Sidebar(member.driver)
      await memberSidebar.waitForUserConnected(ownerUsername, harness.timeouts.profileSync)

      // One device down is not the owner going offline.
      await linkedDevice.close()
      await memberSidebar.waitForUserConnected(ownerUsername, harness.timeouts.profileSync)

      await owner.close()
      await memberSidebar.waitForUserDisconnected(ownerUsername, harness.timeouts.profileSync)

      // And one device coming back is the owner coming back.
      await harness.reopen(linkedDevice)
      await memberSidebar.waitForUserConnected(ownerUsername, harness.timeouts.profileSync)
    })
  })
}
