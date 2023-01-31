import { ThenableWebDriver } from 'selenium-webdriver'
import {
  Channel,
  CreateCommunityModal,
  JoinCommunityModal,
  LoadingPanel,
  RegisterUsernameModal,
  Sidebar
} from './newSelectors'
import { BuildSetup } from './test.utils'
import logger from './logger'

const log = logger('newUser:')

jest.setTimeout(600000)
describe.only('New User', () => {
  let buildSetup: BuildSetup
  let driver: ThenableWebDriver
  const port = 9516

  let buildSetup2: BuildSetup
  let driver2: ThenableWebDriver
  const port2 = 9517

  let generalChannel: Channel
  let generalChannel2: Channel

  let invitationCode: string

  const communityName = 'testcommunity'
  const ownerUsername = 'bob'
  const ownerMessages = ['Hi']
  const joiningUserUsername = 'alice-joining'
  const joiningUserMessages = ['Nice to meet you all']
  beforeAll(async () => {
    buildSetup = new BuildSetup(port)
    await buildSetup.createChromeDriver()
    driver = buildSetup.getDriver()
    await driver.getSession()
  })

  afterAll(async () => {
    await buildSetup.closeDriver()
    buildSetup.killChromeDriver()

    await buildSetup2.closeDriver()
    buildSetup2.killChromeDriver()
  })
  describe('Stages:', () => {
    it('Starting Quiet modal', async () => {
      const loadingPanel = new LoadingPanel(driver, 'Starting Quiet')
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
      const loadingPanelCommunity = new LoadingPanel(driver, 'Connecting to peers')
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

    it('Guest opens the app and joins the new community successfully', async () => {
      console.log('Second client')
      buildSetup2 = new BuildSetup(port2)
      await buildSetup2.createChromeDriver()
      driver2 = buildSetup2.getDriver(true)
      await driver2.getSession()
      await new Promise<void>(resolve => setTimeout(() => resolve(), 10000))

      const joinCommunityModal = new JoinCommunityModal(driver2)
      const isJoinCommunityModal = await joinCommunityModal.element.isDisplayed()
      expect(isJoinCommunityModal).toBeTruthy()
      await joinCommunityModal.typeCommunityCode(invitationCode)
      await joinCommunityModal.submit()
    })

    it('RegisterUsernameModal', async () => {
      const registerModal2 = new RegisterUsernameModal(driver2)
      const isRegisterModal2 = await registerModal2.element.isDisplayed()
      expect(isRegisterModal2).toBeTruthy()
      await registerModal2.typeUsername(joiningUserUsername)
      await registerModal2.submit()
    })

    // it('LoadingPanel', async () => {
    //   const loadingPanelCommunity2 = new LoadingPanel(driver2, 'Connecting to peers')
    //   const isLoadingPanelCommunity2 = await loadingPanelCommunity2.element.isDisplayed()
    //   expect(isLoadingPanelCommunity2).toBeTruthy()
    // })

    it('User sends a message', async () => {
      generalChannel2 = new Channel(driver2, 'general')
      await generalChannel2.element.isDisplayed()
      const isMessageInput2 = await generalChannel2.messageInput.isDisplayed()
      expect(isMessageInput2).toBeTruthy()
      console.log('FETCHING CHANNEL MESSAGES!')
      await new Promise<void>(resolve => setTimeout(() => resolve(), 15000))
      await generalChannel2.sendMessage(joiningUserMessages[0])
    })

    it('Sent message is visible in a channel', async () => {
      const messages2 = await generalChannel2.getUserMessages(joiningUserUsername)
      const text2 = await messages2[0].getText()
      expect(text2).toEqual(joiningUserMessages[0])
    })
  })
})
