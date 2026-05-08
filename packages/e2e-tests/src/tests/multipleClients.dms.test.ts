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
  Settings,
  Sidebar,
} from '../selectors'
import { createArbitraryFile, promiseWithRetries, sleep } from '../utils'
import { MessageIds, UserListStatus, UserTestData, UserTestData2, UserTestDataMap } from '../types'
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

  let selfDmName: string
  let oneOnOneName: string
  let groupDmName: string
  let groupDmHeaderName: string

  const communityName = 'testcommunity'
  const displayedCommunityName = 'Testcommunity'
  const generalChannelName = 'general'

  type Usernames = 'owner' | 'user1' | 'user2'
  type ChannelNames = 'selfDm' | 'oneOnOne' | 'groupDm' | 'general'
  let users: UserTestDataMap<Usernames, UserTestData2<ChannelNames, string[]>>

  beforeAll(async () => {
    users = {
      owner: {
        username: 'owner',
        app: new App(),
        messages: {
          general: ['Hi'],
          selfDm: ['Only I can see this', `I'm still the only one who can see this`],
          oneOnOne: [`I'm talking to just you`],
          groupDm: [`Multiple people can see this`],
        },
      },
      user1: {
        username: 'user-1',
        app: new App(),
        messages: {
          general: ['Hello'],
          selfDm: [],
          oneOnOne: [`This is between us`],
          groupDm: [`Hey everyone`],
        },
      },
      user2: {
        username: 'user-2',
        app: new App(),
        messages: {
          general: [`I'm here too`],
          selfDm: [],
          oneOnOne: [],
          groupDm: [`We're all here!`],
        },
      },
    }
  })

  afterAll(async () => {
    for (const user of Object.values(users)) {
      try {
        if (!user.app.isOpened) continue
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

      it('Owner opens community membership tab', async () => {
        settingsOwner = await new Sidebar(users.owner.app.driver).openSettings()
        await settingsOwner.openCommunityMembership(1)
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

      it('Owner closes community membership tab', async () => {
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
        expect(dmCreationStatus.failedUsers).toHaveLength(0)
        expect(dmCreationStatus.successfulUsers).toHaveLength(1)
        expect(dmCreationStatus.success).toBeTruthy()
      })

      it('Owner sees newly created DM channel', async () => {
        selfDmName = users.owner.username
        selfDmChannelOwner = new Channel(users.owner.app.driver, selfDmName)
        await selfDmChannelOwner.isOpen(false, true)
        await selfDmChannelOwner.isMessageInputReady()
      })

      it('Owner sees their message in the newly created DM channel', async () => {
        await selfDmChannelOwner.getUserMessages(users.owner.username)
        await selfDmChannelOwner.getMessageIdsByText(users.owner.messages.selfDm[0], users.owner.username)
      })
    })
  })
})
