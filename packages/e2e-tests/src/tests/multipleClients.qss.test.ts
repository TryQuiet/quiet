import { jest } from '@jest/globals'

import {
  App,
  Channel,
  CreateCommunityModal,
  DebugModeModal,
  JoinCommunityModal,
  JoiningLoadingPanel,
  RegisterUsernameModal,
  Sidebar,
  ServerOfferModal,
} from '../selectors'
import { promiseWithRetries, sleep } from '../utils'
import { UserTestData } from '../types'
import { createLogger } from '../logger'
import { SettingsModalTabName } from '../enums'

const logger = createLogger('multipleClients:qss')

jest.setTimeout(1200000) // 20 minutes
describe('Multiple Clients (QSS)', () => {
  let generalChannelOwner: Channel
  let generalChannelUser1: Channel
  let generalChannelUser2: Channel

  let invitationLink: string

  let users: Record<string, UserTestData>

  const communityName = 'testcommunity'
  const generalChannelName = 'general'

  beforeAll(async () => {
    const commonApp = new App()
    users = {
      owner: {
        username: 'owner',
        messages: ['Hi', 'Hello', 'After guest left the app'],
        app: new App(),
      },
      user1: {
        username: 'user-joining-1',
        messages: ['Nice to meet you all', 'This is a message'],
        app: commonApp,
      },
      user2: {
        username: 'user-joining-2',
        messages: ['Hi everyone', 'The owner should see this even without user1 online'],
        app: new App(),
      },
    }
  })

  afterAll(async () => {
    for (const user of Object.values(users)) {
      await user.app.close()
      await user.app.cleanup()
    }
  })

  beforeEach(async () => {
    logger.info(`░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ ${expect.getState().currentTestName}`)
  })

  describe('Stages:', () => {
    describe('Owner Opens App', () => {
      it('Owner opens the app with QSS enabled', async () => {
        await users.owner.app.openWithRetries(undefined, true)
      })

      it('Owner sees "join community" modal and switches to "create community" modal', async () => {
        const joinModal = new JoinCommunityModal(users.owner.app.driver)
        expect(await joinModal.isReady()).toBeTruthy()
        await joinModal.switchToCreateCommunity()
      })

      it('Owner submits valid community name', async () => {
        const createModal = new CreateCommunityModal(users.owner.app.driver)
        expect(await createModal.isReady()).toBeTruthy()
        await createModal.typeCommunityName(communityName)
        await createModal.submit()
      })

      it('Owner sees "server offer" modal', async () => {
        const serverOfferModal = new ServerOfferModal(users.owner.app.driver)
        expect(await serverOfferModal.element).toBeTruthy()
      })

      it('Owner accepts server offer', async () => {
        const serverOfferModal = new ServerOfferModal(users.owner.app.driver)
        await serverOfferModal.chooseUseServer()
      })

      it('Owner sees "register username" modal and submits valid username', async () => {
        const registerModal = new RegisterUsernameModal(users.owner.app.driver)
        expect(await registerModal.isReady()).toBeTruthy()
        await registerModal.typeUsername(users.owner.username)
        await registerModal.submit()
      })

      it('Owner waits to join', async () => {
        const joinPanel = new JoiningLoadingPanel(users.owner.app.driver)
        await joinPanel.waitForJoinToComplete()
      })

      it('Owner registers successfully and sees general channel', async () => {
        generalChannelOwner = new Channel(users.owner.app.driver, generalChannelName)
        expect(await generalChannelOwner.isReady()).toBeTruthy()
        expect(await generalChannelOwner.isOpen()).toBeTruthy()

        const generalChannelText = await generalChannelOwner.element.getText()
        expect(generalChannelText).toEqual('# general')
      })

      it('Owner sends a message', async () => {
        expect(await generalChannelOwner.isMessageInputReady()).toBeTruthy()
        await generalChannelOwner.sendMessage(users.owner.messages[0], users.owner.username)
      })

      it("Owner's message is visible on channel", async () => {
        const messages = await generalChannelOwner.getUserMessages(users.owner.username)
        const text = await messages[1].getText()
        expect(text).toEqual(users.owner.messages[0])
      })

      it('Owner opens the settings tab and gets an invitation link', async () => {
        const settingsModal = await new Sidebar(users.owner.app.driver).openSettings()
        expect(await settingsModal.isReady()).toBeTruthy()
        await settingsModal.switchTab(SettingsModalTabName.INVITE)
        const invitationLinkElement = await settingsModal.invitationLink()
        invitationLink = await invitationLinkElement.getText()
        expect(invitationLink).not.toBeUndefined()
        logger.info('Received invitation link:', invitationLink)
        logger.warn('closing invite tab')
        await settingsModal.closeTabThenModal()
      })
    })

    describe('First User Joins Community', () => {
      it('First user opens the app', async () => {
        await users.user1.app.openWithRetries(undefined, true)
      })

      it('First user submits invitation code received from owner', async () => {
        const joinCommunityModal = new JoinCommunityModal(users.user1.app.driver)
        expect(await joinCommunityModal.isReady()).toBeTruthy()
        logger.info({ invitationLink })
        await joinCommunityModal.typeCommunityInviteLink(invitationLink)
        await joinCommunityModal.submit()
      })

      it('First user submits valid username', async () => {
        const app = users.user1.app
        const registerModal = new RegisterUsernameModal(app.driver)
        expect(await registerModal.isReady()).toBeTruthy()
        await registerModal.clearInput()
        await registerModal.typeUsername(users.user1.username)
        await registerModal.submit()
        logger.time(`[${app.name}] '${users.user1.username}' joining community time`)
      })

      it('First user waits to join', async () => {
        const joinPanel = new JoiningLoadingPanel(users.user1.app.driver)
        await joinPanel.waitForJoinToComplete()
      })

      it('First user joins successfully sees general channel and sends a message', async () => {
        const app = users.user1.app
        const loadNewUser = async () => {
          generalChannelUser1 = new Channel(app.driver, generalChannelName)
          expect(await generalChannelUser1.isReady()).toBeTruthy()
          expect(await generalChannelUser1.isOpen()).toBeTruthy()
          expect(await generalChannelUser1.isMessageInputReady()).toBeTruthy()
          logger.timeEnd(`[${app.name}] '${users.user1.username}' joining community time`)
        }

        const retryConfig = app.retryConfig
        const failureReason = `Failed to load app for new user ${users.user1.username} within ${retryConfig.timeoutMs}ms`
        const onTimeout = async () => {
          await app.close()
          await app.open()
        }
        await promiseWithRetries(loadNewUser(), failureReason, retryConfig, onTimeout)
        await generalChannelUser1.sendMessage(users.user1.messages[0], users.user1.username)
      })

      it("First user's message is visible in a channel", async () => {
        await generalChannelUser1.getUserMessages(users.owner.username)
        await generalChannelUser1.getMessageIdsByText(users.user1.messages[0], users.user1.username)
      })

      it("First user's message is visible in a channel to the owner", async () => {
        await generalChannelUser1.getUserMessages(users.user1.username)
        await generalChannelOwner.getMessageIdsByText(users.user1.messages[0], users.user1.username)
      })

      // NOTE: we used to get the second invite link with the other user but LFA treats invite generation as an admin-only
      // action and the only admin currently is the owner
      it('Owner opens the settings tab and gets an updated invitation link', async () => {
        const settingsModal = await new Sidebar(users.owner.app.driver).openSettings()
        expect(await settingsModal.isReady()).toBeTruthy()
        await settingsModal.switchTab(SettingsModalTabName.INVITE)
        const invitationLinkElement = await settingsModal.invitationLink()
        invitationLink = await invitationLinkElement.getText()
        expect(invitationLink).not.toBeUndefined()
        logger.info('Received updated invitation link:', invitationLink)
        logger.warn('closing invite tab')
        await settingsModal.closeTabThenModal()
      })
    })

    describe('Owner Leaves', () => {
      it('Owner goes offline', async () => {
        await users.owner.app.close()
      })

      it(`First user sends a message`, async () => {
        await generalChannelUser1.sendMessage(users.user1.messages[1], users.user1.username)
      })

      it("First user's message is visible in a channel", async () => {
        await generalChannelUser1.getMessageIdsByText(users.user1.messages[1], users.user1.username)
      })
    })

    describe('Second User Joins', () => {
      it('Second user opens the app', async () => {
        await users.user2.app.openWithRetries(undefined, true)
        const debugModal = new DebugModeModal(users.user2.app.driver)
        await debugModal.close()
      })

      it('Second user starts to join when owner is offline', async () => {
        const app = users.user2.app
        const joinCommunityModal = new JoinCommunityModal(app.driver)
        expect(await joinCommunityModal.isReady()).toBeTruthy()
        logger.info({ invitationLink })
        await joinCommunityModal.typeCommunityInviteLink(invitationLink)
        await joinCommunityModal.submit()
      })

      it('Second user submits valid username', async () => {
        const app = users.user2.app
        const registerModal = new RegisterUsernameModal(app.driver)
        expect(await registerModal.isReady()).toBeTruthy()
        await registerModal.clearInput()
        await registerModal.typeUsername(users.user2.username)
        await registerModal.submit()
        logger.time(`[${app.name}] '${users.user2.username}' joining community time`)
      })

      it('Second user waits to join', async () => {
        const joinPanel = new JoiningLoadingPanel(users.user2.app.driver)
        await joinPanel.waitForJoinToComplete()
      })

      it('Second user sees general channel', async () => {
        const app = users.user2.app
        const loadNewUser = async () => {
          generalChannelUser2 = new Channel(app.driver, generalChannelName)
          expect(await generalChannelUser2.isReady()).toBeTruthy()
          expect(await generalChannelUser2.isOpen()).toBeTruthy()
          expect(await generalChannelUser2.isMessageInputReady()).toBeTruthy()
          logger.timeEnd(`[${app.name}] '${users.user2.username}' joining community time`)
        }

        const retryConfig = app.retryConfig
        const failureReason = `Failed to load app for new user ${users.user2.username} within ${retryConfig.timeoutMs}ms`
        const onTimeout = async () => {
          await app.close()
          await app.open()
        }
        await promiseWithRetries(loadNewUser(), failureReason, retryConfig, onTimeout)
      })

      it('Second user can send a message and is visible', async () => {
        await generalChannelUser2.sendMessage(users.user2.messages[0], users.user2.username)
        await generalChannelUser2.getMessageIdsByText(users.user2.messages[0], users.user2.username)
      })

      it(`First user sees second user's message`, async () => {
        await generalChannelUser1.getMessageIdsByText(users.user2.messages[0], users.user2.username)
      })
    })

    describe('First User Leaves', () => {
      it('First user goes offline', async () => {
        await users.user1.app.close()
      })
    })

    describe('Second User Registers Using QSS and Owner', () => {
      // TODO: add check for number of messages
      it('Owner goes back online', async () => {
        await users.owner.app.openWithRetries(undefined, true)
        const debugModal = new DebugModeModal(users.owner.app.driver)
        await debugModal.close()
        await sleep(30000)
      })

      it(`Owner can see the second user's message`, async () => {
        generalChannelOwner = new Channel(users.owner.app.driver, generalChannelName)
        await generalChannelOwner.getMessageIdsByText(users.user2.messages[0], users.user2.username, 120_000)
      })

      it(`Second user sends a new message`, async () => {
        await generalChannelUser2.sendMessage(users.user2.messages[1], users.user2.username)
      })

      it("Second user's message is visible in a channel", async () => {
        await generalChannelUser2.getMessageIdsByText(users.user2.messages[1], users.user2.username)
      })

      it("Second user's message is visible in a channel for owner", async () => {
        await generalChannelOwner.getMessageIdsByText(users.user2.messages[1], users.user2.username)
      })
    })

    describe('First User Comes Back Online', () => {
      it('First user goes back online', async () => {
        await users.user1.app.openWithRetries(undefined, true)
        const debugModal = new DebugModeModal(users.owner.app.driver)
        await debugModal.close()
        await sleep(30000)
      })

      it("Second user's message is visible in a channel for first user", async () => {
        generalChannelUser1 = new Channel(users.user1.app.driver, generalChannelName)
        expect(await generalChannelUser1.isReady()).toBeTruthy()
        expect(await generalChannelUser1.isOpen()).toBeTruthy()
        expect(await generalChannelUser1.isMessageInputReady()).toBeTruthy()
        await generalChannelUser1.getMessageIdsByText(users.user2.messages[1], users.user2.username, 120_000)
      })
    })
  })
})
