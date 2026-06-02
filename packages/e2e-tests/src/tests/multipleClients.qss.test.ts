import { jest } from '@jest/globals'
import { ChildProcess } from 'child_process'

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
  TermsOfServiceModal,
  Settings,
} from '../selectors'
import { promiseWithRetries, tailQssLogs } from '../utils'
import { UserListStatus, UserTestData } from '../types'
import { createLogger } from '../logger'
import { SettingsModalTabName } from '../enums'

const logger = createLogger('multipleClients:qss')
let stageStartTime: number

type OwnerMessages = {
  initialChannelMessage: string
  fanoutMessage: string
  catchUpMessage: string
}

type User1Messages = {
  initialChannelMessage: string
  ownerOfflineMessage: string
}

type User2Messages = {
  initialChannelMessage: string
  followUpMessage: string
  catchUpMessage: string
}

type MultipleClientsUsers = {
  owner: UserTestData<OwnerMessages>
  user1: UserTestData<User1Messages>
  user2: UserTestData<User2Messages>
}

jest.setTimeout(1200000) // 20 minutes
describe('Multiple Clients (QSS)', () => {
  let generalChannelOwner: Channel
  let generalChannelUser1: Channel
  let generalChannelUser2: Channel
  let qssLogTailProcess: ChildProcess

  let settingsOwner: Settings
  let settingsUser1: Settings
  let settingsUser2: Settings

  let invitationLink: string

  let users: MultipleClientsUsers

  const communityName = 'testcommunity'
  const generalChannelName = 'general'

  beforeAll(async () => {
    qssLogTailProcess = tailQssLogs()
    users = {
      owner: {
        username: 'owner',
        messages: {
          initialChannelMessage: 'Hi',
          fanoutMessage: 'This message should fanout via QSS logs',
          catchUpMessage: 'First user should catch up via QSS',
        },
        app: new App({ username: 'owner' }),
      },
      user1: {
        username: 'user-joining-1',
        messages: {
          initialChannelMessage: 'Nice to meet you all',
          ownerOfflineMessage: 'This is a message',
        },
        app: new App({ username: 'user-joining-1' }),
      },
      user2: {
        username: 'user-joining-2',
        messages: {
          initialChannelMessage: 'Hi everyone',
          followUpMessage: 'The owner should see this even without user1 online',
          catchUpMessage: 'First user is offline but should catch up via QSS',
        },
        app: new App({ username: 'user-joining-2' }),
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
        logger.error(`Error cleaning up user ${user.username}:`, error)
      }
    }
  })

  beforeEach(async () => {
    logger.info(`░░░ ${expect.getState().currentTestName}`)
    stageStartTime = Date.now()
  })

  afterEach(async () => {
    const duration = Date.now() - stageStartTime
    logger.info(`${expect.getState().currentTestName} Test duration: ${duration}ms`)
  })

  describe('Stages:', () => {
    describe('Owner Opens App', () => {
      it('Owner opens the app with QSS enabled', async () => {
        await users.owner.app.open(true)
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
        expect(await serverOfferModal.isReady()).toBeTruthy()
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

      it('Owner agrees to Terms of Service', async () => {
        const tosModal = new TermsOfServiceModal(users.owner.app.driver)
        expect(await tosModal.isReady()).toBeTruthy()
        await tosModal.chooseAgreeAndJoin()
      })

      it('Owner waits to join', async () => {
        const joinPanel = new JoiningLoadingPanel(users.owner.app.driver)
        await joinPanel.waitForJoinToComplete()
      })

      it('Owner registers successfully and sees general channel', async () => {
        generalChannelOwner = new Channel(users.owner.app.driver, generalChannelName)
        expect(await generalChannelOwner.isReady()).toBeTruthy()
        expect(await generalChannelOwner.isOpen()).toBeTruthy()
        const sidebarOwner = new Sidebar(users.owner.app.driver)
        await sidebarOwner.getChannelIcon(generalChannelName, true)

        const generalChannelText = await generalChannelOwner.element.getText()
        expect(generalChannelText).toEqual('general')
      })

      it('Owner sends a message', async () => {
        expect(await generalChannelOwner.isMessageInputReady()).toBeTruthy()
        await generalChannelOwner.sendMessage(users.owner.messages.initialChannelMessage, users.owner.username)
      })

      it("Owner's message is visible on channel", async () => {
        const messages = await generalChannelOwner.getUserMessages(users.owner.username)
        const text = await messages[1].getText()
        expect(text).toEqual(users.owner.messages.initialChannelMessage)
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

      it('First user agrees to Terms of Service', async () => {
        const tosModal = new TermsOfServiceModal(users.user1.app.driver)
        expect(await tosModal.isReady()).toBeTruthy()
        await tosModal.chooseAgreeAndJoin()
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
        await generalChannelUser1.sendMessage(users.user1.messages.initialChannelMessage, users.user1.username)
      })

      it('First user opens community membership tab', async () => {
        settingsUser1 = await new Sidebar(users.user1.app.driver).openSettings()
        await settingsUser1.openCommunityMembership(2)
      })

      it('First user sees self in user list', async () => {
        const status = await settingsUser1.getUserInCommunityMembership(
          users.user1.username,
          UserListStatus.ONLINE,
          true
        )
        expect(status.status).toBe(UserListStatus.ONLINE)
        expect(status.textMatches).toBe(true)
      })

      it('First user sees owner in user list', async () => {
        const status = await settingsUser1.getUserInCommunityMembership(
          users.owner.username,
          UserListStatus.ONLINE,
          false
        )
        expect(status.status).toBe(UserListStatus.ONLINE)
        expect(status.textMatches).toBe(true)
      })

      it('First user closes community membership tab', async () => {
        await settingsUser1.closeTabThenModal()
      })

      it('Owner opens community membership tab', async () => {
        settingsOwner = await new Sidebar(users.owner.app.driver).openSettings()
        await settingsOwner.openCommunityMembership(2)
      })

      it('Owner sees self in user list', async () => {
        const status = await settingsOwner.getUserInCommunityMembership(
          users.owner.username,
          UserListStatus.ONLINE,
          true
        )
        expect(status.status).toBe(UserListStatus.ONLINE)
        expect(status.textMatches).toBe(true)
      })

      it('Owner sees first user in user list', async () => {
        const status = await settingsOwner.getUserInCommunityMembership(
          users.user1.username,
          UserListStatus.ONLINE,
          false
        )
        expect(status.status).toBe(UserListStatus.ONLINE)
        expect(status.textMatches).toBe(true)
      })

      it('Owner closes community membership tab', async () => {
        await settingsOwner.closeTabThenModal()
      })

      it("First user's message is visible in a channel", async () => {
        await generalChannelUser1.getUserMessages(users.owner.username)
        await generalChannelUser1.getMessageIdsByText(users.user1.messages.initialChannelMessage, users.user1.username)
      })

      it("First user's message is visible in a channel to the owner", async () => {
        await generalChannelUser1.getUserMessages(users.user1.username)
        await generalChannelOwner.getMessageIdsByText(users.user1.messages.initialChannelMessage, users.user1.username)
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

    describe('Qss Log Entry Fanout', () => {
      it('Turns off p2p syncing for owner and first user to test QSS log entry fanout', async () => {
        for (const driver of [users.owner.app.driver, users.user1.app.driver]) {
          const sidebar = new Sidebar(driver)
          const settingsModal = await sidebar.openSettings()
          expect(await settingsModal.isReady()).toBeTruthy()
          await new Promise(resolve => setTimeout(resolve, 200))
          await settingsModal.openDebugTab()
          const p2pToggle = await settingsModal.p2pToggleSwitch()
          let isEnabled: boolean = true
          isEnabled = await settingsModal.p2pToggleSwitchState()
          expect(isEnabled).toBe(true)
          await p2pToggle.click()
          // wait for the toggle to switch state
          for (let attempt = 0; attempt < 10; attempt++) {
            isEnabled = await settingsModal.p2pToggleSwitchState()
            if (!isEnabled) {
              break
            }
            await new Promise(resolve => setTimeout(resolve, 500))
          }
          isEnabled = await settingsModal.p2pToggleSwitchState()
          expect(isEnabled).toBe(false)
          await settingsModal.closeTabThenModal()
        }
      })

      it('Owner sends a message that should fanout via QSS logs', async () => {
        expect(await generalChannelOwner.isMessageInputReady()).toBeTruthy()
        await generalChannelOwner.sendMessage(users.owner.messages.fanoutMessage, users.owner.username)
        await generalChannelOwner.getMessageIdsByText(users.owner.messages.fanoutMessage, users.owner.username)
      })
      it("First user sees owner's QSS message", async () => {
        expect(await generalChannelUser1.isReady()).toBeTruthy()
        await generalChannelUser1.getMessageIdsByText(users.owner.messages.fanoutMessage, users.owner.username, 60_000)
      })

      it('turns p2p syncing back on for both users', async () => {
        for (const driver of [users.owner.app.driver, users.user1.app.driver]) {
          const sidebar = new Sidebar(driver)
          const settingsModal = await sidebar.openSettings()
          expect(await settingsModal.isReady()).toBeTruthy()
          await new Promise(resolve => setTimeout(resolve, 200))
          await settingsModal.openDebugTab()
          const p2pToggle = await settingsModal.p2pToggleSwitch()
          let isEnabled: boolean = false
          isEnabled = await settingsModal.p2pToggleSwitchState()
          expect(isEnabled).toBe(false)
          await p2pToggle.click()
          // wait for the toggle to switch state
          for (let attempt = 0; attempt < 5; attempt++) {
            isEnabled = await settingsModal.p2pToggleSwitchState()
            if (isEnabled) {
              break
            }
            await new Promise(resolve => setTimeout(resolve, 500))
          }
          isEnabled = await settingsModal.p2pToggleSwitchState()
          expect(isEnabled).toBe(true)
          await settingsModal.closeTabThenModal()
        }
      })
    })

    describe('Owner Leaves', () => {
      it('Owner goes offline', async () => {
        await users.owner.app.close()
      })

      it(`First user sends a message`, async () => {
        await generalChannelUser1.sendMessage(users.user1.messages.ownerOfflineMessage, users.user1.username)
      })

      it("First user's message is visible in a channel", async () => {
        await generalChannelUser1.getMessageIdsByText(users.user1.messages.ownerOfflineMessage, users.user1.username)
      })

      it('First user opens community membership tab', async () => {
        settingsUser1 = await new Sidebar(users.user1.app.driver).openSettings()
        await settingsUser1.openCommunityMembership(2)
      })

      it('First user sees owner as offline in user list', async () => {
        const status = await settingsUser1.getUserInCommunityMembership(
          users.owner.username,
          UserListStatus.OFFLINE,
          false
        )
        expect(status.status).toBe(UserListStatus.OFFLINE)
        expect(status.textMatches).toBe(true)
      })

      it('First user closes community membership tab', async () => {
        await settingsUser1.closeTabThenModal()
      })
    })

    describe('First User Leaves', () => {
      it('First user goes offline', async () => {
        await users.user1.app.close()
      })
    })

    describe('Second User Joins Using QSS Only', () => {
      it('Second user opens the app', async () => {
        await users.user2.app.openWithRetries(undefined, true)
        const debugModal = new DebugModeModal(users.user2.app.driver)
        await debugModal.close()
      })

      it('Second user starts to join when everyone is offline', async () => {
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

      it('Second user agrees to Terms of Service', async () => {
        const tosModal = new TermsOfServiceModal(users.user2.app.driver)
        expect(await tosModal.isReady()).toBeTruthy()
        await tosModal.chooseAgreeAndJoin()
      })

      it('Second user waits to join', async () => {
        const joinPanel = new JoiningLoadingPanel(users.user2.app.driver)
        await joinPanel.waitForJoinToComplete()
      })

      it('Second user opens community membership tab', async () => {
        settingsUser2 = await new Sidebar(users.user2.app.driver).openSettings()
        await settingsUser2.openCommunityMembership(3)
      })

      it('Second user sees self in user list', async () => {
        const status = await settingsUser2.getUserInCommunityMembership(
          users.user2.username,
          UserListStatus.ONLINE,
          true
        )
        expect(status.status).toBe(UserListStatus.ONLINE)
        expect(status.textMatches).toBe(true)
      })

      it('Second user sees owner as offline in user list', async () => {
        const status = await settingsUser2.getUserInCommunityMembership(
          users.owner.username,
          UserListStatus.OFFLINE,
          false
        )
        expect(status.status).toBe(UserListStatus.OFFLINE)
        expect(status.textMatches).toBe(true)
      })

      it('Second user sees first user as offline in user list', async () => {
        const status = await settingsUser2.getUserInCommunityMembership(
          users.user1.username,
          UserListStatus.OFFLINE,
          false
        )
        expect(status.status).toBe(UserListStatus.OFFLINE)
        expect(status.textMatches).toBe(true)
      })

      it('Second user closes community membership tab', async () => {
        await settingsUser2.closeTabThenModal()
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

      it('Second user can see messages from before they joined', async () => {
        await generalChannelUser2.getAtleastNumUserMessages(users.owner.username, 2)
        await generalChannelUser2.getAtleastNumUserMessages(users.user1.username, 2)
      })

      it('Second user can send a message and is visible', async () => {
        await generalChannelUser2.sendMessage(users.user2.messages.initialChannelMessage, users.user2.username)
        await generalChannelUser2.getMessageIdsByText(users.user2.messages.initialChannelMessage, users.user2.username)
      })
    })

    describe('Owner comes online', () => {
      it('Owner goes back online', async () => {
        await users.owner.app.openWithRetries(undefined, true)
        const debugModal = new DebugModeModal(users.owner.app.driver)
        await debugModal.close()
      })

      it('Owner sees general channel', async () => {
        const app = users.owner.app
        const loadOwner = async () => {
          generalChannelOwner = new Channel(app.driver, generalChannelName)
          expect(await generalChannelOwner.isReady()).toBeTruthy()
          expect(await generalChannelOwner.isOpen()).toBeTruthy()
          expect(await generalChannelOwner.isMessageInputReady()).toBeTruthy()
        }

        const retryConfig = app.retryConfig
        const failureReason = `Failed to load app for ${users.owner.username} within ${retryConfig.timeoutMs}ms`
        const onTimeout = async () => {
          await app.close()
          await app.open()
        }
        await promiseWithRetries(loadOwner(), failureReason, retryConfig, onTimeout)
      })

      it('Second user opens community membership tab', async () => {
        settingsUser2 = await new Sidebar(users.user2.app.driver).openSettings()
        await settingsUser2.openCommunityMembership(3)
      })

      it('Second user sees owner as online in user list', async () => {
        const status = await settingsUser2.getUserInCommunityMembership(
          users.owner.username,
          UserListStatus.ONLINE,
          false
        )
        expect(status.status).toBe(UserListStatus.ONLINE)
        expect(status.textMatches).toBe(true)
      })

      it('Second user closes community membership tab', async () => {
        await settingsUser2.closeTabThenModal()
      })

      it("Second user's first message is visible in a channel for owner", async () => {
        await generalChannelOwner.getMessageIdsByText(
          users.user2.messages.initialChannelMessage,
          users.user2.username,
          60_000
        )
      })

      it(`Second user sends a new message`, async () => {
        await generalChannelUser2.sendMessage(users.user2.messages.followUpMessage, users.user2.username)
      })

      it("Second user's second message is visible in a channel", async () => {
        await generalChannelUser2.getMessageIdsByText(users.user2.messages.followUpMessage, users.user2.username)
      })

      it("Second user's second message is visible in a channel for owner", async () => {
        await generalChannelOwner.getMessageIdsByText(users.user2.messages.followUpMessage, users.user2.username)
      })
    })

    describe('First user Comes Back Online', () => {
      it('First user goes back online', async () => {
        await users.user1.app.openWithRetries(undefined, true)
        const debugModal = new DebugModeModal(users.user1.app.driver)
        await debugModal.close()
      })

      it('First user opens community membership tab', async () => {
        settingsUser1 = await new Sidebar(users.user1.app.driver).openSettings()
        await settingsUser1.openCommunityMembership(3)
      })

      it('First user sees owner as online in user list', async () => {
        const status = await settingsUser1.getUserInCommunityMembership(
          users.owner.username,
          UserListStatus.ONLINE,
          false
        )
        expect(status.status).toBe(UserListStatus.ONLINE)
        expect(status.textMatches).toBe(true)
      })

      it('First user sees second user as online in user list', async () => {
        const status = await settingsUser1.getUserInCommunityMembership(
          users.user2.username,
          UserListStatus.ONLINE,
          false
        )
        expect(status.status).toBe(UserListStatus.ONLINE)
        expect(status.textMatches).toBe(true)
      })

      it('First user closes community membership tab', async () => {
        await settingsUser1.closeTabThenModal()
      })

      it(`First user can see the second user's messages`, async () => {
        generalChannelUser1 = new Channel(users.user1.app.driver, generalChannelName)
        expect(await generalChannelUser1.isReady()).toBeTruthy()
        expect(await generalChannelUser1.isOpen()).toBeTruthy()
        expect(await generalChannelUser1.isMessageInputReady()).toBeTruthy()
        await generalChannelUser1.getMessageIdsByText(
          users.user2.messages.initialChannelMessage,
          users.user2.username,
          120_000
        )
        await generalChannelUser1.getMessageIdsByText(users.user2.messages.followUpMessage, users.user2.username)
      })
    })

    describe('First User goes offline, others talk and go offline, and QSS catches first user up', () => {
      it('First user goes offline', async () => {
        await users.user1.app.close()
      })

      it('Owner sends a message', async () => {
        await generalChannelOwner.isReady()
        await generalChannelOwner.isMessageInputReady()
        await generalChannelOwner.sendMessage(users.owner.messages.catchUpMessage, users.owner.username)
      })

      it('Second user sends a message', async () => {
        await generalChannelUser2.isReady()
        await generalChannelUser2.isMessageInputReady()
        await generalChannelUser2.sendMessage(users.user2.messages.catchUpMessage, users.user2.username)
      })

      it("Owner's message is visible in a channel", async () => {
        await generalChannelOwner.getMessageIdsByText(users.owner.messages.catchUpMessage, users.owner.username)
      })

      it('Second user sees owner message', async () => {
        await generalChannelUser2.getMessageIdsByText(users.owner.messages.catchUpMessage, users.owner.username, 60_000)
      })

      it('Owner sees second user message', async () => {
        await generalChannelOwner.getMessageIdsByText(users.user2.messages.catchUpMessage, users.user2.username, 60_000)
      })

      it('Second user goes offline', async () => {
        await users.user2.app.close()
      })

      it('Owner goes offline', async () => {
        await users.owner.app.close()
      })

      it('First user comes back online', async () => {
        await users.user1.app.open(true)
      })

      it('First user sees both messages sent while offline via QSS', async () => {
        generalChannelUser1 = new Channel(users.user1.app.driver, generalChannelName)
        expect(await generalChannelUser1.isReady()).toBeTruthy()
        expect(await generalChannelUser1.isOpen()).toBeTruthy()
        expect(await generalChannelUser1.isMessageInputReady()).toBeTruthy()
        await generalChannelUser1.getMessageIdsByText(
          users.owner.messages.catchUpMessage,
          users.owner.username,
          120_000
        )
        await generalChannelUser1.getMessageIdsByText(
          users.user2.messages.catchUpMessage,
          users.user2.username,
          120_000
        )
      })
    })
  })
})
