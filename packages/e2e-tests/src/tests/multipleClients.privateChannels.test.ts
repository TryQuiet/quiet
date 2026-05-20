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
  RegisterUsernameModal,
  Sidebar,
  UsersList,
} from '../selectors'
import { createArbitraryFile, promiseWithRetries } from '../utils'
import { MessageIds, UserListStatus, UserTestData } from '../types'
import { createLogger } from '../logger'
import { FileAttachmentType, SettingsModalTabName } from '../enums'
import {
  BIG_FILE_SIZE,
  TEST_BIG_FILE_NAME,
  TEST_FILE_NAME,
  TEST_IMAGE_FILE_NAME,
  UPLOAD_FILE_DIR,
} from '../attachFile.const'

const logger = createLogger('multipleClients:privateChannels')

jest.setTimeout(1200000) // 20 minutes
describe('Multiple Clients (Private Channels)', () => {
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

  let users: Record<string, UserTestData>

  const communityName = 'testcommunity'
  const displayedCommunityName = 'Testcommunity'
  const privateChannelName = 'private-chat'
  const privateChannel2Name = 'private-chat-2'
  const generalChannelName = 'general'

  beforeAll(async () => {
    users = {
      owner: {
        username: 'owner',
        messages: [
          'Hi',
          'Only I can see this',
          `I'm still the only one who can see this`,
          `New private channel only I can see`,
          `The second user can now see this`,
        ],
        app: new App(),
      },
      user1: {
        username: 'user-1',
        messages: ['Nice to meet you all', 'I can see the private channel now'],
        app: new App(),
      },
      user2: {
        username: 'user-2',
        messages: [],
        app: new App(),
      },
    }
  })

  afterAll(async () => {
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
    logger.info(`░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ ${expect.getState().currentTestName}`)
  })

  describe('Stages:', () => {
    describe('Owner Creates Community', () => {
      it('Owner opens the app', async () => {
        await users.owner.app.openWithRetries()
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
        sidebarOwner = new Sidebar(users.owner.app.driver)
        await sidebarOwner.getChannelIcon(generalChannelName, true)

        const generalChannelText = await generalChannelOwner.element.getText()
        expect(generalChannelText).toEqual('general')
      })
    })

    describe('Owner Sends a Message in General', () => {
      it('Owner sends a message in general channel', async () => {
        expect(await generalChannelOwner.isMessageInputReady()).toBeTruthy()
        await generalChannelOwner.sendMessage(users.owner.messages[0], users.owner.username)
      })

      it("Owner's message is visible in general channel", async () => {
        const messages = await generalChannelOwner.getUserMessages(users.owner.username)
        const text = await messages[1].getText()
        expect(text).toEqual(users.owner.messages[0])
      })
    })

    describe('Creating Private Channel Before User Joins', () => {
      describe('Owner Creates a Private Channel', () => {
        it('Owner creates a private channel', async () => {
          await sidebarOwner.addNewChannel(privateChannelName, false)
          await sidebarOwner.switchChannel(privateChannelName, false)
        })

        it(`Private channel is in owner's sidebar`, async () => {
          const channels = await sidebarOwner.getChannelsNames()
          expect(channels).toContain(privateChannelName)
          await sidebarOwner.getChannelIcon(privateChannelName, false)
        })

        it('Owner sends message in private channel', async () => {
          privateChannelOwner = new Channel(users.owner.app.driver, privateChannelName)
          expect(await privateChannelOwner.isReady()).toBeTruthy()
          expect(await privateChannelOwner.isMessageInputReady()).toBeTruthy()
          await privateChannelOwner.sendMessage(users.owner.messages[1], users.owner.username)
        })

        it("Owner's message is visible in private channel", async () => {
          const messages = await privateChannelOwner.getUserMessages(users.owner.username)
          const text = await messages[1].getText()
          expect(text).toEqual(users.owner.messages[1])
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

      describe('First User Joins Community', () => {
        it('First user opens the app', async () => {
          logger.info('Second client')
          await users.user1.app.openWithRetries()
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

        it('First user waits to join', async () => {
          const joinPanel = new JoiningLoadingPanel(users.user1.app.driver)
          await joinPanel.waitForJoinToComplete()
        })

        it('First user joins successfully and sees general channel', async () => {
          logger.info('new user - 7')
          const app = users.user1.app
          const loadNewUser = async () => {
            generalChannelUser1 = new Channel(app.driver, generalChannelName)
            expect(await generalChannelUser1.isReady()).toBeTruthy()
            expect(await generalChannelUser1.isOpen()).toBeTruthy()
            expect(await generalChannelUser1.isMessageInputReady()).toBeTruthy()
            sidebarUser1 = new Sidebar(users.user1.app.driver)
            await sidebarUser1.getChannelIcon(generalChannelName, true)
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

        it('User sees owner in user list', async () => {
          const userList = new UsersList(users.user1.app.driver)
          expect(await userList.isReady()).toBeTruthy()
          expect(await userList.getUser(users.owner.username, UserListStatus.ONLINE))
        })

        it('Owner sees user in user list', async () => {
          const userList = new UsersList(users.owner.app.driver)
          expect(await userList.isReady()).toBeTruthy()
          expect(await userList.getUser(users.user1.username, UserListStatus.ONLINE))
        })

        it("Owner's message is visible in general channel", async () => {
          await generalChannelUser1.getUserMessages(users.owner.username)
          await generalChannelUser1.getMessageIdsByText(users.owner.messages[0], users.owner.username, 60_000)
        })
      })

      describe('First User Sends Message In General', () => {
        it('First user sends message in general', async () => {
          await generalChannelUser1.sendMessage(users.user1.messages[0], users.user1.username)
        })

        it("First user's message is visible in general channel", async () => {
          await generalChannelUser1.getUserMessages(users.user1.username)
          await generalChannelUser1.getMessageIdsByText(users.user1.messages[0], users.user1.username)
        })

        it("First user's message is visible in general channel to the owner", async () => {
          generalChannelOwner = await sidebarOwner.switchChannel(generalChannelName)
          expect(await generalChannelOwner.isMessageInputReady()).toBeTruthy()

          await generalChannelOwner.getUserMessages(users.user1.username)
          await generalChannelOwner.getMessageIdsByText(users.user1.messages[0], users.user1.username)
        })
      })

      describe(`First User Doesn't See Private Channel`, () => {
        it('Owner sends another message in private channel', async () => {
          privateChannelOwner = await sidebarOwner.switchChannel(privateChannelName, false)
          expect(await privateChannelOwner.isReady()).toBeTruthy()
          expect(await privateChannelOwner.isMessageInputReady()).toBeTruthy()
          await privateChannelOwner.sendMessage(users.owner.messages[2], users.owner.username)
        })

        it("Owner's message is visible in private channel", async () => {
          await privateChannelOwner.getUserMessages(users.owner.username)
          await privateChannelOwner.getMessageIdsByText(users.owner.messages[2], users.owner.username)
        })

        it(`First user's sidebar is missing private channel`, async () => {
          sidebarUser1 = new Sidebar(users.user1.app.driver)
          const channels = await sidebarUser1.getChannelsNames()
          expect(channels.length).toBe(1)
          expect(channels).not.toContain(privateChannelName)
        })
      })

      describe(`Owner Adds User To Private Channel`, () => {
        it('Owner adds first user to private channel', async () => {
          channelContextMenuOwner = new ChannelContextMenu(users.owner.app.driver)
          const { menuButton, menuOpened, iconVisible } = await channelContextMenuOwner.openMenu()
          await channelContextMenuOwner.openAddMembersModal()
          await channelContextMenuOwner.addMembersToChannel(privateChannelName, [users.user1.username])
          expect(menuButton).toBe(true)
          expect(menuOpened).toBe(true)
          expect(iconVisible).toBe(true)
        })

        it(`Private channel is in user's sidebar`, async () => {
          const channels = await sidebarUser1.getChannelsNames()
          expect(channels.length).toBe(2)
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
          await privateChannelUser1.getMessageIdsByText(users.owner.messages[1], users.owner.username)
          await privateChannelUser1.getMessageIdsByText(users.owner.messages[2], users.owner.username)
        })
      })

      describe(`User Sends Message In Private Channel`, () => {
        it('User sends message in private channel', async () => {
          await privateChannelUser1.sendMessage(users.user1.messages[1], users.user1.username)
        })

        it("User's messages are visible in private channel for user", async () => {
          await privateChannelUser1.getUserMessages(users.user1.username)
          await privateChannelUser1.getMessageIdsByText(users.user1.messages[1], users.user1.username)
        })

        it("User's messages are visible in private channel for owner", async () => {
          await privateChannelOwner.getUserMessages(users.user1.username)
          await privateChannelOwner.getMessageIdsByText(users.user1.messages[1], users.user1.username)
        })
      })
    })

    describe('Creating Private Channel After User Joins', () => {
      describe('Owner Creates Another Private Channel', () => {
        it('Owner creates a second private channel', async () => {
          sidebarOwner = new Sidebar(users.owner.app.driver)
          await sidebarOwner.addNewChannel(privateChannel2Name, false)
          await sidebarOwner.switchChannel(privateChannel2Name, false)
          const channels = await sidebarOwner.getChannelList()
          expect(channels.length).toEqual(3)
        })

        it(`Second private channel is in owner's sidebar`, async () => {
          const channels = await sidebarOwner.getChannelsNames()
          expect(channels.length).toBe(3)
          expect(channels).toContain(privateChannel2Name)
          await sidebarOwner.getChannelIcon(privateChannel2Name, false)
        })

        it('Owner sends message in second private channel', async () => {
          privateChannel2Owner = new Channel(users.owner.app.driver, privateChannel2Name)
          expect(await privateChannel2Owner.isReady()).toBeTruthy()
          expect(await privateChannel2Owner.isMessageInputReady()).toBeTruthy()
          await privateChannel2Owner.sendMessage(users.owner.messages[3], users.owner.username)
        })

        it("Owner's message is visible in second private channel", async () => {
          const messages = await privateChannel2Owner.getUserMessages(users.owner.username)
          const text = await messages[1].getText()
          expect(text).toEqual(users.owner.messages[3])
        })
      })

      describe(`Owner Adds User To Second Private Channel`, () => {
        it(`First user's sidebar is missing private channel`, async () => {
          sidebarUser1 = new Sidebar(users.user1.app.driver)
          const channels = await sidebarUser1.getChannelList()
          expect(channels.length).toBe(2)
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

        it(`Second private channel is in user's sidebar`, async () => {
          const correctChannelCount = await sidebarUser1.waitForChannelsNum(3)
          expect(correctChannelCount).toBeTruthy()
          const channels = await sidebarUser1.getChannelsNames()
          expect(channels).toHaveLength(3)
          expect(channels).toContain(privateChannel2Name)
          await sidebarUser1.getChannelIcon(privateChannel2Name, false)
        })

        it('First user switches to private channel', async () => {
          sidebarUser1 = new Sidebar(users.user1.app.driver)
          await sidebarUser1.switchChannel(privateChannel2Name, false)
          privateChannel2User1 = new Channel(users.user1.app.driver, privateChannel2Name)
          expect(await privateChannel2User1.isMessageInputReady()).toBeTruthy()
        })

        it("Owner's messages are visible in private channel for user", async () => {
          await privateChannel2User1.getUserMessages(users.owner.username)
          await privateChannel2User1.getMessageIdsByText(users.owner.messages[3], users.owner.username)
        })
      })

      describe(`Owner Sends Another Message To Second Private Channel`, () => {
        it('Owner sends message in private channel after user joins', async () => {
          privateChannel2Owner = new Channel(users.owner.app.driver, privateChannel2Name)
          expect(await privateChannel2Owner.isReady()).toBeTruthy()
          expect(await privateChannel2Owner.isMessageInputReady()).toBeTruthy()
          await privateChannel2Owner.sendMessage(users.owner.messages[4], users.owner.username)
        })

        it("Owner's message is visible in private channel to owner", async () => {
          await privateChannel2Owner.getUserMessages(users.owner.username)
          await privateChannel2Owner.getMessageIdsByText(users.owner.messages[4], users.owner.username)
        })

        it("Owner's message is visible in private channel to user", async () => {
          await privateChannel2User1.getUserMessages(users.owner.username)
          await privateChannel2User1.getMessageIdsByText(users.owner.messages[4], users.owner.username)
        })
      })
    })

    describe('Second User Joins', () => {
      describe('Second User Joins', () => {
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

        it('Second user opens the app', async () => {
          await users.user2.app.openWithRetries(undefined, true)
          const debugModal = new DebugModeModal(users.user2.app.driver)
          await debugModal.close()
        })

        it('Second user starts to join', async () => {
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

        it('User sees second user in user list', async () => {
          const userList = new UsersList(users.user1.app.driver)
          expect(await userList.isReady()).toBeTruthy()
          expect(await userList.getUser(users.user2.username, UserListStatus.ONLINE))
        })

        it('Owner sees second user in user list', async () => {
          const userList = new UsersList(users.owner.app.driver)
          expect(await userList.isReady()).toBeTruthy()
          expect(await userList.getUser(users.user2.username, UserListStatus.ONLINE))
        })

        it('Second user sees first user in user list', async () => {
          const userList = new UsersList(users.user2.app.driver)
          expect(await userList.isReady()).toBeTruthy()
          expect(await userList.getUser(users.user1.username, UserListStatus.ONLINE))
        })

        it('Second user sees owner in user list', async () => {
          const userList = new UsersList(users.user2.app.driver)
          expect(await userList.isReady()).toBeTruthy()
          expect(await userList.getUser(users.owner.username, UserListStatus.ONLINE))
        })

        it('Second user can see messages from before they joined', async () => {
          await generalChannelUser2.getAtleastNumUserMessages(users.owner.username, 1)
          await generalChannelUser2.getAtleastNumUserMessages(users.user1.username, 1)
        })

        it(`Second user sees only general in sidebar`, async () => {
          sidebarUser2 = new Sidebar(users.user2.app.driver)
          await sidebarUser2.waitForChannelsNum(1)
          const channels = await sidebarUser2.getChannelsNames()
          expect(channels.length).toBe(1)
          expect(channels).toContain(generalChannelName)
        })
      })
    })

    describe('Attaching and Downloading Files In Private Channel', () => {
      let imageMessageIds: MessageIds | undefined = undefined
      let fileMessageIds: MessageIds | undefined = undefined
      let largeFileMessageIds: MessageIds | undefined = undefined

      describe('Images', () => {
        it('Owner uploads an image in private channel', async () => {
          const uploadFilePath = path.resolve(UPLOAD_FILE_DIR, TEST_IMAGE_FILE_NAME)
          imageMessageIds = await privateChannel2Owner.attachFile(
            TEST_IMAGE_FILE_NAME,
            uploadFilePath,
            FileAttachmentType.IMAGE,
            users.owner.username
          )
          expect(imageMessageIds).toBeDefined()
        })

        it('Guest sees uploaded image in private channel', async () => {
          await privateChannel2User1.getMessageIdsByFileAndId(
            imageMessageIds!,
            TEST_IMAGE_FILE_NAME,
            FileAttachmentType.IMAGE,
            users.owner.username
          )
        })
      })

      describe('Small Files', () => {
        it('Owner uploads a file in private channel', async () => {
          const uploadFilePath = path.resolve(UPLOAD_FILE_DIR, TEST_FILE_NAME)
          fileMessageIds = await privateChannel2Owner.attachFile(
            TEST_FILE_NAME,
            uploadFilePath,
            FileAttachmentType.FILE,
            users.owner.username
          )
        })

        it('Guest sees uploaded file and it downloads in private channel', async () => {
          expect(fileMessageIds).toBeDefined()
          await privateChannel2User1.getMessageIdsByFileAndId(
            fileMessageIds!,
            TEST_FILE_NAME,
            FileAttachmentType.FILE,
            users.owner.username
          )
        })
      })

      describe('Large Files and Cancellation', () => {
        it('Owner uploads a large file in private channel', async () => {
          const uploadFilePath = path.resolve(UPLOAD_FILE_DIR, TEST_BIG_FILE_NAME)
          createArbitraryFile(uploadFilePath, BIG_FILE_SIZE)
          largeFileMessageIds = await privateChannel2Owner.attachFile(
            TEST_BIG_FILE_NAME,
            uploadFilePath,
            FileAttachmentType.FILE,
            users.owner.username
          )
        })

        it(`Guest sees uploaded large file in private channel`, async () => {
          expect(largeFileMessageIds).toBeDefined()
          await privateChannel2User1.getMessageIdsByFileAndId(
            largeFileMessageIds!,
            TEST_BIG_FILE_NAME,
            FileAttachmentType.FILE,
            users.owner.username
          )
        })

        it(`Guest cancels download of large file in private channel`, async () => {
          expect(largeFileMessageIds).toBeDefined()
          expect(await privateChannel2User1.cancelFileDownload(largeFileMessageIds!)).toBeTruthy()
        })
      })
    })

    describe('Attaching and Downloading Files In Public Channel', () => {
      let imageMessageIds: MessageIds | undefined = undefined
      let fileMessageIds: MessageIds | undefined = undefined
      let largeFileMessageIds: MessageIds | undefined = undefined

      it('First user switches to general', async () => {
        sidebarUser1 = new Sidebar(users.user1.app.driver)
        generalChannelUser1 = await sidebarUser1.switchChannel(generalChannelName)
        expect(await generalChannelUser1.isMessageInputReady()).toBeTruthy()
      })

      it('Owner switches to general', async () => {
        sidebarOwner = new Sidebar(users.owner.app.driver)
        generalChannelOwner = await sidebarOwner.switchChannel(generalChannelName)
        expect(await generalChannelOwner.isMessageInputReady()).toBeTruthy()
      })

      describe('Images', () => {
        it('Owner uploads an image in general', async () => {
          const uploadFilePath = path.resolve(UPLOAD_FILE_DIR, TEST_IMAGE_FILE_NAME)
          imageMessageIds = await generalChannelOwner.attachFile(
            TEST_IMAGE_FILE_NAME,
            uploadFilePath,
            FileAttachmentType.IMAGE,
            users.owner.username
          )
          expect(imageMessageIds).toBeDefined()
        })

        it('First user sees uploaded image in general', async () => {
          await generalChannelUser1.getMessageIdsByFileAndId(
            imageMessageIds!,
            TEST_IMAGE_FILE_NAME,
            FileAttachmentType.IMAGE,
            users.owner.username
          )
        })

        it('Second user sees uploaded image in general', async () => {
          await generalChannelUser2.getMessageIdsByFileAndId(
            imageMessageIds!,
            TEST_IMAGE_FILE_NAME,
            FileAttachmentType.IMAGE,
            users.owner.username
          )
        })
      })

      describe('Small Files', () => {
        it('Owner uploads a file in general', async () => {
          const uploadFilePath = path.resolve(UPLOAD_FILE_DIR, TEST_FILE_NAME)
          fileMessageIds = await generalChannelOwner.attachFile(
            TEST_FILE_NAME,
            uploadFilePath,
            FileAttachmentType.FILE,
            users.owner.username
          )
        })

        it('First user sees uploaded file in general and it downloads', async () => {
          expect(fileMessageIds).toBeDefined()
          await generalChannelUser1.getMessageIdsByFileAndId(
            fileMessageIds!,
            TEST_FILE_NAME,
            FileAttachmentType.FILE,
            users.owner.username
          )
        })

        it('Second user sees uploaded file in general and it downloads', async () => {
          expect(fileMessageIds).toBeDefined()
          await generalChannelUser2.getMessageIdsByFileAndId(
            fileMessageIds!,
            TEST_FILE_NAME,
            FileAttachmentType.FILE,
            users.owner.username
          )
        })
      })

      describe('Large Files and Cancellation', () => {
        it('Owner uploads a large file in general', async () => {
          const uploadFilePath = path.resolve(UPLOAD_FILE_DIR, TEST_BIG_FILE_NAME)
          createArbitraryFile(uploadFilePath, BIG_FILE_SIZE)
          largeFileMessageIds = await generalChannelOwner.attachFile(
            TEST_BIG_FILE_NAME,
            uploadFilePath,
            FileAttachmentType.FILE,
            users.owner.username
          )
        })

        it(`First user sees uploaded large file in general`, async () => {
          expect(largeFileMessageIds).toBeDefined()
          await generalChannelUser1.getMessageIdsByFileAndId(
            largeFileMessageIds!,
            TEST_BIG_FILE_NAME,
            FileAttachmentType.FILE,
            users.owner.username
          )
        })

        it(`Second user sees uploaded large file in general`, async () => {
          expect(largeFileMessageIds).toBeDefined()
          await generalChannelUser2.getMessageIdsByFileAndId(
            largeFileMessageIds!,
            TEST_BIG_FILE_NAME,
            FileAttachmentType.FILE,
            users.owner.username
          )
        })

        it(`First user cancels download of large file in general`, async () => {
          expect(largeFileMessageIds).toBeDefined()
          expect(await generalChannelUser1.cancelFileDownload(largeFileMessageIds!)).toBeTruthy()
        })

        it(`Second user cancels download of large file in general`, async () => {
          expect(largeFileMessageIds).toBeDefined()
          expect(await generalChannelUser2.cancelFileDownload(largeFileMessageIds!)).toBeTruthy()
        })
      })
    })
  })
})
