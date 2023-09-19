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
} from '../selectors'
import logger from '../logger'
const log = logger('Two Clients:')

jest.setTimeout(900000)
describe('Multiple Clients', () => {
  let ownerApp: App
  let guestApp: App
  let secondGuestApp: App

  let registerModal2: RegisterUsernameModal
  let registerModal3: RegisterUsernameModal

  let ownerGeneralChannel: Channel
  let generalChannel2: Channel
  let secondGuestGeneralChannel: Channel

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
  const joiningUserUsername3 = 'alice-unregistered'

  const joiningUserMessages = ['Nice to meet you all', 'Nice to meet you again', 'Hi everyone']
  const newChannelName = 'mid-night-club'

  const sleep = async (time = 1000) =>
    await new Promise<void>(resolve =>
      setTimeout(() => {
        resolve()
      }, time)
    )

  beforeAll(async () => {
    ownerApp = new App()
  })

  afterAll(async () => {
    await ownerApp?.close()
    await guestApp?.close()
    await secondGuestApp?.close()
  })

  beforeEach(async () => {
    await sleep(1000)
  })

  describe('Stages:', () => {
    it('Owner opens the app', async () => {
      await ownerApp.open()
    })

    it('JoinCommunityModal - owner switches to create community modal', async () => {
      const joinModal = new JoinCommunityModal(ownerApp.driver)
      const isJoinModal = await joinModal.element.isDisplayed()
      expect(isJoinModal).toBeTruthy()
      await joinModal.switchToCreateCommunity()
    })
    it('CreateCommunityModal - owner creates the community', async () => {
      const createModal = new CreateCommunityModal(ownerApp.driver)
      const isCreateModal = await createModal.element.isDisplayed()
      expect(isCreateModal).toBeTruthy()
      await createModal.typeCommunityName(communityName)
      await createModal.submit()
    })
    it('RegisterUsernameModal - owner registers username', async () => {
      const registerModal = new RegisterUsernameModal(ownerApp.driver)
      const isRegisterModal = await registerModal.element.isDisplayed()
      expect(isRegisterModal).toBeTruthy()
      await registerModal.typeUsername(ownerUsername)
      await registerModal.submit()
    })
    it.skip('Connecting to peers modal', async () => {
      const loadingPanelCommunity = new JoiningLoadingPanel(ownerApp.driver)
      const isLoadingPanelCommunity = await loadingPanelCommunity.element.isDisplayed()
      expect(isLoadingPanelCommunity).toBeTruthy()
    })
    it('Owner sees general channel', async () => {
      ownerGeneralChannel = new Channel(ownerApp.driver, 'general')
      const isGeneralChannel = await ownerGeneralChannel.element.isDisplayed()
      const generalChannelText = await ownerGeneralChannel.element.getText()
      expect(isGeneralChannel).toBeTruthy()
      expect(generalChannelText).toEqual('# general')
    })
    it('Owner sends a message', async () => {
      const isMessageInput = await ownerGeneralChannel.messageInput.isDisplayed()
      expect(isMessageInput).toBeTruthy()
      await ownerGeneralChannel.sendMessage(ownerMessages[0])
    })
    it("Owner's message is visible on channel", async () => {
      const messages = await ownerGeneralChannel.getUserMessages(ownerUsername)
      const text = await messages[1].getText()
      expect(text).toEqual(ownerMessages[0])
    })
    it('Owner opens the settings tab and gets an invitation code', async () => {
      const settingsModal = await new Sidebar(ownerApp.driver).openSettings()
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

    it('Guest opens the app', async () => {
      console.log('Second client')
      guestApp = new App()
      await guestApp.open()
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

    it('RegisterUsernameModal - Guest submits the username', async () => {
      console.log('new user - 5')
      registerModal2 = new RegisterUsernameModal(guestApp.driver)
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
    it('Guest sees general channel and sends a message', async () => {
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
      const messages2 = await generalChannel2.getUserMessages(joiningUserUsername)
      const messages1 = await generalChannel2.getUserMessages(ownerUsername)

      console.log({ messages1, messages2 })
      const text2 = await messages2[0].getText()
      expect(text2).toEqual(joiningUserMessages[0])
    })

    it('Guest opens the settings tab and gets an updated invitation code', async () => {
      const settingsModal = await new Sidebar(guestApp.driver).openSettings()
      const isSettingsModal = await settingsModal.element.isDisplayed()
      expect(isSettingsModal).toBeTruthy()
      await sleep(2000)
      await settingsModal.switchTab('invite')
      await sleep(2000)
      const invitationCodeElement = await settingsModal.invitationCode()
      await sleep(2000)
      invitationCode = await invitationCodeElement.getText()
      await sleep(2000)
      console.log(`${invitationCode} copied from first user`)
      expect(invitationCode).not.toBeUndefined()
      await settingsModal.close()
    })

    // third user joins when owner is offline. Does not use duplicated username
    it('Owner goes offline', async () => {
      await ownerApp.close()
    })

    it('Second guest opens the app', async () => {
      console.log('Third client')
      secondGuestApp = new App()
      await secondGuestApp.open()
      const debugModal = new DebugModeModal(secondGuestApp.driver)
      await debugModal.close()
    })

    it('Second guest starts to register when owner is offline', async () => {
      // console.log('new user - 3')
      const joinCommunityModal = new JoinCommunityModal(secondGuestApp.driver)
      const isJoinCommunityModal = await joinCommunityModal.element.isDisplayed()
      expect(isJoinCommunityModal).toBeTruthy()
      console.log({ invitationCode })
      await joinCommunityModal.typeCommunityCode(invitationCode)
      await joinCommunityModal.submit()
    })

    it('Second guest submits username that is not used by other user', async () => {
      console.log('nereeew user - 5')
      registerModal3 = new RegisterUsernameModal(secondGuestApp.driver)
      const isRegisterModal = await registerModal3.element.isDisplayed()
      expect(isRegisterModal).toBeTruthy()
      await registerModal3.clearInput()
      await registerModal3.typeUsername(joiningUserUsername3)
      await registerModal3.submit()
    })

    it('Second quest sees general channel', async () => {
      console.log('new user - 7')
      secondGuestGeneralChannel = new Channel(secondGuestApp.driver, 'general')
      await secondGuestGeneralChannel.element.isDisplayed()
      const isMessageInput = await secondGuestGeneralChannel.messageInput.isDisplayed()
      expect(isMessageInput).toBeTruthy()
    })

    it('Second guest can send a message, they see their message tagged as "unregistered"', async () => {
      console.log('FETCHING CHANNEL MESSAGES!')
      await new Promise<void>(resolve =>
        setTimeout(() => {
          resolve()
        }, 15000)
      )
      await secondGuestGeneralChannel.sendMessage(joiningUserMessages[2])
      secondGuestGeneralChannel = new Channel(secondGuestApp.driver, 'general')
      const guestlabels = await ownerGeneralChannel.getUserLabels(joiningUserUsername3)
      expect(guestlabels.length).toEqual(1)
      for (const label in guestlabels) {
        expect(label).toEqual('Unregistered')
      }
    })

    // TODO: check if other user also sees unregistered user marked as "registered"
    it('First user sees that unregistered user messages are marked as "unregistered"', async () => {
      const guestlabels = await generalChannel2.getUserLabels(joiningUserUsername3)
      expect(guestlabels.length).toEqual(1)
      for (const label in guestlabels) {
        expect(label).toEqual('Unregistered')
      }
    })

    it('Owner goes back online', async () => {
      await ownerApp.open()
      const debugModal = new DebugModeModal(ownerApp.driver)
      await debugModal.close()
    })

    it('Unregistered user receives certificate, the "Unregistered" label is removed', async () => {
      ownerGeneralChannel = new Channel(ownerApp.driver, 'general')
      const ownerAppLabels = await ownerGeneralChannel.getUserLabels(joiningUserUsername3)
      expect(ownerAppLabels.length).toEqual(0)
    })

    // TODO: maybe add extra "it" with "channel creation"?
    it('Channel creation - Owner creates second channel', async () => {
      sidebar = new Sidebar(ownerApp.driver)
      await sidebar.addNewChannel(newChannelName)
      await sidebar.switchChannel(newChannelName)
      const channels = await sidebar.getChannelList()
      expect(channels.length).toEqual(2)
    })
    it('Channel creation - Owner sends message in second channel', async () => {
      secondChannel = new Channel(ownerApp.driver, newChannelName)
      const isMessageInput = await secondChannel.messageInput.isDisplayed()
      expect(isMessageInput).toBeTruthy()
      await secondChannel.sendMessage(ownerMessages[1])
    })
    it('Channel creation - User reads message in second channel', async () => {
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
    it('Channel deletion - Owner deletes second channel', async () => {
      channelContextMenu = new ChannelContextMenu(ownerApp.driver)
      await channelContextMenu.openMenu()
      await channelContextMenu.openDeletionChannelModal()
      await channelContextMenu.deleteChannel()
      const channels = await sidebar.getChannelList()
      expect(channels.length).toEqual(1)
    })
    it('Channel deletion - User sees info about channel deletion in general channel', async () => {
      await sleep(5000)
      const messages = await generalChannel2.getUserMessages(ownerUsername)
      const text = await messages[3].getText()
      expect(text).toEqual(`@${ownerUsername} deleted #${newChannelName}`)
    })
    it('Channel deletion - User can create channel with the same name and is fresh channel', async () => {
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
    // End of tests for Windows
    if (process.platform !== 'win32') {
      it('Leave community', async () => {
        console.log('TEST 2')
        const settingsModal = await new Sidebar(guestApp.driver).openSettings()
        const isSettingsModal = await settingsModal.element.isDisplayed()
        expect(isSettingsModal).toBeTruthy()
        await settingsModal.openLeaveCommunityModal()
        await settingsModal.leaveCommunityButton()
      })
      // Delete general channel while guest is absent
      it('Channel deletion - Owner recreate general channel', async () => {
        console.log('TEST 3')
        await new Promise<void>(resolve => setTimeout(() => resolve(), 10000))
        const isGeneralChannel = await ownerGeneralChannel.messageInput.isDisplayed()
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
      it('Owner close app', async () => {
        await ownerApp.close({ forceSaveState: true })
        await new Promise<void>(resolve => setTimeout(() => resolve(), 20000))
      })

      it('Guest close app', async () => {
        console.log('TEST 9')
        await guestApp?.close()
      })

      it('Owner re-open app', async () => {
        await ownerApp?.open()
        await new Promise<void>(resolve => setTimeout(() => resolve(), 10000))
      })

      it('Guest close app - Owner send another message after guest leave app', async () => {
        console.log('TEST 10')
        ownerGeneralChannel = new Channel(ownerApp.driver, 'general')
        const isMessageInput = await ownerGeneralChannel.messageInput.isDisplayed()
        expect(isMessageInput).toBeTruthy()
        await ownerGeneralChannel.sendMessage(ownerMessages[2])
      })
      it('Guest close app - Check if message is visible for owner', async () => {
        console.log('TEST 11')
        const messages = await ownerGeneralChannel.getUserMessages(ownerUsername)
        const text = await messages[messages.length - 1].getText()
        expect(text).toEqual(ownerMessages[2])
      })
    }
  })
})
