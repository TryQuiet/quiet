import { jest } from '@jest/globals'
import type { ChildProcess } from 'child_process'

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
import { createLogger } from '../logger'
import type { UserTestData } from '../types'
import { tailQssLogs } from '../utils'

type PrimaryMessages = {
  fromPrimaryDevice: string
  fromLinkedDevice: string
}

type MemberMessages = {
  afterJoining: string
}

type DeviceLinkingUsers = {
  primary: UserTestData<PrimaryMessages>
  linkedDevice: {
    app: App
  }
  member: UserTestData<MemberMessages>
}

const logger = createLogger('deviceLinking:qss')

jest.setTimeout(1_200_000) // 20 minutes

describe('Device linking message replication (QSS)', () => {
  const communityName = 'linkeddevices'
  const generalChannelName = 'general'

  let users: DeviceLinkingUsers
  let qssLogTailProcess: ChildProcess
  let memberInvitationLink: string
  let deviceLink: string
  let primaryChannel: Channel
  let linkedDeviceChannel: Channel
  let memberChannel: Channel
  let stageStartTime: number

  beforeAll(() => {
    qssLogTailProcess = tailQssLogs()
    users = {
      primary: {
        username: 'device-owner',
        messages: {
          fromPrimaryDevice: 'Message from the primary linked device',
          fromLinkedDevice: 'Message from the secondary linked device',
        },
        app: new App({ username: 'device-owner-primary' }),
      },
      linkedDevice: {
        app: new App({ username: 'device-owner-linked' }),
      },
      member: {
        username: 'new-member',
        messages: {
          afterJoining: 'Hello from the newly joined member',
        },
        app: new App({ username: 'new-member' }),
      },
    }
  })

  afterAll(async () => {
    qssLogTailProcess.kill()
    for (const user of Object.values(users)) {
      try {
        await user.app.close()
        await user.app.cleanup()
      } catch (error) {
        logger.error(`Error cleaning up app ${user.app.name}:`, error)
      }
    }
  })

  beforeEach(() => {
    logger.info(`░░░ ${expect.getState().currentTestName}`)
    stageStartTime = Date.now()
  })

  afterEach(() => {
    logger.info(`${expect.getState().currentTestName} Test duration: ${Date.now() - stageStartTime}ms`)
  })

  describe('Primary device creates the community and links a second device', () => {
    it('creates a QSS community and generates member and device links', async () => {
      await users.primary.app.openWithRetries(undefined, true)

      const joinModal = new JoinCommunityModal(users.primary.app.driver)
      expect(await joinModal.isReady()).toBeTruthy()
      await joinModal.switchToCreateCommunity()

      const createModal = new CreateCommunityModal(users.primary.app.driver)
      expect(await createModal.isReady()).toBeTruthy()
      await createModal.typeCommunityName(communityName)
      await createModal.submit()

      const serverOfferModal = new ServerOfferModal(users.primary.app.driver)
      expect(await serverOfferModal.isReady()).toBeTruthy()
      await serverOfferModal.chooseUseServer()

      const registerModal = new RegisterUsernameModal(users.primary.app.driver)
      expect(await registerModal.isReady()).toBeTruthy()
      await registerModal.typeUsername(users.primary.username)
      await registerModal.submit()

      const termsModal = new TermsOfServiceModal(users.primary.app.driver)
      expect(await termsModal.isReady()).toBeTruthy()
      await termsModal.chooseAgreeAndJoin()

      const joinPanel = new JoiningLoadingPanel(users.primary.app.driver)
      await joinPanel.waitForJoinToComplete()

      primaryChannel = new Channel(users.primary.app.driver, generalChannelName)
      expect(await primaryChannel.isReady()).toBeTruthy()
      expect(await primaryChannel.isOpen()).toBeTruthy()
      expect(await primaryChannel.isMessageInputReady()).toBeTruthy()

      const memberSettings = await new Sidebar(users.primary.app.driver).openSettings()
      expect(await memberSettings.isReady()).toBeTruthy()
      await memberSettings.switchTab(SettingsModalTabName.INVITE)
      memberInvitationLink = await (await memberSettings.invitationLink()).getText()
      expect(memberInvitationLink.length).toBeGreaterThan(0)
      await memberSettings.closeTabThenModal()

      const deviceSettings = await new Sidebar(users.primary.app.driver).openSettings()
      expect(await deviceSettings.isReady()).toBeTruthy()
      await deviceSettings.switchTab(SettingsModalTabName.LINKED_DEVICES)
      deviceLink = await (await deviceSettings.deviceLink()).getText()
      expect(deviceLink.length).toBeGreaterThan(0)
      await deviceSettings.closeTabThenModal()
    })

    it('submits a device link on a second desktop without registering another member', async () => {
      await users.linkedDevice.app.openWithRetries(undefined, true)

      const joinModal = new JoinCommunityModal(users.linkedDevice.app.driver)
      expect(await joinModal.isReady()).toBeTruthy()
      await joinModal.typeCommunityInviteLink(deviceLink)
      await joinModal.submit()
    })

    it('shows the joining loading panel while the linked device is joining', async () => {
      const joinPanel = new JoiningLoadingPanel(users.linkedDevice.app.driver)
      expect(await joinPanel.waitUntilVisible()).toBeTruthy()
      await joinPanel.waitForJoinToComplete()

      linkedDeviceChannel = new Channel(users.linkedDevice.app.driver, generalChannelName)
      expect(await linkedDeviceChannel.isReady()).toBeTruthy()
      expect(await linkedDeviceChannel.isOpen()).toBeTruthy()
      expect(await linkedDeviceChannel.isMessageInputReady()).toBeTruthy()
    })
  })

  describe('A third desktop client joins as a new member', () => {
    it('registers the third client with the member invitation', async () => {
      await users.member.app.openWithRetries(undefined, true)

      const joinModal = new JoinCommunityModal(users.member.app.driver)
      expect(await joinModal.isReady()).toBeTruthy()
      await joinModal.typeCommunityInviteLink(memberInvitationLink)
      await joinModal.submit()

      const registerModal = new RegisterUsernameModal(users.member.app.driver)
      expect(await registerModal.isReady()).toBeTruthy()
      await registerModal.clearInput()
      await registerModal.typeUsername(users.member.username)
      await registerModal.submit()

      const termsModal = new TermsOfServiceModal(users.member.app.driver)
      expect(await termsModal.isReady()).toBeTruthy()
      await termsModal.chooseAgreeAndJoin()

      const joinPanel = new JoiningLoadingPanel(users.member.app.driver)
      await joinPanel.waitForJoinToComplete()

      memberChannel = new Channel(users.member.app.driver, generalChannelName)
      expect(await memberChannel.isReady()).toBeTruthy()
      expect(await memberChannel.isOpen()).toBeTruthy()
      expect(await memberChannel.isMessageInputReady()).toBeTruthy()
    })

    it("shows the new member's registration message on both linked clients", async () => {
      const registrationMessage = `@${users.member.username} has joined and will be registered soon. 🎉 Learn more`
      const [primaryMessageIds, linkedMessageIds] = await Promise.all([
        primaryChannel.getMessageIdsByText(registrationMessage, users.member.username, 120_000),
        linkedDeviceChannel.getMessageIdsByText(registrationMessage, users.member.username, 120_000),
      ])

      expect(primaryMessageIds).toEqual(linkedMessageIds)
    })
  })

  describe('Messages converge on both linked clients', () => {
    it("replicates the new member's message to both linked clients", async () => {
      const sentMessageIds = await memberChannel.sendMessage(users.member.messages.afterJoining, users.member.username)
      const [primaryMessageIds, linkedMessageIds] = await Promise.all([
        primaryChannel.getMessageIdsByText(users.member.messages.afterJoining, users.member.username, 120_000),
        linkedDeviceChannel.getMessageIdsByText(users.member.messages.afterJoining, users.member.username, 120_000),
      ])

      expect(primaryMessageIds).toEqual(sentMessageIds)
      expect(linkedMessageIds).toEqual(sentMessageIds)
    })

    it("replicates the primary device's message to the linked device and new member", async () => {
      const sentMessageIds = await primaryChannel.sendMessage(
        users.primary.messages.fromPrimaryDevice,
        users.primary.username
      )
      const [linkedMessageIds, memberMessageIds] = await Promise.all([
        linkedDeviceChannel.getMessageIdsByText(
          users.primary.messages.fromPrimaryDevice,
          users.primary.username,
          120_000
        ),
        memberChannel.getMessageIdsByText(users.primary.messages.fromPrimaryDevice, users.primary.username, 120_000),
      ])

      expect(linkedMessageIds).toEqual(sentMessageIds)
      expect(memberMessageIds).toEqual(sentMessageIds)
    })

    it("replicates the linked device's message to the primary device and new member under the same user", async () => {
      const sentMessageIds = await linkedDeviceChannel.sendMessage(
        users.primary.messages.fromLinkedDevice,
        users.primary.username
      )
      const [primaryMessageIds, memberMessageIds] = await Promise.all([
        primaryChannel.getMessageIdsByText(users.primary.messages.fromLinkedDevice, users.primary.username, 120_000),
        memberChannel.getMessageIdsByText(users.primary.messages.fromLinkedDevice, users.primary.username, 120_000),
      ])

      expect(primaryMessageIds).toEqual(sentMessageIds)
      expect(memberMessageIds).toEqual(sentMessageIds)
    })
  })
})
