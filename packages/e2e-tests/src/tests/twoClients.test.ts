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
  StartingLoadingPanel,
} from '../selectors'
import logger from '../logger'
const log = logger('Two Clients:')

jest.setTimeout(900000)
describe('Two Clients', () => {
  let ownerApp: App
  let guestApp: App

  let registerModal2: RegisterUsernameModal

  let generalChannel: Channel
  let generalChannel2: Channel

  let secondChannel: Channel
  let secondChannel2: Channel

  let channelContextMenu: ChannelContextMenu

  let invitationCode: string

  let sidebar: Sidebar
  let sidebar2: Sidebar

  const communityName = 'testcommunity'
  const ownerUsername = 'bob'
  const ownerMessages = ['Hi', 'Hello', 'After guest leave app']
  const joiningUserUsername = 'alice-joining'
  const joiningUserUsername2 = 'alice2'
  const joiningUserMessages = ['Nice to meet you all', 'Nice to meet you again']
  const newChannelName = 'mid-night-club'

  beforeAll(async () => {
    ownerApp = new App()
  })

  afterAll(async () => {
    await ownerApp?.close()
  })

  describe('Stages:', () => {
    it('Owner opens the app', async () => {
      await ownerApp.open()
    })

    if (process.env.TEST_MODE) {
      it('Close debug modal', async () => {
        const debugModal = new DebugModeModal(ownerApp.driver)
        await debugModal.close()
      })
    }

    it('StartingLoadingPanel modal', async () => {
      const loadingPanel = new StartingLoadingPanel(ownerApp.driver)
      const isLoadingPanel = await loadingPanel.element.isDisplayed()
      expect(isLoadingPanel).toBeTruthy()
    })
    it('JoinCommunityModal - owner switch to create community', async () => {
      const joinModal = new JoinCommunityModal(ownerApp.driver)
      const isJoinModal = await joinModal.element.isDisplayed()
      expect(isJoinModal).toBeTruthy()
      await joinModal.switchToCreateCommunity()
    })
    it('CreateCommunityModal - owner create his community', async () => {
      const createModal = new CreateCommunityModal(ownerApp.driver)
      const isCreateModal = await createModal.element.isDisplayed()
      expect(isCreateModal).toBeTruthy()
      await createModal.typeCommunityName(communityName)
      await createModal.submit()
    })
    it('RegisterUsernameModal - owner has registered', async () => {
      const registerModal = new RegisterUsernameModal(ownerApp.driver)
      const isRegisterModal = await registerModal.element.isDisplayed()
      expect(isRegisterModal).toBeTruthy()
      await registerModal.typeUsername(ownerUsername)
      await registerModal.submit()
    })
    it('Connecting to peers modal', async () => {
      const loadingPanelCommunity = new JoiningLoadingPanel(ownerApp.driver)
      const isLoadingPanelCommunity = await loadingPanelCommunity.element.isDisplayed()
      expect(isLoadingPanelCommunity).toBeTruthy()
    })
    it('General channel check', async () => {
      generalChannel = new Channel(ownerApp.driver, 'general')
      const isGeneralChannel = await generalChannel.element.isDisplayed()
      const generalChannelText = await generalChannel.element.getText()
      expect(isGeneralChannel).toBeTruthy()
      expect(generalChannelText).toEqual('# general')
    })
    it('Send message', async () => {
      const isMessageInput = await generalChannel.messageInput.isDisplayed()
      expect(isMessageInput).toBeTruthy()
      await generalChannel.sendMessage(ownerMessages[0])
    })
    it('Visible message', async () => {
      const messages = await generalChannel.getUserMessages(ownerUsername)
      const text = await messages[1].getText()
      expect(text).toEqual(ownerMessages[0])
    })
    it('Opens the settings tab and gets an invitation code', async () => {
      const settingsModal = await new Sidebar(ownerApp.driver).openSettings()
      const isSettingsModal = await settingsModal.element.isDisplayed()
      expect(isSettingsModal).toBeTruthy()
      await settingsModal.switchTab('invite') // TODO: Fix - the invite tab should be default for the owner
      const invitationCodeElement = await settingsModal.invitationCode()
      invitationCode = await invitationCodeElement.getText()
      console.log({ invitationCode })
      log('Received invitation code:', invitationCode)
      await settingsModal.close()
    })

    it('Guest setup', async () => {
      console.log('Second client')
      guestApp = new App()
      await guestApp.open()
    })
    if (process.env.TEST_MODE) {
      it('Close debug modal', async () => {
        const debugModal = new DebugModeModal(guestApp.driver)
        await debugModal.close()
      })
    }
    it('StartingLoadingPanel modal', async () => {
      console.log('new user - 2')
      const loadingPanel = new StartingLoadingPanel(guestApp.driver)
      const isLoadingPanel = await loadingPanel.element.isDisplayed()
      expect(isLoadingPanel).toBeTruthy()
    })
    it('Guest joins the new community successfully', async () => {
      console.log('new user - 3')
      const joinCommunityModal = new JoinCommunityModal(guestApp.driver)
      const isJoinCommunityModal = await joinCommunityModal.element.isDisplayed()
      expect(isJoinCommunityModal).toBeTruthy()
      console.log({ invitationCode })
      await joinCommunityModal.typeCommunityCode(invitationCode)
      await joinCommunityModal.submit()
    })

    it('RegisterUsernameModal - User tries to register already taken username, sees error', async () => {
      console.log('new user - 4')
      registerModal2 = new RegisterUsernameModal(guestApp.driver)
      const isRegisterModal2 = await registerModal2.element.isDisplayed()
      expect(isRegisterModal2).toBeTruthy()
      await registerModal2.typeUsername(ownerUsername)
      await registerModal2.submit()
      const usernameTakenError = await registerModal2.error.isDisplayed()
      expect(usernameTakenError).toBeTruthy()
    })

    it('RegisterUsernameModal - User successfully register not taken username', async () => {
      console.log('new user - 5')
      const isRegisterModal = await registerModal2.element.isDisplayed()
      expect(isRegisterModal).toBeTruthy()
      await registerModal2.clearInput()
      await registerModal2.typeUsername(joiningUserUsername)
      await registerModal2.submit()
    })

    it.skip('JoiningLoadingPanel', async () => {
      console.log('new user - 6')
      const loadingPanelCommunity2 = new JoiningLoadingPanel(ownerApp.driver)
      const isLoadingPanelCommunity2 = await loadingPanelCommunity2.element.isDisplayed()
      expect(isLoadingPanelCommunity2).toBeTruthy()
    })
    it('User sends a message', async () => {
      console.log('new user - 7')
      generalChannel2 = new Channel(guestApp.driver, 'general')
      await generalChannel2.element.isDisplayed()
      const isMessageInput2 = await generalChannel2.messageInput.isDisplayed()
      expect(isMessageInput2).toBeTruthy()
      console.log('FETCHING CHANNEL MESSAGES!')
      await new Promise<void>(resolve =>
        setTimeout(() => {
          resolve()
        }, 15000)
      )
      await generalChannel2.sendMessage(joiningUserMessages[0])
    })
    it('Sent message is visible in a channel', async () => {
      console.log('new user - 8')
      const messages2 = await generalChannel2.getUserMessages(joiningUserUsername)
      const text2 = await messages2[0].getText()
      expect(text2).toEqual(joiningUserMessages[0])
    })

    it('Channel creation - Owner create second channel', async () => {
      sidebar = new Sidebar(ownerApp.driver)
      await sidebar.addNewChannel(newChannelName)
      await sidebar.switchChannel(newChannelName)
      const channels = await sidebar.getChannelList()
      expect(channels.length).toEqual(2)
    })
    it('Channel creation - Owner send message in second channel', async () => {
      secondChannel = new Channel(ownerApp.driver, newChannelName)
      const isMessageInput = await secondChannel.messageInput.isDisplayed()
      expect(isMessageInput).toBeTruthy()
      await secondChannel.sendMessage(ownerMessages[1])
    })
    it('Channel creation - User read message in second channel', async () => {
      sidebar2 = new Sidebar(guestApp.driver)
      await sidebar2.switchChannel(newChannelName)
      secondChannel2 = new Channel(guestApp.driver, newChannelName)
      await new Promise<void>(resolve =>
        setTimeout(() => {
          resolve()
        }, 2000)
      )
      const messages = await secondChannel2.getUserMessages(ownerUsername)
      const text = await messages[1].getText()
      expect(text).toEqual(ownerMessages[1])
    })
    it('Channel deletion - Owner delete second channel', async () => {
      channelContextMenu = new ChannelContextMenu(ownerApp.driver)
      await channelContextMenu.openMenu()
      await channelContextMenu.openDeletionChannelModal()
      await channelContextMenu.deleteChannel()
      const channels = await sidebar.getChannelList()
      expect(channels.length).toEqual(1)
    })
    it('Channel deletion - User see info about channel deletion in general channel', async () => {
      const messages = await generalChannel2.getUserMessages(ownerUsername)
      const text = await messages[3].getText()
      expect(text).toEqual(`@${ownerUsername} deleted #${newChannelName}`)
    })
    it('Channel deletion - User can create channel with the same name and is fresh channel', async () => {
      console.log('TEST 1')
      await sidebar2.addNewChannel(newChannelName)
      await sidebar2.switchChannel(newChannelName)
      const messages = await secondChannel2.getUserMessages(joiningUserUsername)
      expect(messages.length).toEqual(1)
      await new Promise<void>(resolve =>
        setTimeout(() => {
          resolve()
        }, 2000)
      )
      const channels = await sidebar.getChannelList()
      expect(channels.length).toEqual(2)
    })

    it('Leave community', async () => {
      console.log('TEST 2')
      const settingsModal = await new Sidebar(guestApp.driver).openSettings()
      const isSettingsModal = await settingsModal.element.isDisplayed()
      expect(isSettingsModal).toBeTruthy()
      await settingsModal.openLeaveCommunityModal()
      await settingsModal.leaveCommunityButton()
    })
    if (process.env.TEST_MODE) {
      it('Leave community - Close debug modal', async () => {
        const debugModal = new DebugModeModal(guestApp.driver)
        await debugModal.close()
      })
    }
    // Delete general channel while guest is absent
    it('Channel deletion - Owner recreate general channel', async () => {
      console.log('TEST 3')
      await new Promise<void>(resolve => setTimeout(() => resolve(), 10000))
      const isGeneralChannel = await generalChannel.messageInput.isDisplayed()
      expect(isGeneralChannel).toBeTruthy()
      await channelContextMenu.openMenu()
      await channelContextMenu.openDeletionChannelModal()
      await channelContextMenu.deleteChannel()
      const channels = await sidebar.getChannelList()
      expect(channels.length).toEqual(2)
    })

    it('Leave community - Guest re-join to community successfully', async () => {
      console.log('TEST 4')
      const joinCommunityModal = new JoinCommunityModal(guestApp.driver)
      const isJoinCommunityModal = await joinCommunityModal.element.isDisplayed()
      expect(isJoinCommunityModal).toBeTruthy()
      await joinCommunityModal.typeCommunityCode(invitationCode)
      await joinCommunityModal.submit()
    })
    it('Leave community - Guest register new username', async () => {
      console.log('TEST 5')
      const registerModal2 = new RegisterUsernameModal(guestApp.driver)
      const isRegisterModal2 = await registerModal2.element.isDisplayed()
      expect(isRegisterModal2).toBeTruthy()
      await registerModal2.typeUsername(joiningUserUsername2)
      await registerModal2.submit()
    })

    // Check correct channels replication
    it('Channel deletion - User see information about recreation general channel and see correct amount of messages', async () => {
      console.log('TEST 6')
      generalChannel2 = new Channel(guestApp.driver, 'general')
      await generalChannel2.element.isDisplayed()
      await new Promise<void>(resolve =>
        setTimeout(() => {
          resolve()
        }, 10000)
      )
      const messages = await generalChannel2.getUserMessages(ownerUsername)
      const text1 = await messages[0].getText()
      const text2 = await messages[1].getText()
      expect(messages.length).toEqual(2)
      expect(text1).toEqual(`@${ownerUsername} deleted all messages in #general`)
      expect(text2).toEqual(`@${joiningUserUsername2} has joined Testcommunity! 🎉`)
    })

    it('Leave community - Guest sends a message', async () => {
      console.log('TEST 7')
      generalChannel2 = new Channel(guestApp.driver, 'general')
      await generalChannel2.element.isDisplayed()
      const isMessageInput2 = await generalChannel2.messageInput.isDisplayed()
      expect(isMessageInput2).toBeTruthy()
      await new Promise<void>(resolve =>
        setTimeout(() => {
          resolve()
        }, 5000)
      )
      await generalChannel2.sendMessage(joiningUserMessages[1])
    })
    it('Leave community - Sent message is visible in a channel', async () => {
      console.log('TEST 8')
      const messages2 = await generalChannel2.getUserMessages(joiningUserUsername2)
      const text2 = await messages2[0].getText()
      expect(text2).toEqual(joiningUserMessages[1])
    })

    it('Guest close app', async () => {
      console.log('TEST 9')
      await guestApp?.close()
    })
    it('Guest close app - Owner send another message after guest leave app', async () => {
      console.log('TEST 10')
      const isMessageInput = await generalChannel.messageInput.isDisplayed()
      expect(isMessageInput).toBeTruthy()
      await generalChannel.sendMessage(ownerMessages[2])
    })
    it('Guest close app - Check if message is visible for owner', async () => {
      console.log('TEST 11')
      const messages = await generalChannel.getUserMessages(ownerUsername)
      const text = await messages[messages.length - 1].getText()
      expect(text).toEqual(ownerMessages[2])
    })
  })
})
