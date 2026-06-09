import { jest } from '@jest/globals'

import {
  App,
  Channel,
  ChannelContextMenu,
  CreateCommunityModal,
  DebugModeModal,
  JoinCommunityModal,
  JoiningLoadingPanel,
  RegisterUsernameModal,
  ServerOfferModal,
  Settings,
  Sidebar,
  TermsOfServiceModal,
} from '../selectors'
import { promiseWithRetries, sleep, tailQssLogs } from '../utils'
import { DEFAULT_ADD_NEW_CHANNEL_PRIVATE_OPTIONS, UserListStatus, UserTestData2, UserTestDataMap } from '../types'
import { createLogger } from '../logger'
import { SettingsModalTabName } from '../enums'
import { ChildProcess } from 'child_process'

const logger = createLogger('multipleClients:privateChannels:qss')

jest.setTimeout(1200000) // 20 minutes
describe('Multiple Clients (QSS - Private Channels)', () => {
  let generalChannelOwner: Channel
  let generalChannelUser1: Channel
  let generalChannelUser2: Channel

  let privateChannelOwner: Channel
  let privateChannelUser1: Channel
  let privateChannel2Owner: Channel
  let privateChannel2User1: Channel

  let channelContextMenuOwner: ChannelContextMenu

  let invitationLink: string

  let sidebarOwner: Sidebar
  let sidebarUser1: Sidebar
  let sidebarUser2: Sidebar

  let settingsOwner: Settings
  let settingsUser1: Settings
  let settingsUser2: Settings

  let qssLogTailProcess: ChildProcess

  const communityName = 'testcommunity'
  const privateChannelName = 'private-chat'
  const privateChannel2Name = 'second-private-chat'
  const generalChannelName = 'general'

  type Usernames = 'owner' | 'user1' | 'user2'
  type ChannelNames = 'private' | 'secondPrivate' | 'general'
  let users: UserTestDataMap<Usernames, UserTestData2<ChannelNames, string[]>>

  beforeAll(async () => {
    qssLogTailProcess = tailQssLogs()

    users = {
      owner: {
        username: 'owner',
        app: new App({ username: 'owner' }),
        messages: {
          general: ['Hi'],
          private: ['Only I can see this', `I'm still the only one who can see this`],
          secondPrivate: [`New private channel only I can see`, `The second user can now see this`],
        },
      },
      user1: {
        username: 'user-1',
        app: new App({ username: 'user-1' }),
        messages: {
          general: ['Nice to meet you all'],
          private: ['I can see the private channel now'],
          secondPrivate: [],
        },
      },
      user2: {
        username: 'user-2',
        app: new App({ username: 'user-2' }),
        messages: {
          general: [`I'm here too`],
          private: [],
          secondPrivate: [],
        },
      },
    }
  })

  afterAll(async () => {
    qssLogTailProcess.kill()
    for (const user of Object.values(users)) {
      try {
        await user.app.close()
        await user.app.cleanup()
      } catch (e) {
        logger.error('Failed to close and cleanup app data', e)
      }
    }
  })

  beforeEach(async () => {
    logger.info(`░░░ ${expect.getState().currentTestName}`)
  })

  describe('Stages:', () => {
    describe('Owner Creates Community With QSS', () => {
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
        sidebarOwner = new Sidebar(users.owner.app.driver)
        await sidebarOwner.getChannelIcon(generalChannelName, true)

        const generalChannelText = await generalChannelOwner.element.getText()
        expect(generalChannelText).toEqual('general')
        await sleep(10_000)
      })

      it.skip('Owner opens community membership tab', async () => {
        settingsOwner = await new Sidebar(users.owner.app.driver).openSettings()
        expect(await settingsOwner.isReady()).toBeTruthy()
        await settingsOwner.openCommunityMembership(1)
      })

      it.skip('Owner sees self in user list', async () => {
        const ownStatus = await settingsOwner.getUserInCommunityMembership(
          users.owner.username,
          UserListStatus.ONLINE,
          true
        )
        expect(ownStatus.status).toBe(UserListStatus.ONLINE)
        expect(ownStatus.textMatches).toBe(true)
      })

      it.skip('Owner closes community membership tab', async () => {
        await settingsOwner.closeTabThenModal()
      })
    })

    describe('Owner Sends a Message in General', () => {
      it('Owner sends a message in general channel', async () => {
        expect(await generalChannelOwner.isMessageInputReady()).toBeTruthy()
        await generalChannelOwner.sendMessage(users.owner.messages.general[0], users.owner.username)
      })

      it("Owner's message is visible in general channel", async () => {
        await generalChannelOwner.getUserMessages(users.owner.username)
        await generalChannelOwner.getMessageIdsByText(users.owner.messages.general[0], users.owner.username)
      })
    })

    describe('Creating Private Channel Before User Joins', () => {
      describe('Owner Creates a Private Channel', () => {
        it('Owner creates a private channel', async () => {
          const { channel, errors } = await sidebarOwner.addNewChannel(
            privateChannelName,
            DEFAULT_ADD_NEW_CHANNEL_PRIVATE_OPTIONS
          )
          expect(channel).toBeDefined()
          expect(errors).toBeUndefined()
          await sidebarOwner.waitForChannelsNum(2)
          const channels = await sidebarOwner.getChannelsNames()
          expect(channels).toContain(privateChannelName)
          await sidebarOwner.switchChannel(privateChannelName, false)
          await sidebarOwner.getChannelIcon(privateChannelName, false)
        })

        it('Owner sends message in private channel', async () => {
          privateChannelOwner = new Channel(users.owner.app.driver, privateChannelName)
          expect(await privateChannelOwner.isReady()).toBeTruthy()
          expect(await privateChannelOwner.isMessageInputReady()).toBeTruthy()
          await privateChannelOwner.sendMessage(users.owner.messages.private[0], users.owner.username)
        })

        it("Owner's message is visible in private channel", async () => {
          await privateChannelOwner.getUserMessages(users.owner.username)
          await privateChannelOwner.getMessageIdsByText(users.owner.messages.private[0], users.owner.username)
        })
      })

      describe('Owner Creates Invite', () => {
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

      describe('First User Joins Community While Owner Online', () => {
        it('First user opens the app', async () => {
          await users.user1.app.open(true)
          const debugModal = new DebugModeModal(users.user1.app.driver)
          await debugModal.close()
        })

        it('First user starts to join when owner is online', async () => {
          const app = users.user1.app
          const joinCommunityModal = new JoinCommunityModal(app.driver)
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

        it('First user sees general channel', async () => {
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
        })

        it.skip('First user opens community membership tab', async () => {
          settingsUser1 = await new Sidebar(users.user1.app.driver).openSettings()
          expect(await settingsUser1.isReady()).toBeTruthy()
          await settingsUser1.openCommunityMembership(2)
        })

        it.skip('First user sees self in user list', async () => {
          const ownStatus = await settingsUser1.getUserInCommunityMembership(
            users.user1.username,
            UserListStatus.ONLINE,
            true
          )
          expect(ownStatus.status).toBe(UserListStatus.ONLINE)
          expect(ownStatus.textMatches).toBe(true)
        })

        it.skip('First user sees owner in user list', async () => {
          const status = await settingsUser1.getUserInCommunityMembership(
            users.owner.username,
            UserListStatus.ONLINE,
            false
          )
          expect(status.status).toBe(UserListStatus.ONLINE)
          expect(status.textMatches).toBe(true)
        })

        it.skip('First user closes community membership tab', async () => {
          await settingsUser1.closeTabThenModal()
        })

        it.skip('Owner opens community membership tab', async () => {
          settingsOwner = await new Sidebar(users.owner.app.driver).openSettings()
          expect(await settingsOwner.isReady()).toBeTruthy()
          await settingsOwner.openCommunityMembership(2)
        })

        it.skip('Owner sees first user in user list', async () => {
          const ownStatus = await settingsOwner.getUserInCommunityMembership(
            users.user1.username,
            UserListStatus.ONLINE,
            false
          )
          expect(ownStatus.status).toBe(UserListStatus.ONLINE)
          expect(ownStatus.textMatches).toBe(true)
        })

        it.skip('Owner closes community membership tab', async () => {
          await settingsOwner.closeTabThenModal()
        })

        it("Owner's message is visible in general channel to user", async () => {
          await generalChannelUser1.getUserMessages(users.owner.username)
          await generalChannelUser1.getMessageIdsByText(users.owner.messages.general[0], users.owner.username)
        })
      })

      describe('First User Sends Message In General', () => {
        it('First user sends message in general', async () => {
          await generalChannelUser1.sendMessage(users.user1.messages.general[0], users.user1.username)
        })

        it("First user's message is visible in general channel to the user", async () => {
          await generalChannelUser1.getUserMessages(users.user1.username)
          await generalChannelUser1.getMessageIdsByText(users.user1.messages.general[0], users.user1.username)
        })

        it("First user's message is visible in general channel to the owner", async () => {
          generalChannelOwner = await sidebarOwner.switchChannel(generalChannelName)
          expect(await generalChannelOwner.isMessageInputReady()).toBeTruthy()

          await generalChannelOwner.getUserMessages(users.user1.username)
          await generalChannelOwner.getMessageIdsByText(users.user1.messages.general[0], users.user1.username)
        })
      })

      describe(`First User Doesn't See Private Channel`, () => {
        it('Owner sends another message in private channel', async () => {
          privateChannelOwner = await sidebarOwner.switchChannel(privateChannelName, false)
          expect(await privateChannelOwner.isReady()).toBeTruthy()
          expect(await privateChannelOwner.isMessageInputReady()).toBeTruthy()
          await privateChannelOwner.sendMessage(users.owner.messages.private[1], users.owner.username)
        })

        it("Owner's message is visible in private channel", async () => {
          await privateChannelOwner.getUserMessages(users.owner.username)
          await privateChannelOwner.getMessageIdsByText(users.owner.messages.private[1], users.owner.username)
        })

        it(`First user's sidebar is missing private channel`, async () => {
          sidebarUser1 = new Sidebar(users.user1.app.driver)
          await sidebarUser1.waitForChannelsNum(1)
          const channels = await sidebarUser1.getChannelsNames()
          expect(channels).not.toContain(privateChannelName)
        })
      })

      describe(`Owner Adds User To Private Channel While User Offline`, () => {
        it('User goes offline', async () => {
          await sleep(5_000)
          await users.user1.app.close()
        })

        it('Owner adds first user to private channel', async () => {
          channelContextMenuOwner = new ChannelContextMenu(users.owner.app.driver)
          const { menuButton, menuOpened, iconVisible } = await channelContextMenuOwner.openMenu()
          await channelContextMenuOwner.openAddMembersModal()
          await channelContextMenuOwner.addMembersToChannel(privateChannelName, [users.user1.username])
          expect(menuButton).toBe(true)
          expect(menuOpened).toBe(true)
          expect(iconVisible).toBe(true)
        })

        it('Owner verifies first user is no longer in autocomplete', async () => {
          const { menuButton, menuOpened, iconVisible } = await channelContextMenuOwner.openMenu()
          await channelContextMenuOwner.openAddMembersModal()
          const membersLeftInAutocomplete = await channelContextMenuOwner.checkForMembersInAddMembersAutocomplete(
            privateChannelName,
            [users.user1.username, users.owner.username]
          )
          expect(membersLeftInAutocomplete.length).toBe(0)
          expect(menuButton).toBe(true)
          expect(menuOpened).toBe(true)
          expect(iconVisible).toBe(true)
        })
      })

      describe('User Sees Private Channel When Owner Offline', () => {
        it('Owner goes offline', async () => {
          await users.owner.app.close()
        })

        it('User goes online', async () => {
          await users.user1.app.openWithRetries(undefined, true)
        })

        it(`First user sees private channel in sidebar`, async () => {
          sidebarUser1 = new Sidebar(users.user1.app.driver)
          await sidebarUser1.waitForChannelsNum(2)
          const channels = await sidebarUser1.getChannelsNames()
          expect(channels).toContain(privateChannelName)
          await sidebarUser1.getChannelIcon(privateChannelName, false)
        })

        it('First user switches to private channel', async () => {
          sidebarUser1 = new Sidebar(users.user1.app.driver)
          await sidebarUser1.switchChannel(privateChannelName, false)
          privateChannelUser1 = new Channel(users.user1.app.driver, privateChannelName)
          expect(await privateChannelUser1.isMessageInputReady()).toBeTruthy()
        })

        it("Owner's messages are visible in private channel for user", async () => {
          await privateChannelUser1.getUserMessages(users.owner.username)
          await privateChannelUser1.getMessageIdsByText(users.owner.messages.private[0], users.owner.username)
          await privateChannelUser1.getMessageIdsByText(users.owner.messages.private[1], users.owner.username)
        })
      })

      describe(`User Sends Message In Private Channel`, () => {
        it('Owner goes online', async () => {
          await users.owner.app.openWithRetries(undefined, true)
        })

        it('User sends message in private channel', async () => {
          await privateChannelUser1.sendMessage(users.user1.messages.private[0], users.user1.username)
        })

        it("User's messages are visible in private channel for user", async () => {
          await privateChannelUser1.getUserMessages(users.user1.username)
          await privateChannelUser1.getMessageIdsByText(users.user1.messages.private[0], users.user1.username)
        })

        it("User's messages are visible in private channel for owner", async () => {
          sidebarOwner = new Sidebar(users.owner.app.driver)
          privateChannelOwner = await sidebarOwner.switchChannel(privateChannelName, false)
          await privateChannelOwner.getUserMessages(users.user1.username)
          await privateChannelOwner.getMessageIdsByText(users.user1.messages.private[0], users.user1.username)
        })
      })
    })

    describe('Creating Private Channel After User Joins', () => {
      describe('Owner Creates Another Private Channel', () => {
        it('Owner creates a second private channel', async () => {
          sidebarOwner = new Sidebar(users.owner.app.driver)
          const { channel, errors } = await sidebarOwner.addNewChannel(
            privateChannel2Name,
            DEFAULT_ADD_NEW_CHANNEL_PRIVATE_OPTIONS
          )
          expect(channel).toBeDefined()
          expect(errors).toBeUndefined()
          await sidebarOwner.waitForChannelsNum(3)
          const channels = await sidebarOwner.getChannelsNames()
          expect(channels).toContain(privateChannel2Name)
          await sidebarOwner.switchChannel(privateChannel2Name, false)
          await sidebarOwner.getChannelIcon(privateChannel2Name, false)
        })

        it('Owner sends message in second private channel', async () => {
          privateChannel2Owner = new Channel(users.owner.app.driver, privateChannel2Name)
          expect(await privateChannel2Owner.isReady()).toBeTruthy()
          expect(await privateChannel2Owner.isMessageInputReady()).toBeTruthy()
          await privateChannel2Owner.sendMessage(users.owner.messages.secondPrivate[0], users.owner.username)
        })

        it("Owner's message is visible in second private channel", async () => {
          await privateChannel2Owner.getUserMessages(users.owner.username)
          await privateChannel2Owner.getMessageIdsByText(users.owner.messages.secondPrivate[0], users.owner.username)
        })
      })

      describe(`Owner Adds User To Second Private Channel`, () => {
        it(`First user's sidebar is missing private channel`, async () => {
          sidebarUser1 = new Sidebar(users.user1.app.driver)
          await sidebarUser1.waitForChannelsNum(2)
        })

        it('Owner adds first user to second private channel', async () => {
          channelContextMenuOwner = new ChannelContextMenu(users.owner.app.driver)
          const { menuButton, menuOpened, iconVisible } = await channelContextMenuOwner.openMenu()
          await channelContextMenuOwner.openAddMembersModal()
          await channelContextMenuOwner.addMembersToChannel(privateChannel2Name, [users.user1.username])
          expect(menuButton).toBe(true)
          expect(menuOpened).toBe(true)
          expect(iconVisible).toBe(true)
        })

        it(`First user sees second private channel in sidebar`, async () => {
          sidebarUser1 = new Sidebar(users.user1.app.driver)
          await sidebarUser1.waitForChannelsNum(3)
          const channels = await sidebarUser1.getChannelsNames()
          expect(channels).toContain(privateChannel2Name)
          await sidebarUser1.getChannelIcon(privateChannel2Name, false)
        })

        it('First user switches to second private channel', async () => {
          sidebarUser1 = new Sidebar(users.user1.app.driver)
          await sidebarUser1.switchChannel(privateChannel2Name, false)
          privateChannel2User1 = new Channel(users.user1.app.driver, privateChannel2Name)
          expect(await privateChannel2User1.isMessageInputReady()).toBeTruthy()
        })

        it("Owner's messages are visible in second private channel for user", async () => {
          await privateChannel2User1.getUserMessages(users.owner.username)
          await privateChannel2User1.getMessageIdsByText(users.owner.messages.secondPrivate[0], users.owner.username)
        })
      })

      describe(`Owner Sends Another Message To Second Private Channel`, () => {
        it('Owner sends message in second private channel after user joins', async () => {
          privateChannel2Owner = new Channel(users.owner.app.driver, privateChannel2Name)
          expect(await privateChannel2Owner.isReady()).toBeTruthy()
          expect(await privateChannel2Owner.isMessageInputReady()).toBeTruthy()
          await privateChannel2Owner.sendMessage(users.owner.messages.secondPrivate[1], users.owner.username)
        })

        it("Owner's message is visible in second private channel to owner", async () => {
          await privateChannel2Owner.getUserMessages(users.owner.username)
          await privateChannel2Owner.getMessageIdsByText(users.owner.messages.secondPrivate[1], users.owner.username)
        })

        it("Owner's message is visible in second private channel to user", async () => {
          await privateChannel2User1.getUserMessages(users.owner.username)
          await privateChannel2User1.getMessageIdsByText(users.owner.messages.secondPrivate[1], users.owner.username)
        })
      })
    })

    describe('Second User Joins Using QSS Only', () => {
      describe('User and Owner Go Offline Before Second User Joins', () => {
        it('First user goes offline', async () => {
          await users.user1.app.close()
        })

        describe('Owner Creates Invite And Goes Offline', () => {
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

          it('Owner goes offline', async () => {
            await users.owner.app.close()
          })
        })
      })

      describe('Second User Joins', () => {
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
          await generalChannelUser2.getAtleastNumUserMessages(users.owner.username, users.owner.messages.general.length)
          await generalChannelUser2.getAtleastNumUserMessages(users.user1.username, users.user1.messages.general.length)
        })

        it(`Second user sees only general in sidebar`, async () => {
          sidebarUser2 = new Sidebar(users.user2.app.driver)
          await sidebarUser2.waitForChannelsNum(1)
          const channels = await sidebarUser2.getChannelsNames()
          expect(channels.length).toBe(1)
          expect(channels).toContain(generalChannelName)
        })

        it.skip('Second user opens community membership', async () => {
          settingsUser2 = await new Sidebar(users.user2.app.driver).openSettings()
          expect(await settingsUser2.isReady()).toBeTruthy()
          await settingsUser2.openCommunityMembership(3)
        })

        it.skip('Second user sees self in user list', async () => {
          const ownStatus = await settingsUser2.getUserInCommunityMembership(
            users.user2.username,
            UserListStatus.ONLINE,
            true
          )
          expect(ownStatus.status).toBe(UserListStatus.ONLINE)
          expect(ownStatus.textMatches).toBe(true)
        })

        it.skip('Second user sees user in user list', async () => {
          const status = await settingsUser2.getUserInCommunityMembership(
            users.user1.username,
            UserListStatus.OFFLINE,
            false
          )
          expect(status.status).toBe(UserListStatus.OFFLINE)
          expect(status.textMatches).toBe(true)
        })

        it.skip('Second user sees owner in user list', async () => {
          const status = await settingsUser2.getUserInCommunityMembership(
            users.owner.username,
            UserListStatus.OFFLINE,
            false
          )
          expect(status.status).toBe(UserListStatus.OFFLINE)
          expect(status.textMatches).toBe(true)
        })

        it.skip('Second user closes community membership tab', async () => {
          await settingsUser2.closeTabThenModal()
        })
      })
    })
  })
})
