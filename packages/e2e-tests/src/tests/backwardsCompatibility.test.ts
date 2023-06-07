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
  UpdateModal
} from '../selectors'

jest.setTimeout(450000)
describe('Backwards Compatibility', () => {
  let ownerAppOldVersion: App
  let ownerAppNewVersion: App

  let generalChannel: Channel
  let secondChannel: Channel
  let channelContextMenu: ChannelContextMenu
  let messagesToCompare

  let sidebar: Sidebar
  const dataDir = `e2e_${(Math.random() * 10 ** 18).toString(36)}`
  const communityName = 'testcommunity'
  const ownerUsername = 'bob'
  const ownerMessages = ['Hi', 'Hello', 'After guest leave app']
  // const loopMessages = 'abcdefghijklmnoprstuwxyz'.split('')
  const loopMessages = 'abc'.split('')
  const joiningUserUsername = 'alice-joining'
  const joiningUserUsername2 = 'alice2'
  const joiningUserMessages = ['Nice to meet you all', 'Nice to meet you again']
  const newChannelName = 'mid-night-club'

  beforeAll(async () => {
    ownerAppOldVersion = new App({ dataDir, fileName: 'Quiet-1.2.0.AppImage' })
  })

  afterAll(async () => {
    await new Promise<void>(resolve => setTimeout(() => resolve(), 15000))
    await ownerAppNewVersion?.close()
  })
  describe('User opens app for the first time', () => {
    it('Owner opens the app', async () => {
      await ownerAppOldVersion.open()
    })

    it('StartingLoadingPanel modal', async () => {
      const loadingPanel = new StartingLoadingPanel(ownerAppOldVersion.driver)
      const isLoadingPanel = await loadingPanel.element.isDisplayed()
      expect(isLoadingPanel).toBeTruthy()
    })
    it('JoinCommunityModal - owner switch to create community', async () => {
      const joinModal = new JoinCommunityModal(ownerAppOldVersion.driver)
      const isJoinModal = await joinModal.element.isDisplayed()
      expect(isJoinModal).toBeTruthy()
      await joinModal.switchToCreateCommunity()
    })
    it('CreateCommunityModal - owner create his community', async () => {
      const createModal = new CreateCommunityModal(ownerAppOldVersion.driver)
      const isCreateModal = await createModal.element.isDisplayed()
      expect(isCreateModal).toBeTruthy()
      await createModal.typeCommunityName(communityName)
      await createModal.submit()
    })
    it('RegisterUsernameModal - owner has registered', async () => {
      const registerModal = new RegisterUsernameModal(ownerAppOldVersion.driver)
      const isRegisterModal = await registerModal.element.isDisplayed()
      expect(isRegisterModal).toBeTruthy()
      await registerModal.typeUsername(ownerUsername)
      await registerModal.submit()
    })
    it('Connecting to peers modal', async () => {
      const loadingPanelCommunity = new JoiningLoadingPanel(ownerAppOldVersion.driver)
      const isLoadingPanelCommunity = await loadingPanelCommunity.element.isDisplayed()
      expect(isLoadingPanelCommunity).toBeTruthy()
    })

    it('Close update modal', async () => {
      console.log('waiting for update modal')
      await new Promise<void>(resolve => setTimeout(() => resolve(), 100000))
      const updateModal = new UpdateModal(ownerAppOldVersion.driver)
      console.log('Update Modal - before check with display')
      const isUpdateModal = await updateModal.element.isDisplayed()
      console.log('Update Modal - after check with display', isUpdateModal)
      expect(isUpdateModal).toBeTruthy()
      console.log('Update Modal - before close')
      await updateModal.close()
      console.log('Update Modal - after close')
    })
    it('General channel check', async () => {
      generalChannel = new Channel(ownerAppOldVersion.driver, 'general')
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
    it('Channel creation - Owner create second channel', async () => {
      sidebar = new Sidebar(ownerAppOldVersion.driver)
      await sidebar.addNewChannel(newChannelName)
      await sidebar.switchChannel(newChannelName)
      const channels = await sidebar.getChannelList()
      expect(channels.length).toEqual(2)
    })
    it('Channel creation - Owner send message in second channel', async () => {
      secondChannel = new Channel(ownerAppOldVersion.driver, newChannelName)
      const isMessageInput = await secondChannel.messageInput.isDisplayed()
      expect(isMessageInput).toBeTruthy()
      await secondChannel.sendMessage(ownerMessages[1])
    })
    it('Visible message in second channel', async () => {
      const messages = await secondChannel.getUserMessages(ownerUsername)
      const text = await messages[1].getText()
      expect(text).toEqual(ownerMessages[1])
    })

    it('Generate random messages on second channel', async () => {
      for (const message of loopMessages) {
        await secondChannel.sendMessage(message)
      }

      messagesToCompare = await secondChannel.getUserMessages(ownerUsername)
    })
    it('Close old app', async () => {
      await ownerAppOldVersion.close()
    })

    // ________________________________

    it('Owner opens the app on new version', async () => {
      ownerAppNewVersion = new App({ dataDir })
      await ownerAppNewVersion.open()
    })

    if (process.env.TEST_MODE) {
      it('Close debug modal', async () => {
        const debugModal = new DebugModeModal(ownerAppNewVersion.driver)
        await debugModal.close()
      })
    }

    it('StartingLoadingPanel modal', async () => {
      const loadingPanel = new StartingLoadingPanel(ownerAppNewVersion.driver)
      const isLoadingPanel = await loadingPanel.element.isDisplayed()
      expect(isLoadingPanel).toBeTruthy()
    })

    it('General channel check', async () => {
      generalChannel = new Channel(ownerAppNewVersion.driver, 'general')
      const isGeneralChannel = await generalChannel.element.isDisplayed()
      const generalChannelText = await generalChannel.element.getText()
      expect(isGeneralChannel).toBeTruthy()
      expect(generalChannelText).toEqual('# general')
    })

    it.skip('Check amount of messages on second channel ', async () => {
      await new Promise<void>(resolve => setTimeout(() => resolve(), 5000))
      sidebar = new Sidebar(ownerAppNewVersion.driver)

      await sidebar.switchChannel(newChannelName)
      secondChannel = new Channel(ownerAppNewVersion.driver, newChannelName)

      const currentMessages = await secondChannel.getUserMessages(ownerUsername)
      expect(currentMessages.length).toEqual(messagesToCompare.length)
    })
  })
})
