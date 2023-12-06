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

  let secondChannelUser1: Channel

  let channelContextMenuOwner: ChannelContextMenu

  let invitationCode: string

  let sidebarOwner: Sidebar
  let sidebarUser1: Sidebar

  let users: Record<string, UserTestData>

  const communityName = 'testcommunity'
  const displayedCommunityName = 'Testcommunity'
  const newChannelName = 'mid-night-club'

  const sleep = async (time = 1000) => {
    await new Promise<void>(resolve =>
      setTimeout(() => {
        resolve()
      }, time)
    )
  }

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
        messages: ['Nice to meet you all'],
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
    it('Owner opens the app', async () => {
      await users.owner.app.open()
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
      generalChannelOwner = new Channel(users.owner.app.driver, 'general')
      const isGeneralChannel = await generalChannelOwner.element.isDisplayed()
      const generalChannelText = await generalChannelOwner.element.getText()
      expect(isGeneralChannel).toBeTruthy()
      expect(generalChannelText).toEqual('# general')
    })
    it('Owner sends a message', async () => {
      const isMessageInput = await generalChannelOwner.messageInput.isDisplayed()
      expect(isMessageInput).toBeTruthy()
      await generalChannelOwner.sendMessage(users.owner.messages[0])
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

    it('First user opens the app', async () => {
      console.log('Second client')
      await users.user1.app.open()
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
      console.log('new user - 5')
      const registerModal = new RegisterUsernameModal(users.user1.app.driver)
      const isRegisterModal = await registerModal.element.isDisplayed()
      expect(isRegisterModal).toBeTruthy()
      await registerModal.clearInput()
      await registerModal.typeUsername(users.user1.username)
      await registerModal.submit()
      console.time(`[${users.user1.app.name}] '${users.user1.username}' joining community time`)
    })

    it('First user joins successfully sees general channel and sends a message', async () => {
      console.log('new user - 7')
      generalChannelUser1 = new Channel(users.user1.app.driver, 'general')
      await generalChannelUser1.element.isDisplayed()
      const isMessageInput2 = await generalChannelUser1.messageInput.isDisplayed()
      expect(isMessageInput2).toBeTruthy()
      console.timeEnd(`[${users.user1.app.name}] '${users.user1.username}' joining community time`)
      console.log('FETCHING CHANNEL MESSAGES!')
      await new Promise<void>(resolve =>
        setTimeout(() => {
          resolve()
        }, 15000)
      )
      await generalChannelUser1.sendMessage(users.user1.messages[0])
    })
    it("First user's sent message is visible in a channel", async () => {
      const messages2 = await generalChannelUser1.getUserMessages(users.user1.username)
      const messages1 = await generalChannelUser1.getUserMessages(users.owner.username)
      console.log({ messages1, messages2 })
      const text2 = await messages2[1].getText()
      expect(text2).toEqual(users.user1.messages[0])
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

    it('Owner goes offline', async () => {
      await users.owner.app.close()
    })

    it('Second user opens the app', async () => {
      console.log('Third client')
      await users.user3.app.open()
      const debugModal = new DebugModeModal(users.user3.app.driver)
      await debugModal.close()
    })

    it('Second user starts to join when owner is offline', async () => {
      const joinCommunityModal = new JoinCommunityModal(users.user3.app.driver)
      const isJoinCommunityModal = await joinCommunityModal.element.isDisplayed()
      expect(isJoinCommunityModal).toBeTruthy()
      console.log({ invitationCode })
      await joinCommunityModal.typeCommunityCode(invitationCode)
      await joinCommunityModal.submit()
    })
    // ______________

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
      console.log('duplicated user - 2')
      const registerModal = new RegisterUsernameModal(users.user3.app.driver)
      const isRegisterModal = await registerModal.elementUsernameTaken.isDisplayed()
      expect(isRegisterModal).toBeTruthy()
      await registerModal.clearInput()
      await registerModal.typeUsername(users.user3.username)
      await registerModal.submitUsernameTaken()
      console.time(`[${users.user3.app.name}] '${users.user3.username}' joining community time`)
    })

    // ______________

    it('Second user sees general channel', async () => {
      console.log('new user - 7')
      generalChannelUser3 = new Channel(users.user3.app.driver, 'general')
      await generalChannelUser3.element.isDisplayed()
      const isMessageInput = await generalChannelUser3.messageInput.isDisplayed()
      expect(isMessageInput).toBeTruthy()
      console.timeEnd(`[${users.user3.app.name}] '${users.user3.username}' joining community time`)
    })

    it('Second user can send a message, they see their message tagged as "unregistered"', async () => {
      console.log('Second guest FETCHING CHANNEL MESSAGES!')
      await new Promise<void>(resolve =>
        setTimeout(() => {
          resolve()
        }, 15000)
      )
      await generalChannelUser3.sendMessage(users.user3.messages[0])
      generalChannelUser3 = new Channel(users.user3.app.driver, 'general')
      await generalChannelUser3.waitForLabel(users.user3.username, 'Unregistered')
    })

    it('First user sees that unregistered user\'s messages are marked as "unregistered"', async () => {
      await generalChannelUser1.waitForLabel(users.user3.username, 'Unregistered')
    })

    it('Owner goes back online', async () => {
      await users.owner.app.open()
      const debugModal = new DebugModeModal(users.owner.app.driver)
      await debugModal.close()
    })

    it('Second user receives certificate, they can see confirmation that they registered', async () => {
      await generalChannelUser3.waitForUserMessage(
        users.owner.username,
        `@${users.user3.username} has joined ${displayedCommunityName}!`
      )
    })

    it('"Unregistered" label is removed from second user\'s messages', async () => {
      generalChannelOwner = new Channel(users.owner.app.driver, 'general')
      await generalChannelOwner.waitForLabelsNotPresent(users.user3.username)
    })

    it('Channel creation - Owner creates second channel', async () => {
      sidebarOwner = new Sidebar(users.owner.app.driver)
      await sidebarOwner.addNewChannel(newChannelName)
      await sidebarOwner.switchChannel(newChannelName)
      const channels = await sidebarOwner.getChannelList()
      expect(channels.length).toEqual(2)
    })
    it('Channel creation - Owner sends message in second channel', async () => {
      const newChannel = new Channel(users.owner.app.driver, newChannelName)
      const isMessageInput = await newChannel.messageInput.isDisplayed()
      expect(isMessageInput).toBeTruthy()
      await newChannel.sendMessage(users.owner.messages[1])
    })
    it('Channel creation - User reads message in second channel', async () => {
      sidebarUser1 = new Sidebar(users.user1.app.driver)
      await sidebarUser1.switchChannel(newChannelName)
      secondChannelUser1 = new Channel(users.user1.app.driver, newChannelName)
      await new Promise<void>(resolve =>
        setTimeout(() => {
          resolve()
        }, 2000)
      )
      await secondChannelUser1.waitForUserMessage(users.owner.username, users.owner.messages[1])
    })
    it('Channel deletion - Owner deletes second channel', async () => {
      channelContextMenuOwner = new ChannelContextMenu(users.owner.app.driver)
      await channelContextMenuOwner.openMenu()
      await channelContextMenuOwner.openDeletionChannelModal()
      await channelContextMenuOwner.deleteChannel()
      const channels = await sidebarOwner.getChannelList()
      expect(channels.length).toEqual(1)
    })
    it('Channel deletion - User sees info about channel deletion in general channel', async () => {
      await sleep(5000)
      await generalChannelUser1.waitForUserMessage(
        users.owner.username,
        `@${users.owner.username} deleted #${newChannelName}`
      )
    })
    it('Channel deletion - User can create channel with the same name and is fresh channel', async () => {
      await sidebarUser1.addNewChannel(newChannelName)
      await sidebarUser1.switchChannel(newChannelName)
      const messages = await secondChannelUser1.getUserMessages(users.user1.username)
      expect(messages.length).toEqual(1)
      await new Promise<void>(resolve =>
        setTimeout(() => {
          resolve()
        }, 2000)
      )
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
      it('Channel deletion - Owner recreates general channel', async () => {
        console.log('TEST 3')
        await new Promise<void>(resolve => setTimeout(() => resolve(), 10000))
        const isGeneralChannel = await generalChannelOwner.messageInput.isDisplayed()
        expect(isGeneralChannel).toBeTruthy()
        await channelContextMenuOwner.openMenu()
        await channelContextMenuOwner.openDeletionChannelModal()
        await channelContextMenuOwner.deleteChannel()
        const channels = await sidebarOwner.getChannelList()
        expect(channels.length).toEqual(2)
      })

      it('Leave community - Guest re-join to community successfully', async () => {
        console.log('TEST 4')
        const debugModal = new DebugModeModal(users.user1.app.driver)
        await debugModal.close()
        const joinCommunityModal = new JoinCommunityModal(users.user1.app.driver)
        const isJoinCommunityModal = await joinCommunityModal.element.isDisplayed()
        expect(isJoinCommunityModal).toBeTruthy()
        await joinCommunityModal.typeCommunityCode(invitationCode)
        await joinCommunityModal.submit()
      })
      it('Leave community - Guest registers new username', async () => {
        console.log('TEST 5')
        const registerModal2 = new RegisterUsernameModal(users.user1.app.driver)
        const isRegisterModal2 = await registerModal2.element.isDisplayed()
        expect(isRegisterModal2).toBeTruthy()
        await registerModal2.typeUsername(users.user2.username)
        await registerModal2.submit()
        console.time(`[${users.user1.app.name}] '${users.user2.username}' joining community time`)
      })

      // Check correct channels replication
      it('Channel deletion - User sees information about recreation general channel and see correct amount of messages', async () => {
        console.log('TEST 6')
        generalChannelUser1 = new Channel(users.user1.app.driver, 'general')
        await generalChannelUser1.element.isDisplayed()
        console.timeEnd(`[${users.user1.app.name}] '${users.user2.username}' joining community time`)
        await new Promise<void>(resolve =>
          setTimeout(() => {
            resolve()
          }, 10000)
        )

        await generalChannelUser1.waitForUserMessage(
          users.owner.username,
          `@${users.owner.username} deleted all messages in #general`
        )
        await generalChannelUser1.waitForUserMessage(
          users.owner.username,
          `@${users.user2.username} has joined Testcommunity! 🎉`
        )
      })

      it('Leave community - Guest sends a message after rejoining community as a new user', async () => {
        console.log('TEST 7')
        generalChannelUser1 = new Channel(users.user1.app.driver, 'general')
        await generalChannelUser1.element.isDisplayed()
        const isMessageInput2 = await generalChannelUser1.messageInput.isDisplayed()
        expect(isMessageInput2).toBeTruthy()
        await new Promise<void>(resolve =>
          setTimeout(() => {
            resolve()
          }, 5000)
        )
        await generalChannelUser1.sendMessage(users.user2.messages[0])
      })
      it('Leave community - Sent message is visible in a channel', async () => {
        console.log('TEST 8')
        await generalChannelUser1.waitForUserMessage(users.user2.username, users.user2.messages[0])
      })
      it('Owner closes app', async () => {
        await users.owner.app.close({ forceSaveState: true })
        await new Promise<void>(resolve => setTimeout(() => resolve(), 20000))
      })

      it('Guest closes app', async () => {
        console.log('TEST 9')
        await users.user1.app?.close()
      })

      it('Owner re-opens app', async () => {
        await users.owner.app?.open()
        await new Promise<void>(resolve => setTimeout(() => resolve(), 10000))
      })

      it('Guest closes app - Owner sends another message after guest left the app', async () => {
        console.log('TEST 10')
        generalChannelOwner = new Channel(users.owner.app.driver, 'general')
        const isMessageInput = await generalChannelOwner.messageInput.isDisplayed()
        expect(isMessageInput).toBeTruthy()
        await generalChannelOwner.sendMessage(users.owner.messages[2])
      })
      it('Guest closes app - Check if message is visible for owner', async () => {
        console.log('TEST 11')
        await generalChannelOwner.waitForUserMessage(users.owner.username, users.owner.messages[2])
      })
    }
  })
})
