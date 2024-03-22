import {
  App,
  Channel,
  ChannelContextMenu,
  CreateCommunityModal,
  DebugModeModal,
  JoinCommunityModal,
  RegisterUsernameModal,
  Sidebar,
} from '../selectors'
import logger from '../logger'
import { promiseWithRetries, sleep } from '../utils'
const log = logger('ManyClients')

interface UserTestData {
  username: string
  app: App
  messages: string[]
}

jest.setTimeout(1200000) // 20 minutes
describe('Multiple Clients', () => {
  let generalChannelOwner: Channel
  let generalChannelUser1: Channel
  let generalChannelUser3: Channel

  let secondChannelOwner: Channel
  let secondChannelUser1: Channel

  let channelContextMenuOwner: ChannelContextMenu

  let invitationCode: string

  let sidebarOwner: Sidebar
  let sidebarUser1: Sidebar

  let users: Record<string, UserTestData>

  const communityName = 'testcommunity'
  const displayedCommunityName = 'Testcommunity'
  const newChannelName = 'mid-night-club'
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
        messages: ['Nice to meet you all', 'This appears unsent'],
        app: commonApp,
      },
      user2: {
        username: 'user-joining-1-1',
        messages: ['Nice to meet you again'],
        app: commonApp,
      },
      user3: {
        username: 'user-joining-2',
        messages: ['Hi everyone'],
        app: new App(),
      },
    }
  })

  afterAll(async () => {
    for (const user of Object.values(users)) {
      await user.app.close()
    }
  })

  beforeEach(async () => {
    await sleep(1000)
  })

  describe('Stages:', () => {
    describe('Owner Opens App', () => {
      it('Owner opens the app', async () => {
        await users.owner.app.openWithRetries()
      })

      it('Owner sees "join community" modal and switches to "create community" modal', async () => {
        const joinModal = new JoinCommunityModal(users.owner.app.driver)
        const isJoinModal = await joinModal.element.isDisplayed()
        expect(isJoinModal).toBeTruthy()
        await joinModal.switchToCreateCommunity()
      })
      it('Owner submits valid community name', async () => {
        const createModal = new CreateCommunityModal(users.owner.app.driver)
        const isCreateModal = await createModal.element.isDisplayed()
        expect(isCreateModal).toBeTruthy()
        await createModal.typeCommunityName(communityName)
        await createModal.submit()
      })
      it('Owner sees "register username" modal and submits valid username', async () => {
        const registerModal = new RegisterUsernameModal(users.owner.app.driver)
        const isRegisterModal = await registerModal.element.isDisplayed()
        expect(isRegisterModal).toBeTruthy()
        await registerModal.typeUsername(users.owner.username)
        await registerModal.submit()
      })
      it('Owner registers successfully and sees general channel', async () => {
        generalChannelOwner = new Channel(users.owner.app.driver, generalChannelName)
        const isGeneralChannel = await generalChannelOwner.element.isDisplayed()
        const generalChannelText = await generalChannelOwner.element.getText()
        expect(isGeneralChannel).toBeTruthy()
        expect(generalChannelText).toEqual('# general')
      })
      it('Owner sends a message', async () => {
        const isMessageInput = await generalChannelOwner.messageInput.isDisplayed()
        expect(isMessageInput).toBeTruthy()
        const messageIds = await generalChannelOwner.sendMessage(users.owner.messages[0], users.owner.username)
        await generalChannelOwner.verifyMessageSentStatus(messageIds, users.owner.username, false)
      })
      it("Owner's message is visible on channel", async () => {
        const messages = await generalChannelOwner.getUserMessages(users.owner.username)
        const text = await messages[1].getText()
        expect(text).toEqual(users.owner.messages[0])
      })
      it('Owner opens the settings tab and gets an invitation code', async () => {
        const settingsModal = await new Sidebar(users.owner.app.driver).openSettings()
        const isSettingsModal = await settingsModal.element.isDisplayed()
        expect(isSettingsModal).toBeTruthy()
        await sleep(2000)
        await settingsModal.switchTab('invite') // TODO: Fix - the invite tab should be default for the owner
        await sleep(2000)
        const invitationCodeElement = await settingsModal.invitationCode()
        await sleep(2000)
        invitationCode = await invitationCodeElement.getText()
        await sleep(2000)
        console.log({ invitationCode })
        expect(invitationCode).not.toBeUndefined()
        log('Received invitation code:', invitationCode)
        await settingsModal.close()
      })
    })

    describe('First User Joins Community', () => {
      it('First user opens the app', async () => {
        console.log('Second client')
        await users.user1.app.openWithRetries()
      })

      it('First user submits invitation code received from owner', async () => {
        console.log('new user - 3')
        const joinCommunityModal = new JoinCommunityModal(users.user1.app.driver)
        const isJoinCommunityModal = await joinCommunityModal.element.isDisplayed()
        expect(isJoinCommunityModal).toBeTruthy()
        console.log({ invitationCode })
        await joinCommunityModal.typeCommunityCode(invitationCode)
        await joinCommunityModal.submit()
      })

      it('First user submits valid username', async () => {
        const app = users.user1.app
        console.log('new user - 5')
        const registerModal = new RegisterUsernameModal(app.driver)
        const isRegisterModal = await registerModal.element.isDisplayed()
        expect(isRegisterModal).toBeTruthy()
        await registerModal.clearInput()
        await registerModal.typeUsername(users.user1.username)
        await registerModal.submit()
        console.time(`[${app.name}] '${users.user1.username}' joining community time`)
      })

      it('First user joins successfully sees general channel and sends a message', async () => {
        console.log('new user - 7')
        const app = users.user1.app
        const loadNewUser = async () => {
          generalChannelUser1 = new Channel(app.driver, generalChannelName)
          await generalChannelUser1.element.isDisplayed()
          const isMessageInput2 = await generalChannelUser1.messageInput.isDisplayed()
          expect(isMessageInput2).toBeTruthy()
          console.timeEnd(`[${app.name}] '${users.user1.username}' joining community time`)
        }

        const retryConfig = app.retryConfig
        const failureReason = `Failed to load app for new user ${users.user1.username} within ${retryConfig.timeoutMs}ms`
        const onTimeout = async () => {
          await app.close()
          await app.open()
        }
        await promiseWithRetries(loadNewUser(), failureReason, retryConfig, onTimeout)

        console.log('FETCHING CHANNEL MESSAGES!')
        await sleep(20000)

        const messageIds = await generalChannelUser1.sendMessage(users.user1.messages[0], users.user1.username)
        await generalChannelUser1.verifyMessageSentStatus(messageIds, users.user1.username, false)
      })
      it("First user's sent message is visible in a channel", async () => {
        const messages1 = await generalChannelUser1.getUserMessages(users.owner.username)
        const usersMessageId = await generalChannelUser1.getMessageIdsByText(
          users.user1.messages[0],
          users.user1.username
        )
        console.log({ messages1, usersMessageId })
      })
      it('First user opens the settings tab and copies updated invitation code', async () => {
        const settingsModal = await new Sidebar(users.user1.app.driver).openSettings()
        const isSettingsModal = await settingsModal.element.isDisplayed()
        expect(isSettingsModal).toBeTruthy()
        await sleep(2000)
        await settingsModal.switchTab('invite')
        await sleep(2000)
        const invitationCodeElement = await settingsModal.invitationCode()
        await sleep(2000)
        invitationCode = await invitationCodeElement.getText()
        await sleep(2000)
        console.log(`${invitationCode} copied from non owner`)
        expect(invitationCode).not.toBeUndefined()
        await settingsModal.close()
      })
    })

    describe('Owner Leaves', () => {
      it('Owner goes offline', async () => {
        await users.owner.app.close()
        await sleep(30000)
      })

      it('User sees the connection status element in general channel', async () => {
        const correctConnectionStatusElementPresence = await generalChannelUser1.waitForConnectionStatus(true)
        expect(correctConnectionStatusElementPresence).toBe(true)
      })

      it(`First user sends an unsent message`, async () => {
        const messageIds = await generalChannelUser1.sendMessage(users.user1.messages[1], users.user1.username)
        await generalChannelUser1.verifyMessageSentStatus(messageIds, users.user1.username, true)
      })

      it("First user's unsent message is visible in a channel", async () => {
        await generalChannelUser1.getUserMessages(users.owner.username)
        await generalChannelUser1.getMessageIdsByText(users.user1.messages[1], users.user1.username)
      })
    })

    describe('Second User Joins', () => {
      it('Second user opens the app', async () => {
        console.log('Third client')
        await users.user3.app.openWithRetries()
        const debugModal = new DebugModeModal(users.user3.app.driver)
        await debugModal.close()
      })

      it('Second user starts to join when owner is offline', async () => {
        const app = users.user3.app
        const joinCommunityModal = new JoinCommunityModal(app.driver)
        const isJoinCommunityModal = await joinCommunityModal.element.isDisplayed()
        expect(isJoinCommunityModal).toBeTruthy()
        console.log({ invitationCode })
        await joinCommunityModal.typeCommunityCode(invitationCode)
        await joinCommunityModal.submit()
      })

      it('Second user submits non-valid, duplicated username', async () => {
        console.log('duplicated user - 1')
        const registerModal = new RegisterUsernameModal(users.user3.app.driver)
        const isRegisterModal = await registerModal.element.isDisplayed()
        expect(isRegisterModal).toBeTruthy()
        await registerModal.clearInput()
        await registerModal.typeUsername(users.user1.username)
        await registerModal.submit()
        console.time(`[${users.user3.app.name}] '${users.user1.username}' duplicated joining community time`)
      })

      it('Second user submits valid username', async () => {
        const app = users.user3.app
        console.log('duplicated user - 2')
        const registerModal = new RegisterUsernameModal(app.driver)
        const isRegisterModal = await registerModal.elementUsernameTaken.isDisplayed()
        expect(isRegisterModal).toBeTruthy()
        await registerModal.clearInput()
        await registerModal.typeUsername(users.user3.username)
        await registerModal.submitUsernameTaken()
        console.time(`[${app.name}] '${users.user3.username}' joining community time`)
      })

      it('Second user sees general channel', async () => {
        console.log('new user - 7')
        const app = users.user3.app
        const loadNewUser = async () => {
          generalChannelUser3 = new Channel(app.driver, generalChannelName)
          await generalChannelUser3.element.isDisplayed()
          const isMessageInput = await generalChannelUser3.messageInput.isDisplayed()
          expect(isMessageInput).toBeTruthy()
          console.timeEnd(`[${app.name}] '${users.user3.username}' joining community time`)
        }

        const retryConfig = app.retryConfig
        const failureReason = `Failed to load app for new user ${users.user3.username} within ${retryConfig.timeoutMs}ms`
        const onTimeout = async () => {
          await app.close()
          await app.open()
        }
        await promiseWithRetries(loadNewUser(), failureReason, retryConfig, onTimeout)
      })

      it("Second user doesn't see the connection status element in general channel", async () => {
        const correctConnectionStatusElementPresence = await generalChannelUser3.waitForConnectionStatus(false)
        expect(correctConnectionStatusElementPresence).toBe(true)
      })

      it('Second user sees "unsent" message from first user as sent', async () => {
        await sleep(30000)
        const user1UnsentMessageId = await generalChannelUser3.getMessageIdsByText(
          users.user1.messages[1],
          users.user1.username
        )
        await generalChannelUser3.verifyMessageSentStatus(user1UnsentMessageId, users.user1.username, false)
      })

      it("First user doesn't see the connection status element in general channel", async () => {
        const correctConnectionStatusElementPresence = await generalChannelUser1.waitForConnectionStatus(false)
        expect(correctConnectionStatusElementPresence).toBe(true)
      })

      it('First user now sees their "unsent" message as sent', async () => {
        const user1UnsentMessageId = await generalChannelUser1.getMessageIdsByText(
          users.user1.messages[1],
          users.user1.username
        )
        await generalChannelUser1.verifyMessageSentStatus(user1UnsentMessageId, users.user1.username, false)
      })

      it('Second user can send a message, they see their message tagged as "unregistered"', async () => {
        console.log('Second guest FETCHING CHANNEL MESSAGES!')
        await sleep(15000)
        const messageIds = await generalChannelUser3.sendMessage(users.user3.messages[0], users.user3.username)
        generalChannelUser3 = new Channel(users.user3.app.driver, generalChannelName)
        await generalChannelUser3.waitForLabel(users.user3.username, 'Unregistered')
        await generalChannelUser3.verifyMessageSentStatus(messageIds, users.user3.username, false)
      })

      it('First user sees that unregistered user\'s messages are marked as "unregistered"', async () => {
        const user3MessageId = await generalChannelUser1.getMessageIdsByText(
          users.user3.messages[0],
          users.user3.username
        )
        await generalChannelUser1.waitForLabel(users.user3.username, 'Unregistered')
        await generalChannelUser1.verifyMessageSentStatus(user3MessageId, users.user3.username, false)
      })
    })

    describe('Second User Registers', () => {
      it('Owner goes back online', async () => {
        await users.owner.app.openWithRetries()
        const debugModal = new DebugModeModal(users.owner.app.driver)
        await debugModal.close()
        await sleep(30000)
      })

      // @isla - TODO: Uncomment and validate this test when we fix the issues causing it
      // related to : https://github.com/TryQuiet/quiet/issues/1838, https://github.com/TryQuiet/quiet/issues/2321
      xit('Second user receives certificate, they can see confirmation that they registered', async () => {
        const messageIds = await generalChannelUser3.getMessageIdsByText(
          `@${users.user3.username} has joined and will be registered soon. 🎉 Learn more`,
          users.user3.username
        )
        await generalChannelUser3.verifyMessageSentStatus(messageIds, users.user3.username, false)
      })

      it('"Unregistered" label is removed from second user\'s messages', async () => {
        generalChannelOwner = new Channel(users.owner.app.driver, generalChannelName)
        await generalChannelOwner.waitForLabelsNotPresent(users.user3.username)
      })
    })

    describe('Owner Creates New Channel', () => {
      it('Channel creation - Owner creates second channel', async () => {
        sidebarOwner = new Sidebar(users.owner.app.driver)
        await sidebarOwner.addNewChannel(newChannelName)
        await sidebarOwner.switchChannel(newChannelName)
        const channels = await sidebarOwner.getChannelList()
        expect(channels.length).toEqual(2)
      })

      it('Channel creation - Owner sends message in second channel', async () => {
        secondChannelOwner = new Channel(users.owner.app.driver, newChannelName)
        const isMessageInput = await secondChannelOwner.messageInput.isDisplayed()
        expect(isMessageInput).toBeTruthy()
        await sleep(5000)
        const messageIds = await secondChannelOwner.sendMessage(users.owner.messages[1], users.owner.username)
        await secondChannelOwner.verifyMessageSentStatus(messageIds, users.owner.username, false)
      })

      it("Channel creation - Owner doesn't see the connection status element in second channel", async () => {
        const correctConnectionStatusElementPresence = await secondChannelOwner.waitForConnectionStatus(false)
        expect(correctConnectionStatusElementPresence).toBe(true)
      })

      it('Channel creation - User reads message in second channel', async () => {
        sidebarUser1 = new Sidebar(users.user1.app.driver)
        await sidebarUser1.switchChannel(newChannelName)
        secondChannelUser1 = new Channel(users.user1.app.driver, newChannelName)
        await sleep(2000)
        const ownerMessageId = await secondChannelUser1.getMessageIdsByText(
          users.owner.messages[1],
          users.owner.username
        )
        await secondChannelUser1.verifyMessageSentStatus(ownerMessageId, users.owner.username, false)
      })

      it("Channel creation - First user doesn't see the connection status element in second channel", async () => {
        const correctConnectionStatusElementPresence = await secondChannelUser1.waitForConnectionStatus(false)
        expect(correctConnectionStatusElementPresence).toBe(true)
      })
    })

    describe('Channel Deletion', () => {
      it('Owner deletes second channel', async () => {
        channelContextMenuOwner = new ChannelContextMenu(users.owner.app.driver)
        await channelContextMenuOwner.openMenu()
        await channelContextMenuOwner.openDeletionChannelModal()
        await channelContextMenuOwner.deleteChannel()
        const channels = await sidebarOwner.getChannelList()
        expect(channels.length).toEqual(1)
      })

      it('User sees info about channel deletion in general channel', async () => {
        await sleep(5000)
        const messageIds = await generalChannelUser1.getMessageIdsByText(
          `@${users.owner.username} deleted #${newChannelName}`,
          users.owner.username
        )
        await generalChannelUser1.verifyMessageSentStatus(messageIds, users.owner.username, false)
      })

      it('User can create channel with the same name and is fresh channel', async () => {
        await sidebarUser1.addNewChannel(newChannelName)
        await sidebarUser1.switchChannel(newChannelName)
        const messages = await secondChannelUser1.getUserMessages(users.user1.username)
        expect(messages.length).toEqual(1)
        await sleep(10000)
        const channels = await sidebarOwner.getChannelList()
        expect(channels.length).toEqual(2)
      })

      // End of tests for Windows
      if (process.platform !== 'win32') {
        it('Leave community', async () => {
          console.log('TEST 2')
          const settingsModal = await new Sidebar(users.user1.app.driver).openSettings()
          const isSettingsModal = await settingsModal.element.isDisplayed()
          expect(isSettingsModal).toBeTruthy()
          await settingsModal.openLeaveCommunityModal()
          await settingsModal.leaveCommunityButton()
        })

        // Delete general channel while guest is absent
        it('Owner recreates general channel', async () => {
          console.log('TEST 3')
          await sleep(10000)
          const isGeneralChannel = await generalChannelOwner.messageInput.isDisplayed()
          expect(isGeneralChannel).toBeTruthy()
          await channelContextMenuOwner.openMenu()
          await channelContextMenuOwner.openDeletionChannelModal()
          await channelContextMenuOwner.deleteChannel()
          const channels = await sidebarOwner.getChannelList()
          expect(channels.length).toEqual(2)
        })
      }
    })

    describe('Leave Community', () => {
      it('Guest re-join to community successfully', async () => {
        console.log('TEST 4')
        const debugModal = new DebugModeModal(users.user1.app.driver)
        await debugModal.close()
        const joinCommunityModal = new JoinCommunityModal(users.user1.app.driver)
        const isJoinCommunityModal = await joinCommunityModal.element.isDisplayed()
        expect(isJoinCommunityModal).toBeTruthy()
        await joinCommunityModal.typeCommunityCode(invitationCode)
        await joinCommunityModal.submit()
      })

      it('Guest registers new username', async () => {
        console.log('TEST 5')
        const registerModal2 = new RegisterUsernameModal(users.user1.app.driver)
        const isRegisterModal2 = await registerModal2.element.isDisplayed()
        expect(isRegisterModal2).toBeTruthy()
        await registerModal2.typeUsername(users.user2.username)
        await registerModal2.submit()
        console.time(`[${users.user1.app.name}] '${users.user2.username}' joining community time`)
      })

      // Check correct channels replication
      it('User sees information about recreation general channel and see correct amount of messages', async () => {
        console.log('TEST 6')
        generalChannelUser1 = new Channel(users.user1.app.driver, generalChannelName)
        await generalChannelUser1.element.isDisplayed()
        console.timeEnd(`[${users.user1.app.name}] '${users.user2.username}' joining community time`)
        await sleep(10000)

        let messageIds = await generalChannelUser1.getMessageIdsByText(
          `@${users.owner.username} deleted all messages in #general`,
          users.owner.username
        )
        await generalChannelUser1.verifyMessageSentStatus(messageIds, users.owner.username, false)

        messageIds = await generalChannelUser1.getMessageIdsByText(
          `@${users.user2.username} has joined and will be registered soon. 🎉 Learn more`,
          users.user2.username
        )
        await generalChannelUser1.verifyMessageSentStatus(messageIds, users.user2.username, false)
      })

      it('Guest sends a message after rejoining community as a new user and it is visible', async () => {
        console.log('TEST 7')
        generalChannelUser1 = new Channel(users.user1.app.driver, generalChannelName)
        await generalChannelUser1.element.isDisplayed()
        const isMessageInput2 = await generalChannelUser1.messageInput.isDisplayed()
        expect(isMessageInput2).toBeTruthy()
        await sleep(5000)
        const messageIds = await generalChannelUser1.sendMessage(users.user2.messages[0], users.user2.username)
        await generalChannelUser1.verifyMessageSentStatus(messageIds, users.user2.username, false)
      })
    })

    describe('Guest Closes App', () => {
      it('Owner closes app', async () => {
        await users.owner.app.close({ forceSaveState: true })
        await sleep(20000)
      })

      it('Guest closes app', async () => {
        console.log('TEST 9')
        await users.user1.app?.close()
      })

      it('Owner re-opens app', async () => {
        await users.owner.app?.openWithRetries()
        await sleep(20000)
      })

      it('Owner sends another message after guest left the app and it is visible', async () => {
        console.log('TEST 10')
        generalChannelOwner = new Channel(users.owner.app.driver, generalChannelName)
        const isMessageInput = await generalChannelOwner.messageInput.isDisplayed()
        expect(isMessageInput).toBeTruthy()
        const messageIds = await generalChannelOwner.sendMessage(users.owner.messages[2], users.owner.username)
        await generalChannelOwner.verifyMessageSentStatus(messageIds, users.owner.username, false)
      })

      it('Owner sees the connection status element in general channel', async () => {
        const correctConnectionStatusElementPresence = await generalChannelOwner.waitForConnectionStatus(false)
        expect(correctConnectionStatusElementPresence).toBe(true)
      })
    })
  })
})
