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
import { createLogger } from '../logger'
import { UserTestData } from '../types'
const logger = createLogger('multipleClients')

jest.setTimeout(1200000) // 20 minutes
describe('Multiple Clients', () => {
  let generalChannelOwner: Channel
  let generalChannelUser1: Channel
  let generalChannelUser3: Channel

  let secondChannelUser1: Channel

  let thirdChannelOwner: Channel

  let channelContextMenuOwner: ChannelContextMenu

  let invitationCode: string

  let sidebarOwner: Sidebar
  let sidebarUser1: Sidebar

  let users: Record<string, UserTestData>

  const communityName = 'testcommunity'
  const displayedCommunityName = 'Testcommunity'
  const newChannelName = 'mid-night-club'
  const thirdChannelName = 'delete-this'

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
      await user.app.cleanup()
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
      logger.info('opened the settings modal')
      await sleep(2000)
      const invitationCodeElement = await settingsModal.invitationCode()
      await sleep(2000)
      invitationCode = await invitationCodeElement.getText()
      await sleep(2000)
      logger.info({ invitationCode })
      expect(invitationCode).not.toBeUndefined()
      logger.info('Received invitation code:', invitationCode)
      await settingsModal.closeTabThenModal()
    })

    it('First user opens the app', async () => {
      logger.info('Second client')
      await users.user1.app.open()
    })

    it('First user submits invitation code received from owner', async () => {
      logger.info('new user - 3')
      const joinCommunityModal = new JoinCommunityModal(users.user1.app.driver)
      const isJoinCommunityModal = await joinCommunityModal.element.isDisplayed()
      expect(isJoinCommunityModal).toBeTruthy()
      logger.info({ invitationCode })
      await joinCommunityModal.typeCommunityInviteLink(invitationCode)
      await joinCommunityModal.submit()
    })

    it('First user submits valid username', async () => {
      logger.info('new user - 5')
      const registerModal = new RegisterUsernameModal(users.user1.app.driver)
      const isRegisterModal = await registerModal.element.isDisplayed()
      expect(isRegisterModal).toBeTruthy()
      await registerModal.clearInput()
      await registerModal.typeUsername(users.user1.username)
      await registerModal.submit()
      logger.time(`[${users.user1.app.name}] '${users.user1.username}' joining community time`)
    })

    it('First user joins successfully sees general channel and sends a message', async () => {
      logger.info('new user - 7')
      generalChannelUser1 = new Channel(users.user1.app.driver, 'general')
      await generalChannelUser1.element.isDisplayed()
      const isMessageInput2 = await generalChannelUser1.messageInput.isDisplayed()
      expect(isMessageInput2).toBeTruthy()
      logger.timeEnd(`[${users.user1.app.name}] '${users.user1.username}' joining community time`)
      logger.info('FETCHING CHANNEL MESSAGES!')
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
      logger.info({ messages1, messages2 })
      const text2 = await messages2[1].getText()
      expect(text2).toEqual(users.user1.messages[0])
    })
    it('First user opens the settings tab and copies updated invitation code', async () => {
      const settingsModal = await new Sidebar(users.user1.app.driver).openSettings()
      const isSettingsModal = await settingsModal.element.isDisplayed()
      expect(isSettingsModal).toBeTruthy()
      await sleep(2000)
      const invitationCodeElement = await settingsModal.invitationCode()
      await sleep(2000)
      invitationCode = await invitationCodeElement.getText()
      await sleep(2000)
      logger.info(`${invitationCode} copied from non owner`)
      expect(invitationCode).not.toBeUndefined()
      await settingsModal.closeTabThenModal()
    })

    it('Owner goes offline', async () => {
      await users.owner.app.close()
    })

    it('Second user opens the app', async () => {
      logger.info('Third client')
      await users.user3.app.open()
      const debugModal = new DebugModeModal(users.user3.app.driver)
      await debugModal.close()
    })

    it('Second user starts to join when owner is offline', async () => {
      const joinCommunityModal = new JoinCommunityModal(users.user3.app.driver)
      const isJoinCommunityModal = await joinCommunityModal.element.isDisplayed()
      expect(isJoinCommunityModal).toBeTruthy()
      logger.info({ invitationCode })
      await joinCommunityModal.typeCommunityInviteLink(invitationCode)
      await joinCommunityModal.submit()
    })

    it('Second user submits non-valid, duplicated username', async () => {
      logger.info('duplicated user - 1')
      const registerModal = new RegisterUsernameModal(users.user3.app.driver)
      const isRegisterModal = await registerModal.element.isDisplayed()
      expect(isRegisterModal).toBeTruthy()
      await registerModal.clearInput()
      await registerModal.typeUsername(users.user1.username)
      await registerModal.submit()
      logger.time(`[${users.user3.app.name}] '${users.user1.username}' duplicated joining community time`)
    })

    it('Second user submits valid username', async () => {
      logger.info('duplicated user - 2')
      const registerModal = new RegisterUsernameModal(users.user3.app.driver)
      const isRegisterModal = await registerModal.elementUsernameTaken.isDisplayed()
      expect(isRegisterModal).toBeTruthy()
      await registerModal.clearInput()
      await registerModal.typeUsername(users.user3.username)
      await registerModal.submitUsernameTaken()
      logger.time(`[${users.user3.app.name}] '${users.user3.username}' joining community time`)
    })

    it('Second user sees general channel', async () => {
      logger.info('new user - 7')
      generalChannelUser3 = new Channel(users.user3.app.driver, 'general')
      await generalChannelUser3.element.isDisplayed()
      const isMessageInput = await generalChannelUser3.messageInput.isDisplayed()
      expect(isMessageInput).toBeTruthy()
      logger.timeEnd(`[${users.user3.app.name}] '${users.user3.username}' joining community time`)
    })

    it('Second user can send a message, they see their message tagged as "unregistered"', async () => {
      logger.info('Second guest FETCHING CHANNEL MESSAGES!')
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
      await sidebarUser1.waitForChannels(['general'])
    })

    it('Channel deletion - User can create channel with the same name and is fresh channel', async () => {
      await sidebarUser1.addNewChannel(newChannelName)
      await sidebarUser1.switchChannel(newChannelName)
      const messages = await secondChannelUser1.getUserMessages(users.user1.username)
      expect(messages.length).toEqual(1)
      await sidebarOwner.waitForChannels(['general', newChannelName])
    })

    it('Channel deletion - Owner creates third channel', async () => {
      await sidebarOwner.addNewChannel(thirdChannelName)
      await sidebarOwner.switchChannel(thirdChannelName)
      thirdChannelOwner = new Channel(users.owner.app.driver, thirdChannelName)
      const messages = await thirdChannelOwner.getUserMessages(users.owner.username)
      expect(messages.length).toEqual(1)
      await sidebarUser1.waitForChannels(['general', newChannelName, thirdChannelName])
    })

    // End of tests for Windows
    if (process.platform !== 'win32') {
      it('User 1 closes app', async () => {
        logger.info('User 1 closes app')
        await users.user1.app?.close()
      })

      // Delete third channel while guest is absent
      it('Channel deletion - Owner deletes third channel', async () => {
        logger.info('TEST 2.5')
        await new Promise<void>(resolve => setTimeout(() => resolve(), 10000))
        const isThirdChannel = await thirdChannelOwner.messageInput.isDisplayed()
        expect(isThirdChannel).toBeTruthy()
        await channelContextMenuOwner.openMenu()
        await channelContextMenuOwner.openDeletionChannelModal()
        await channelContextMenuOwner.deleteChannel()
        await sidebarOwner.waitForChannels(['general', newChannelName])
      })

      // Delete general channel while guest is absent
      it('Channel deletion - Owner recreates general channel', async () => {
        logger.info('TEST 3')
        await new Promise<void>(resolve => setTimeout(() => resolve(), 10000))
        const isGeneralChannel = await generalChannelOwner.messageInput.isDisplayed()
        expect(isGeneralChannel).toBeTruthy()
        await channelContextMenuOwner.openMenu()
        await channelContextMenuOwner.openDeletionChannelModal()
        await channelContextMenuOwner.deleteChannel()
        await sidebarOwner.waitForChannels(['general', newChannelName])
      })

      it('User 1 re-opens app', async () => {
        logger.info('User 1 re-opens app')
        await users.user1.app?.open()
        await new Promise<void>(resolve => setTimeout(() => resolve(), 30000))
      })

      // Check correct channels replication
      it('Channel deletion - User sees information about recreation general channel and see correct amount of messages (#2334)', async () => {
        logger.info('TESTING - ISSUE 2334')
        generalChannelUser1 = new Channel(users.user1.app.driver, 'general')
        await generalChannelUser1.element.isDisplayed()
        logger.timeEnd(`[${users.user1.app.name}] '${users.user2.username}' joining community time`)
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
          `@${users.owner.username} deleted #${thirdChannelName}`
        )
        await generalChannelUser1.waitForUserMessage(
          users.owner.username,
          `@${users.user2.username} has joined Testcommunity! 🎉`
        )
      })

      it('Leave community', async () => {
        logger.info('TEST 2')
        const settingsModal = await new Sidebar(users.user1.app.driver).openSettings()
        const isSettingsModal = await settingsModal.element.isDisplayed()
        expect(isSettingsModal).toBeTruthy()
        await sleep(2000)
        await settingsModal.leaveCommunity()
      })

      it('Leave community - Guest re-join to community successfully', async () => {
        logger.info('TEST 4')
        const debugModal = new DebugModeModal(users.user1.app.driver)
        await debugModal.close()
        const joinCommunityModal = new JoinCommunityModal(users.user1.app.driver)
        const isJoinCommunityModal = await joinCommunityModal.element.isDisplayed()
        expect(isJoinCommunityModal).toBeTruthy()
        await joinCommunityModal.typeCommunityInviteLink(invitationCode)
        await joinCommunityModal.submit()
      })
      it('Leave community - Guest registers new username', async () => {
        logger.info('TEST 5')
        const registerModal2 = new RegisterUsernameModal(users.user1.app.driver)
        const isRegisterModal2 = await registerModal2.element.isDisplayed()
        expect(isRegisterModal2).toBeTruthy()
        await registerModal2.typeUsername(users.user2.username)
        await registerModal2.submit()
        logger.time(`[${users.user1.app.name}] '${users.user2.username}' joining community time`)
      })

      // Check correct channels replication
      it('Channel deletion - User sees information about recreation general channel and see correct amount of messages', async () => {
        logger.info('TEST 6')
        generalChannelUser1 = new Channel(users.user1.app.driver, 'general')
        await generalChannelUser1.element.isDisplayed()
        logger.timeEnd(`[${users.user1.app.name}] '${users.user2.username}' joining community time`)
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
        logger.info('TEST 7')
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
        logger.info('TEST 8')
        await generalChannelUser1.waitForUserMessage(users.user2.username, users.user2.messages[0])
      })
      it('Owner closes app', async () => {
        await users.owner.app.close({ forceSaveState: true })
        await new Promise<void>(resolve => setTimeout(() => resolve(), 20000))
      })

      it('Guest closes app', async () => {
        logger.info('TEST 9')
        await users.user1.app?.close()
      })

      it('Owner re-opens app', async () => {
        await users.owner.app?.open()
        await new Promise<void>(resolve => setTimeout(() => resolve(), 10000))
      })

      it('Guest closes app - Owner sends another message after guest left the app', async () => {
        logger.info('TEST 10')
        generalChannelOwner = new Channel(users.owner.app.driver, 'general')
        const isMessageInput = await generalChannelOwner.messageInput.isDisplayed()
        expect(isMessageInput).toBeTruthy()
        await generalChannelOwner.sendMessage(users.owner.messages[2])
      })
      it('Guest closes app - Check if message is visible for owner', async () => {
        logger.info('TEST 11')
        await generalChannelOwner.waitForUserMessage(users.owner.username, users.owner.messages[2])
      })
    }
  })
})
