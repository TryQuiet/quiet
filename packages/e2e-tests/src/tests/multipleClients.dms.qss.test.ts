import { jest } from '@jest/globals'
import * as path from 'path'

import {
  App,
  Channel,
  ChannelContextMenu,
  CreateCommunityModal,
  DebugModeModal,
  JoinCommunityModal,
  JoiningLoadingPanel,
  NewMessage,
  RegisterUsernameModal,
  ServerOfferModal,
  Settings,
  Sidebar,
  TermsOfServiceModal,
} from '../selectors'
import { createArbitraryFile, promiseWithRetries, sleep } from '../utils'
import { MessageIds, TestChannelType, UserListStatus, UserTestData, UserTestData2, UserTestDataMap } from '../types'
import { createLogger } from '../logger'
import { FileAttachmentType, SettingsModalTabName } from '../enums'
import {
  BIG_FILE_SIZE,
  TEST_BIG_FILE_NAME,
  TEST_FILE_NAME,
  TEST_IMAGE_FILE_NAME,
  UPLOAD_FILE_DIR,
} from '../attachFile.const'

const logger = createLogger('multipleClients:dms')

jest.setTimeout(1200000) // 20 minutes
describe('Multiple Clients (DMs)', () => {
  let generalChannelOwner: Channel
  let generalChannelUser1: Channel
  let generalChannelUser2: Channel

  let selfDmChannelOwner: Channel
  let oneOnOneChannelOwner: Channel
  let oneOnOneChannelUser1: Channel
  let groupDmChannelOwner: Channel
  let groupDmChannelUser1: Channel
  let groupDmChannelUser2: Channel
  let channelContextMenuOwner: ChannelContextMenu

  let invitationLink: string

  let sidebarOwner: Sidebar
  let sidebarUser1: Sidebar
  let sidebarUser2: Sidebar

  let settingsOwner: Settings
  let settingsUser1: Settings
  let settingsUser2: Settings

  let newMessageOwner: NewMessage
  let newMessageUser1: NewMessage
  let newMessageUser2: NewMessage

  const communityName = 'testcommunity'
  const displayedCommunityName = 'Testcommunity'
  const generalChannelName = 'general'

  type Usernames = 'owner' | 'user1' | 'user2'
  type ChannelNames = 'selfDm' | 'oneOnOne' | 'groupDm' | 'general'
  let users: UserTestDataMap<Usernames, UserTestData2<ChannelNames, string[]>>
  let channelNameMap: Record<Usernames, Record<ChannelNames, string>>

  beforeAll(async () => {
    users = {
      owner: {
        username: 'owner',
        app: new App({ username: 'owner' }),
        messages: {
          general: ['Hi'],
          selfDm: ['Only I can see this', `I'm still the only one who can see this`],
          oneOnOne: [`I'm talking to just you`],
          groupDm: [`Multiple people can see this`, `I sent this from the new message form!`],
        },
      },
      user1: {
        username: 'user-1',
        app: new App({ username: 'user-1' }),
        messages: {
          general: ['Hello'],
          selfDm: [],
          oneOnOne: [`This is between us`],
          groupDm: [`Hey everyone`],
        },
      },
      user2: {
        username: 'user-2',
        app: new App({ username: 'user-2' }),
        messages: {
          general: [`I'm here too`],
          selfDm: [],
          oneOnOne: [],
          groupDm: [`We're all here!`],
        },
      },
    }

    channelNameMap = {
      owner: {
        general: generalChannelName,
        selfDm: users.owner.username,
        oneOnOne: users.user1.username,
        groupDm: `${users.user1.username}, ${users.user2.username}`,
      },
      user1: {
        general: generalChannelName,
        selfDm: '',
        oneOnOne: users.owner.username,
        groupDm: `${users.owner.username}, ${users.user2.username}`,
      },
      user2: {
        general: generalChannelName,
        selfDm: '',
        oneOnOne: '',
        groupDm: `${users.owner.username}, ${users.user1.username}`,
      },
    }
  })

  afterAll(async () => {
    for (const user of Object.values(users)) {
      try {
        if (!user.app.isOpened) continue
        await user.app.close()
        // await user.app.cleanup()
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
      it('Owner opens the app', async () => {
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
      })

      it.skip('Owner opens community membership tab', async () => {
        settingsOwner = await new Sidebar(users.owner.app.driver).openSettings()
        expect(await settingsOwner.isReady()).toBeTruthy()
        await settingsOwner.openCommunityMembership(1)
      })

      it.skip('Owner sees self in user list', async () => {
        const status = await settingsOwner.getUserInCommunityMembership(
          users.owner.username,
          UserListStatus.ONLINE,
          true
        )
        expect(status.status).toBe(UserListStatus.ONLINE)
        expect(status.textMatches).toBe(true)
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

    describe('Owner creates DM with self', () => {
      it('Owner opens new message view', async () => {
        newMessageOwner = new NewMessage(users.owner.app.driver)
        await newMessageOwner.open()
      })

      it('Owner creates new DM with self', async () => {
        const dmCreationStatus = await newMessageOwner.createNewDm(
          [users.owner.username],
          users.owner.messages.selfDm[0]
        )
        expect(dmCreationStatus.error).toBeUndefined()
        expect(dmCreationStatus.failedUsers).toHaveLength(0)
        expect(dmCreationStatus.successfulUsers).toHaveLength(1)
        expect(dmCreationStatus.success).toBeTruthy()
      })

      it('Owner sees newly created DM channel', async () => {
        selfDmChannelOwner = new Channel(users.owner.app.driver, channelNameMap.owner.selfDm)
        await selfDmChannelOwner.isOpen(TestChannelType.DM)
        await selfDmChannelOwner.isMessageInputReady()
      })

      it('Owner sees their message in the newly created DM channel', async () => {
        await selfDmChannelOwner.getUserMessages(users.owner.username)
        await selfDmChannelOwner.getMessageIdsByText(users.owner.messages.selfDm[0], users.owner.username)
      })
    })

    describe('Owner invites first user', () => {
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
        logger.info('Second client')
        await users.user1.app.open(true)
      })

      it('First user submits invitation code received from owner', async () => {
        logger.info('new user - 3')
        const joinCommunityModal = new JoinCommunityModal(users.user1.app.driver)
        expect(await joinCommunityModal.isReady()).toBeTruthy()
        logger.info({ invitationLink })
        await joinCommunityModal.typeCommunityInviteLink(invitationLink)
        await joinCommunityModal.submit()
      })

      it('First user submits valid username', async () => {
        const app = users.user1.app
        logger.info('new user - 5')
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
        logger.info('new user - 7')
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
        await generalChannelUser1.sendMessage(users.user1.messages.general[0], users.user1.username)
      })

      it("First user sees owner's message in channel", async () => {
        await generalChannelUser1.getUserMessages(users.owner.username)
        await generalChannelUser1.getMessageIdsByText(users.owner.messages.general[0], users.owner.username)
      })

      it("First user's message is visible in a channel", async () => {
        await generalChannelUser1.getUserMessages(users.user1.username)
        await generalChannelUser1.getMessageIdsByText(users.user1.messages.general[0], users.user1.username)
      })

      it("First user's message is visible in a channel to the owner", async () => {
        generalChannelOwner = await sidebarOwner.switchChannel(generalChannelName)
        await generalChannelOwner.getUserMessages(users.user1.username)
        await generalChannelOwner.getMessageIdsByText(users.user1.messages.general[0], users.user1.username)
      })
    })

    describe('First user creates DM with owner', () => {
      it('First user opens new message view', async () => {
        newMessageUser1 = new NewMessage(users.user1.app.driver)
        await newMessageUser1.open()
      })

      it('First user creates new DM with owner', async () => {
        const dmCreationStatus = await newMessageUser1.createNewDm(
          [users.owner.username],
          users.user1.messages.oneOnOne[0]
        )
        expect(dmCreationStatus.error).toBeUndefined()
        expect(dmCreationStatus.failedUsers).toHaveLength(0)
        expect(dmCreationStatus.successfulUsers).toHaveLength(1)
        expect(dmCreationStatus.success).toBeTruthy()
      })

      it('First user sees newly created DM channel', async () => {
        oneOnOneChannelUser1 = new Channel(users.user1.app.driver, channelNameMap.user1.oneOnOne)
        await oneOnOneChannelUser1.isOpen(TestChannelType.DM)
        await oneOnOneChannelUser1.isMessageInputReady()
      })

      it('First user sees their message in the newly created DM channel', async () => {
        await oneOnOneChannelUser1.getUserMessages(users.user1.username)
        await oneOnOneChannelUser1.getMessageIdsByText(users.user1.messages.oneOnOne[0], users.user1.username)
      })

      it('Owner sees new DM in sidebar', async () => {
        sidebarOwner = new Sidebar(users.owner.app.driver)
        await sidebarOwner.waitForDmChannelsNum(2, 45_000)
        await sidebarOwner.waitForDmChannels([channelNameMap.owner.oneOnOne])
      })

      it('Owner opens new DM channel', async () => {
        oneOnOneChannelOwner = await sidebarOwner.switchDm(channelNameMap.owner.oneOnOne)
        await oneOnOneChannelOwner.isOpen(TestChannelType.DM)
        await oneOnOneChannelOwner.isMessageInputReady()
      })

      it(`Owner sees first user's message in the newly created DM channel`, async () => {
        await oneOnOneChannelOwner.getUserMessages(users.user1.username)
        await oneOnOneChannelOwner.getMessageIdsByText(users.user1.messages.oneOnOne[0], users.user1.username)
      })

      it('Owner sends message in new DM channel', async () => {
        await oneOnOneChannelOwner.sendMessage(users.owner.messages.oneOnOne[0], users.owner.username)
      })

      it('Owner sees their message in the newly created DM channel', async () => {
        await oneOnOneChannelOwner.getUserMessages(users.owner.username)
        await oneOnOneChannelOwner.getMessageIdsByText(users.owner.messages.oneOnOne[0], users.owner.username)
      })

      it(`First user sees owner's message in the newly created DM channel`, async () => {
        await oneOnOneChannelUser1.getUserMessages(users.owner.username)
        await oneOnOneChannelUser1.getMessageIdsByText(users.owner.messages.oneOnOne[0], users.owner.username)
      })
    })

    describe('Owner invites second user while everyone offline', () => {
      it('Owner opens the settings tab and gets an updated invitation link', async () => {
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

      it('First user goes offline', async () => {
        await users.user1.app.close({ forceSaveState: true })
      })

      it('Owner goes offline', async () => {
        await users.owner.app.close({ forceSaveState: true })
      })
    })

    describe('Second User Joins Community With Other Users Offline', () => {
      it('Second user opens the app', async () => {
        logger.info('Third client')
        await users.user2.app.open(true)
      })

      it('Second user submits invitation code received from owner', async () => {
        const joinCommunityModal = new JoinCommunityModal(users.user2.app.driver)
        expect(await joinCommunityModal.isReady()).toBeTruthy()
        await joinCommunityModal.typeCommunityInviteLink(invitationLink)
        await joinCommunityModal.submit()
      })

      it('Second user submits valid username', async () => {
        const app = users.user2.app
        logger.info('new user - 5')
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

      it('Second user joins successfully sees general channel and sends a message', async () => {
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
        await generalChannelUser2.sendMessage(users.user2.messages.general[0], users.user2.username)
      })

      it("Second user's message is visible in a channel", async () => {
        await generalChannelUser2.getUserMessages(users.user2.username)
        await generalChannelUser2.getMessageIdsByText(users.user2.messages.general[0], users.user2.username)
      })

      it("Second user sees owner's message in channel", async () => {
        await generalChannelUser2.getUserMessages(users.owner.username)
        await generalChannelUser2.getMessageIdsByText(users.owner.messages.general[0], users.owner.username)
      })

      it("Second user sees first user's message in channel", async () => {
        await generalChannelUser2.getUserMessages(users.user1.username)
        await generalChannelUser2.getMessageIdsByText(users.user1.messages.general[0], users.user1.username)
      })
    })

    describe('Second user creates group DM', () => {
      it('Second user opens new message view', async () => {
        newMessageUser2 = new NewMessage(users.user2.app.driver)
        await newMessageUser2.open()
      })

      it('Second user creates new group DM', async () => {
        const dmCreationStatus = await newMessageUser2.createNewDm(
          [users.owner.username, users.user1.username],
          users.user2.messages.groupDm[0]
        )
        expect(dmCreationStatus.error).toBeUndefined()
        expect(dmCreationStatus.failedUsers).toHaveLength(0)
        expect(dmCreationStatus.successfulUsers).toHaveLength(2)
        expect(dmCreationStatus.success).toBeTruthy()
      })

      it('Second user sees group DM channel in sidebar', async () => {
        sidebarUser2 = new Sidebar(users.user2.app.driver)
        expect(await sidebarUser2.waitForDmChannelsNum(1)).toBeTruthy()
        await sidebarUser2.waitForDmChannels([channelNameMap.user2.groupDm])
      })

      it('Second user sees newly created group DM channel', async () => {
        groupDmChannelUser2 = new Channel(users.user2.app.driver, channelNameMap.user2.groupDm)
        await groupDmChannelUser2.isOpen(TestChannelType.DM)
        await groupDmChannelUser2.isMessageInputReady()
      })

      it('Second user sees their message in the newly created DM channel', async () => {
        await groupDmChannelUser2.getUserMessages(users.user2.username)
        await groupDmChannelUser2.getMessageIdsByText(users.user2.messages.groupDm[0], users.user2.username)
      })
    })

    describe('Second User Goes Offline and Other Users Come Back', () => {
      it('Second user goes offline', async () => {
        await sleep(15_000)
        await users.user2.app.close({ forceSaveState: true })
      })

      it('Owner goes back online', async () => {
        await users.owner.app.open(true)
        const debugModal = new DebugModeModal(users.owner.app.driver)
        await debugModal.close()
      })

      it('Owner sees general channel', async () => {
        const app = users.owner.app
        const loadOwner = async () => {
          generalChannelOwner = new Channel(app.driver, generalChannelName)
          expect(await generalChannelOwner.isReady()).toBeTruthy()
          sidebarOwner = new Sidebar(app.driver)
          await sidebarOwner.switchChannel(generalChannelName)
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

      it("Second user's message is visible in general channel for owner", async () => {
        generalChannelOwner = new Channel(users.owner.app.driver, generalChannelName)
        await generalChannelOwner.getUserMessages(users.user2.username)
        await generalChannelOwner.getMessageIdsByText(users.user2.messages.general[0], users.user2.username)
      })

      it('First user goes back online', async () => {
        await users.user1.app.open(true)
        const debugModal = new DebugModeModal(users.user1.app.driver)
        await debugModal.close()
      })

      it('First user sees general channel', async () => {
        const app = users.user1.app
        const loadUser = async () => {
          generalChannelUser1 = new Channel(app.driver, generalChannelName)
          expect(await generalChannelUser1.isReady()).toBeTruthy()
          expect(await generalChannelUser1.isOpen()).toBeTruthy()
          expect(await generalChannelUser1.isMessageInputReady()).toBeTruthy()
        }

        const retryConfig = app.retryConfig
        const failureReason = `Failed to load app for ${users.user1.username} within ${retryConfig.timeoutMs}ms`
        const onTimeout = async () => {
          await app.close()
          await app.open()
        }
        await promiseWithRetries(loadUser(), failureReason, retryConfig, onTimeout)
      })

      it("Second user's message is visible in general channel for first user", async () => {
        generalChannelUser1 = new Channel(users.user1.app.driver, generalChannelName)
        await generalChannelUser1.getUserMessages(users.user2.username)
        await generalChannelUser1.getMessageIdsByText(users.user2.messages.general[0], users.user2.username)
      })
    })

    describe('Owner And First User See Group DM', () => {
      it('Owner sees group DM in sidebar', async () => {
        sidebarOwner = new Sidebar(users.owner.app.driver)
        await sidebarOwner.waitForDmChannelsNum(3, 45_000)
        await sidebarOwner.waitForDmChannels([channelNameMap.owner.groupDm])
      })

      it('Owner opens group DM channel', async () => {
        groupDmChannelOwner = await sidebarOwner.switchDm(channelNameMap.owner.groupDm)
        await groupDmChannelOwner.isOpen(TestChannelType.DM)
        await groupDmChannelOwner.isMessageInputReady()
      })

      it(`Owner sees second user's message in the group DM channel`, async () => {
        await groupDmChannelOwner.getUserMessages(users.user2.username)
        await groupDmChannelOwner.getMessageIdsByText(users.user2.messages.groupDm[0], users.user2.username)
      })

      it('Owner sends message in group DM channel', async () => {
        await groupDmChannelOwner.sendMessage(users.owner.messages.groupDm[0], users.owner.username)
      })

      it('Owner sees their message in the group DM channel', async () => {
        await groupDmChannelOwner.getUserMessages(users.owner.username)
        await groupDmChannelOwner.getMessageIdsByText(users.owner.messages.groupDm[0], users.owner.username)
      })

      it('First user sees group DM in sidebar', async () => {
        sidebarUser1 = new Sidebar(users.user1.app.driver)
        await sidebarUser1.waitForDmChannelsNum(2, 45_000)
        await sidebarUser1.waitForDmChannels([channelNameMap.user1.groupDm])
      })

      it('First user opens group DM channel', async () => {
        groupDmChannelUser1 = await sidebarUser1.switchDm(channelNameMap.user1.groupDm)
        await groupDmChannelUser1.isOpen(TestChannelType.DM)
        await groupDmChannelUser1.isMessageInputReady()
      })

      it(`First user sees second user's message in the group DM channel`, async () => {
        await groupDmChannelUser1.getUserMessages(users.user2.username)
        await groupDmChannelUser1.getMessageIdsByText(users.user2.messages.groupDm[0], users.user2.username)
      })

      it(`First user sees owner's message in the group DM channel`, async () => {
        await groupDmChannelUser1.getUserMessages(users.owner.username)
        await groupDmChannelUser1.getMessageIdsByText(users.owner.messages.groupDm[0], users.owner.username)
      })

      it('First user sends message in group DM channel', async () => {
        await groupDmChannelUser1.sendMessage(users.user1.messages.groupDm[0], users.user1.username)
      })

      it('First user sees their message in the group DM channel', async () => {
        await groupDmChannelUser1.getUserMessages(users.user1.username)
        await groupDmChannelUser1.getMessageIdsByText(users.user1.messages.groupDm[0], users.user1.username)
      })

      it(`Owner sees first user's message in the group DM channel`, async () => {
        await groupDmChannelOwner.getUserMessages(users.user1.username)
        await groupDmChannelOwner.getMessageIdsByText(users.user1.messages.groupDm[0], users.user1.username)
      })
    })

    describe('Second User Comes Back Online', () => {
      it('Second user goes back online', async () => {
        await users.user2.app.openWithRetries(undefined, true)
        const debugModal = new DebugModeModal(users.user2.app.driver)
        await debugModal.close()
      })

      it('Second user sees general channel', async () => {
        const app = users.user2.app
        const loadUser = async () => {
          generalChannelUser2 = new Channel(app.driver, generalChannelName)
          expect(await generalChannelUser2.isReady()).toBeTruthy()
          expect(await generalChannelUser2.isOpen()).toBeTruthy()
          expect(await generalChannelUser2.isMessageInputReady()).toBeTruthy()
        }

        const retryConfig = app.retryConfig
        const failureReason = `Failed to load app for ${users.user2.username} within ${retryConfig.timeoutMs}ms`
        const onTimeout = async () => {
          await app.close()
          await app.open()
        }
        await promiseWithRetries(loadUser(), failureReason, retryConfig, onTimeout)
      })

      describe('Second User Sees New Messages In Group DM', () => {
        it('Second user sees group DM in sidebar', async () => {
          sidebarUser2 = new Sidebar(users.user2.app.driver)
          await sidebarUser2.waitForDmChannelsNum(1, 45_000)
          await sidebarUser2.waitForDmChannels([channelNameMap.user2.groupDm])
        })

        it('Second user opens group DM channel', async () => {
          groupDmChannelUser2 = await sidebarUser2.switchDm(channelNameMap.user2.groupDm)
          await groupDmChannelUser2.isOpen(TestChannelType.DM)
          await groupDmChannelUser2.isMessageInputReady()
        })

        it(`Second user sees owner's message in the group DM channel`, async () => {
          await groupDmChannelUser2.getUserMessages(users.owner.username)
          await groupDmChannelUser2.getMessageIdsByText(users.owner.messages.groupDm[0], users.owner.username)
        })

        it(`Second user sees first user's message in the group DM channel`, async () => {
          await groupDmChannelUser2.getUserMessages(users.user1.username)
          await groupDmChannelUser2.getMessageIdsByText(users.user1.messages.groupDm[0], users.user1.username)
        })
      })
    })

    describe('Open existing DM in New Message view', () => {
      it(`Owner opens general`, async () => {
        generalChannelOwner = await sidebarOwner.switchChannel(generalChannelName)
        expect(await generalChannelOwner.isOpen()).toBeTruthy()
        expect(await generalChannelOwner.isReady()).toBeTruthy()
        expect(await generalChannelOwner.isMessageInputReady()).toBeTruthy()
      })

      it('Owner opens new message view', async () => {
        newMessageOwner = new NewMessage(users.owner.app.driver)
        await newMessageOwner.open()
      })

      it('Owner switches new message view to group DM', async () => {
        const dmCreationStatus = await newMessageOwner.changeDmUsers([users.user1.username, users.user2.username])
        expect(dmCreationStatus.failedUsers).toHaveLength(0)
        expect(dmCreationStatus.successfulUsers).toHaveLength(2)
      })

      it(`Owner sees first user's message from group DM in new message view`, async () => {
        await groupDmChannelOwner.getUserMessages(users.user1.username)
        await groupDmChannelOwner.getMessageIdsByText(users.user1.messages.groupDm[0], users.user1.username)
      })
    })

    describe('Close new message view and reopen previous channel', () => {
      it(`Owner closes the new message view`, async () => {
        await newMessageOwner.close()
      })

      it(`Owner sees general (the previous channel)`, async () => {
        expect(await generalChannelOwner.isOpen()).toBeTruthy()
        expect(await generalChannelOwner.isReady()).toBeTruthy()
        expect(await generalChannelOwner.isMessageInputReady()).toBeTruthy()
      })

      it("First user's message is visible in a channel to the owner", async () => {
        await generalChannelOwner.getUserMessages(users.user1.username)
        await generalChannelOwner.getMessageIdsByText(users.user1.messages.general[0], users.user1.username)
      })
    })

    describe('Open existing DM in New Message view and send message', () => {
      it('Owner opens new message view', async () => {
        newMessageOwner = new NewMessage(users.owner.app.driver)
        await newMessageOwner.open()
      })

      it('Owner switches new message view to group DM', async () => {
        const dmCreationStatus = await newMessageOwner.changeDmUsers([users.user1.username, users.user2.username])
        expect(dmCreationStatus.failedUsers).toHaveLength(0)
        expect(dmCreationStatus.successfulUsers).toHaveLength(2)
      })

      it(`Owner sees first user's message from group DM in new message view`, async () => {
        await groupDmChannelOwner.getUserMessages(users.user1.username)
        await groupDmChannelOwner.getMessageIdsByText(users.user1.messages.groupDm[0], users.user1.username)
      })

      it('Owner sends message in group DM channel via new message', async () => {
        await groupDmChannelOwner.sendMessage(users.owner.messages.groupDm[1], users.owner.username)
      })

      it('Owner is now on the channel screen for the group DM', async () => {
        expect(await groupDmChannelOwner.isMessageInputReady()).toBeTruthy()
        expect(await groupDmChannelOwner.isOpen(TestChannelType.DM, false, 30_000)).toBeTruthy()
      })

      it('Owner sees their message in the group DM channel', async () => {
        await groupDmChannelOwner.getUserMessages(users.owner.username)
        await groupDmChannelOwner.getMessageIdsByText(users.owner.messages.groupDm[1], users.owner.username)
      })

      it(`Second user sees owner's second message in the group DM channel`, async () => {
        await groupDmChannelUser2.getUserMessages(users.owner.username)
        await groupDmChannelUser2.getMessageIdsByText(users.owner.messages.groupDm[1], users.owner.username)
      })

      it(`First user sees owner's second message in the group DM channel`, async () => {
        await groupDmChannelUser1.getUserMessages(users.owner.username)
        await groupDmChannelUser1.getMessageIdsByText(users.owner.messages.groupDm[1], users.owner.username)
      })
    })
  })
})
