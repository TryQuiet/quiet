import { ThenableWebDriver } from 'selenium-webdriver'
import {
  Channel,
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

const log = logger('newUser:')

jest.setTimeout(900000)
describe('New User', () => {
  let buildSetup: BuildSetup
  let driver: ThenableWebDriver
  const port = 9516
  const debugPort = 9517

  let buildSetup2: BuildSetup
  let driver2: ThenableWebDriver
  const port2 = 9518
  const debugPort2 = 9519

  let generalChannel: Channel
  let generalChannel2: Channel

  let invitationCode: string

  const communityName = 'testcommunity'
  const ownerUsername = 'bob'
  const ownerMessages = ['Hi']
  const joiningUserUsername = 'alice-joining'
  const joiningUserMessages = ['Nice to meet you all']
  beforeAll(async () => {
    buildSetup = new BuildSetup(port, debugPort)
    await buildSetup.createChromeDriver()
    driver = buildSetup.getDriver()
    await driver.getSession()
  })

  afterAll(async () => {
    await buildSetup.closeDriver()
    await buildSetup.killChromeDriver()

    await buildSetup2.closeDriver()
    await buildSetup2.killChromeDriver()
  })
  describe('Stages:', () => {
    it('Close debug modal', async () => {
      console.log('Debug modal')
      const debugModal = new DebugModeModal(driver)
      await debugModal.element.isDisplayed()
      const button = await debugModal.button
      console.log('Debug modal title is displayed')
      await button.isDisplayed()
      console.log('Button is displayed')
      await button.click()
      console.log('Button click')
      try {
        const log = await driver.executeScript('arguments[0].click();', button)
        console.log('executeScript', log)
      } catch (e) {
        console.log('Probably click properly close modal')
      }
    })

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
      console.log('invitationCode')
      await settingsModal.invitationCode()
      await settingsModal.close()
    })

    it('Guest setup', async () => {
      console.log('Second client')
      buildSetup2 = new BuildSetup(port2, debugPort2)
      await buildSetup2.createChromeDriver()
      driver2 = buildSetup2.getDriver()
      await driver2.getSession()
    })

    it('Close debug modal', async () => {
      console.log('Debug modal')
      const debugModal = new DebugModeModal(driver2)
      await debugModal.element.isDisplayed()
      const button = await debugModal.button
      console.log('Debug modal title is displayed')
      await button.isDisplayed()
      console.log('Button is displayed')
      await button.click()
      console.log('Button click')
      try {
        const log = await driver2.executeScript('arguments[0].click();', button)
        console.log('executeScript', log)
      } catch (e) {
        console.log('Probably click properly close modal')
      }
    })

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
      console.log('typeCommunityCode')
      await joinCommunityModal.typeCommunityCode()
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
      await new Promise<void>(resolve => setTimeout(() => resolve(), 35000))
      await generalChannel2.sendMessage(joiningUserMessages[0])
    })

    it('Sent message is visible in a channel', async () => {
      console.log('new user - 7')
      const messages2 = await generalChannel2.getUserMessages(joiningUserUsername)
      const text2 = await messages2[0].getText()
      expect(text2).toEqual(joiningUserMessages[0])
    })
  })
})
