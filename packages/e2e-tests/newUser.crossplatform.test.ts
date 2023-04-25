import { ThenableWebDriver } from 'selenium-webdriver'
import {
  Channel,
  ChannelContextMenu,
  CreateCommunityModal,
  DebugModeModal,
  JoinCommunityModal,
  JoiningLoadingPanel,
  RegisterUsernameModal,
  Sidebar,
  StartingLoadingPanel
} from './selectors.crossplatform'
import logger from './logger'
import { BuildSetup } from './crossplatform.utils'
import getPort from 'get-port'
const log = logger('newUser:')

jest.setTimeout(900000)
describe('New User', () => {
  let buildSetup: BuildSetup
  let driver: ThenableWebDriver

  let buildSetup2: BuildSetup
  let driver2: ThenableWebDriver

  let generalChannel: Channel
  let generalChannel2: Channel

  let secondChannel: Channel
  let secondChannel2: Channel

  let channelContextMenu: ChannelContextMenu

  let invitationCode: string

  let sidebar2: Sidebar

  const communityName = 'testcommunity'
  const ownerUsername = 'bob'
  const ownerMessages = ['Hi', 'Hello', 'After guest leave app']
  const joiningUserUsername = 'alice-joining'
  const joiningUserUsername2 = 'alice2'
  const joiningUserMessages = ['Nice to meet you all', 'Nice to meet you again']
  const newChannelName = 'mid-night-club'

  beforeAll(async () => {
    const port = await getPort()
    const debugPort = await getPort()
    buildSetup = new BuildSetup({ port, debugPort })
    await buildSetup.createChromeDriver()
    driver = buildSetup.getDriver()
    await driver.getSession()
  })

  afterAll(async () => {
    await buildSetup.closeDriver()
    await buildSetup.killChromeDriver()
  })
  describe('Stages:', () => {
    if (process.env.TEST_MODE) {
      it('Close debug modal', async () => {
        const debugModal = new DebugModeModal(driver)
        await debugModal.close()
      })
    }

    it('StartingLoadingPanel modal', async () => {
      const loadingPanel = new StartingLoadingPanel(driver)
      const isLoadingPanel = await loadingPanel.element.isDisplayed()
      expect(isLoadingPanel).toBeTruthy()
    })
    it('JoinCommunityModal - owner switch to create community', async () => {
      const joinModal = new JoinCommunityModal(driver)
      const isJoinModal = await joinModal.element.isDisplayed()
      expect(isJoinModal).toBeTruthy()
      await joinModal.switchToCreateCommunity()
    })
    it('CreateCommunityModal - owner create his community', async () => {
      const createModal = new CreateCommunityModal(driver)
      const isCreateModal = await createModal.element.isDisplayed()
      expect(isCreateModal).toBeTruthy()
      await createModal.typeCommunityName(communityName)
      await createModal.submit()
    })
    it('RegisterUsernameModal - owner has registered', async () => {
      const registerModal = new RegisterUsernameModal(driver)
      const isRegisterModal = await registerModal.element.isDisplayed()
      expect(isRegisterModal).toBeTruthy()
      await registerModal.typeUsername(ownerUsername)
      await registerModal.submit()
    })
    it('Connecting to peers modal', async () => {
      const loadingPanelCommunity = new JoiningLoadingPanel(driver)
      const isLoadingPanelCommunity = await loadingPanelCommunity.element.isDisplayed()
      expect(isLoadingPanelCommunity).toBeTruthy()
    })
    it('General channel check', async () => {
      generalChannel = new Channel(driver, 'general')
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
      const settingsModal = await new Sidebar(driver).openSettings()
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
      const port2 = await getPort()
      const debugPort2 = await getPort()
      buildSetup2 = new BuildSetup({ port: port2, debugPort: debugPort2 })
      await buildSetup2.createChromeDriver()
      driver2 = buildSetup2.getDriver()
      await driver2.getSession()
    })
    if (process.env.TEST_MODE) {
      it('Close debug modal', async () => {
        const debugModal = new DebugModeModal(driver2)
        await debugModal.close()
      })
    }
    it('StartingLoadingPanel modal', async () => {
      console.log('new user - 2')
      const loadingPanel = new StartingLoadingPanel(driver2)
      const isLoadingPanel = await loadingPanel.element.isDisplayed()
      expect(isLoadingPanel).toBeTruthy()
    })
    it('Guest joins the new community successfully', async () => {
      console.log('new user - 3')
      const joinCommunityModal = new JoinCommunityModal(driver2)
      const isJoinCommunityModal = await joinCommunityModal.element.isDisplayed()
      expect(isJoinCommunityModal).toBeTruthy()
      console.log({ invitationCode })
      await joinCommunityModal.typeCommunityCode(invitationCode)
      await joinCommunityModal.submit()
    })
    it('RegisterUsernameModal', async () => {
      console.log('new user - 4')
      const registerModal2 = new RegisterUsernameModal(driver2)
      const isRegisterModal2 = await registerModal2.element.isDisplayed()
      expect(isRegisterModal2).toBeTruthy()
      await registerModal2.typeUsername(joiningUserUsername)
      await registerModal2.submit()
    })
    it.skip('JoiningLoadingPanel', async () => {
      console.log('new user - 5')
      const loadingPanelCommunity2 = new JoiningLoadingPanel(driver)
      const isLoadingPanelCommunity2 = await loadingPanelCommunity2.element.isDisplayed()
      expect(isLoadingPanelCommunity2).toBeTruthy()
    })
    it('User sends a message', async () => {
      console.log('new user - 6')
      generalChannel2 = new Channel(driver2, 'general')
      await generalChannel2.element.isDisplayed()
      const isMessageInput2 = await generalChannel2.messageInput.isDisplayed()
      expect(isMessageInput2).toBeTruthy()
      console.log('FETCHING CHANNEL MESSAGES!')
      await new Promise<void>(resolve => setTimeout(() => resolve(), 5000))
      await generalChannel2.sendMessage(joiningUserMessages[0])
    })
    it('Sent message is visible in a channel', async () => {
      console.log('new user - 7')
      const messages2 = await generalChannel2.getUserMessages(joiningUserUsername)
      const text2 = await messages2[0].getText()
      expect(text2).toEqual(joiningUserMessages[0])
    })

    it('Channel creation - Owner create second channel', async () => {
      const sidebar = new Sidebar(driver)
      await sidebar.addNewChannel(newChannelName)
      await sidebar.switchChannel(newChannelName)
    })
    it('Channel creation - Owner send message in second channel', async () => {
      secondChannel = new Channel(driver, newChannelName)
      const isMessageInput = await secondChannel.messageInput.isDisplayed()
      expect(isMessageInput).toBeTruthy()
      await secondChannel.sendMessage(ownerMessages[1])
    })
    it('Channel creation - User read message in second channel', async () => {
      sidebar2 = new Sidebar(driver2)
      await sidebar2.switchChannel(newChannelName)
      secondChannel2 = new Channel(driver2, newChannelName)
      const messages = await secondChannel2.getUserMessages(ownerUsername)
      const text = await messages[1].getText()
      expect(text).toEqual(ownerMessages[1])
    })
    it('Channel deletion - Owner delete second channel', async () => {
      channelContextMenu = new ChannelContextMenu(driver)
      await channelContextMenu.openMenu()
      await channelContextMenu.openDeletionChannelModal()
      await channelContextMenu.deleteChannel()
    })
    it('Channel deletion - User see info about channel deletion in general channel', async () => {
      const messages = await generalChannel2.getUserMessages(ownerUsername)
      const text = await messages[3].getText()
      expect(text).toEqual(`@${ownerUsername} deleted #${newChannelName}`)
    })
    it('Channel deletion - User can create channel with the same name and is fresh channel', async () => {
      await sidebar2.addNewChannel(newChannelName)
      await sidebar2.switchChannel(newChannelName)
      const messages = await secondChannel2.getUserMessages(joiningUserUsername)
      expect(messages.length).toEqual(1)
    })

    it('Channel deletion - Owner recreate general channel', async () => {
      const isGeneralChannel = await generalChannel.messageInput.isDisplayed()
      expect(isGeneralChannel).toBeTruthy()
      await channelContextMenu.openMenu()
      await channelContextMenu.openDeletionChannelModal()
      await channelContextMenu.deleteChannel()
    })
    it('Channel deletion - User see information about recreation general channel', async () => {
      await sidebar2.switchChannel('general')
      const messages = await generalChannel2.getUserMessages(ownerUsername)
      const text = await messages[1].getText()
      expect(text).toEqual(`#general has been recreated by @${ownerUsername}`)
    })

    it('Leave community', async () => {
      const settingsModal = await new Sidebar(driver2).openSettings()
      const isSettingsModal = await settingsModal.element.isDisplayed()
      expect(isSettingsModal).toBeTruthy()
      await settingsModal.openLeaveCommunityModal()
      await settingsModal.leaveCommunityButton()
    })
    if (process.env.TEST_MODE) {
      it('Leave community - Close debug modal', async () => {
        const debugModal = new DebugModeModal(driver2)
        await debugModal.close()
      })
    }
    it('Leave community - Guest re-join to community successfully', async () => {
      const joinCommunityModal = new JoinCommunityModal(driver2)
      const isJoinCommunityModal = await joinCommunityModal.element.isDisplayed()
      expect(isJoinCommunityModal).toBeTruthy()
      await joinCommunityModal.typeCommunityCode(invitationCode)
      await joinCommunityModal.submit()
    })
    it('Leave community - Guest register new username', async () => {
      const registerModal2 = new RegisterUsernameModal(driver2)
      const isRegisterModal2 = await registerModal2.element.isDisplayed()
      expect(isRegisterModal2).toBeTruthy()
      await registerModal2.typeUsername(joiningUserUsername2)
      await registerModal2.submit()
    })
    it('Leave community - Guest sends a message', async () => {
      generalChannel2 = new Channel(driver2, 'general')
      await generalChannel2.element.isDisplayed()
      const isMessageInput2 = await generalChannel2.messageInput.isDisplayed()
      expect(isMessageInput2).toBeTruthy()
      await new Promise<void>(resolve => setTimeout(() => resolve(), 5000))
      await generalChannel2.sendMessage(joiningUserMessages[1])
    })
    it('Leave community - Sent message is visible in a channel', async () => {
      const messages2 = await generalChannel2.getUserMessages(joiningUserUsername2)
      const text2 = await messages2[0].getText()
      expect(text2).toEqual(joiningUserMessages[1])
    })

    it('Guest close app', async () => {
      await buildSetup2.closeDriver()
      await buildSetup2.killChromeDriver()
    })
    it('Guest close app - Owner send another message after guest leave app', async () => {
      const isMessageInput = await generalChannel.messageInput.isDisplayed()
      expect(isMessageInput).toBeTruthy()
      await generalChannel.sendMessage(ownerMessages[2])
    })
    it('Guest close app - Check if message is visible for owner', async () => {
      const messages = await generalChannel.getUserMessages(ownerUsername)
      const text = await messages[messages.length - 1].getText()
      expect(text).toEqual(ownerMessages[2])
    })
  })
})
