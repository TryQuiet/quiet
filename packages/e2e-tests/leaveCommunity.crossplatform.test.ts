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

const log = logger('leaveCommunity:')

jest.setTimeout(900000)
describe('Leave Community', () => {
  let buildSetup: BuildSetup
  let driver: ThenableWebDriver
  const port = 9520
  const debugPort = 9521

  let buildSetup2: BuildSetup
  let driver2: ThenableWebDriver
  const port2 = 9522
  const debugPort2 = 9523

  let generalChannel: Channel
  let generalChannel2: Channel

  let invitationCode: string

  const communityName = 'testcommunity'
  const ownerUsername = 'bob'
  const ownerMessages = ['Hi']

  const joiningUserMessages = ['Nice to meet you all']

  const joiningUserUsername1 = 'alice1'
  const joiningUserUsername2 = 'alice2'

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
    if (process.env.TEST_MODE) {
      it('Close debug modal', async () => {
        const debugModal = new DebugModeModal(driver)
        await debugModal.element.isDisplayed()
        const button = await debugModal.button
        await button.isDisplayed()
        await button.click()
        try {
          const log = await driver.executeScript('arguments[0].click();', button)
          console.log('executeScript', log)
        } catch (e) {
          console.log('Probably click properly close modal')
        }
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
      log('Received invitation code:', invitationCode)
      await settingsModal.close()
    })
    it('Guest setup', async () => {
      console.log('Second client')
      buildSetup2 = new BuildSetup(port2, debugPort2)
      await buildSetup2.createChromeDriver()
      driver2 = buildSetup2.getDriver()
      await driver2.getSession()
    })
    if (process.env.TEST_MODE) {
      it('Close debug modal', async () => {
        const debugModal = new DebugModeModal(driver2)
        await debugModal.element.isDisplayed()
        const button = await debugModal.button
        await button.isDisplayed()
        await button.click()
        try {
          const log = await driver2.executeScript('arguments[0].click();', button)
          console.log('executeScript', log)
        } catch (e) {
          console.log('Probably click properly close modal')
        }
      })
    }
    it('StartingLoadingPanel modal', async () => {
      const loadingPanel = new StartingLoadingPanel(driver2)
      const isLoadingPanel = await loadingPanel.element.isDisplayed()
      expect(isLoadingPanel).toBeTruthy()
    })
    it('Guest joins the new community successfully', async () => {
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
      await registerModal2.typeUsername(joiningUserUsername1)
      await registerModal2.submit()
    })
    it.skip('JoiningLoadingPanel', async () => {
      const loadingPanelCommunity2 = new JoiningLoadingPanel(driver)
      const isLoadingPanelCommunity2 = await loadingPanelCommunity2.element.isDisplayed()
      expect(isLoadingPanelCommunity2).toBeTruthy()
    })
    it('Channels are visible', async () => {
      generalChannel2 = new Channel(driver2, 'general')
      await generalChannel2.element.isDisplayed()
      const isMessageInput2 = await generalChannel2.messageInput.isDisplayed()
      expect(isMessageInput2).toBeTruthy()

      await new Promise<void>(resolve => setTimeout(() => resolve(), 5000))
    })
    it('Leave community', async () => {
      const settingsModal = await new Sidebar(driver2).openSettings()
      const isSettingsModal = await settingsModal.element.isDisplayed()
      expect(isSettingsModal).toBeTruthy()
      await settingsModal.openLeaveCommunityModal()
      await settingsModal.leaveCommunityButton()
    })
    if (process.env.TEST_MODE) {
      it('Close debug modal', async () => {
        const debugModal = new DebugModeModal(driver2)
        await debugModal.element.isDisplayed()
        const button = await debugModal.button
        await button.isDisplayed()
        await button.click()

        try {
          const log = await driver2.executeScript('arguments[0].click();', button)
          console.log('executeScript', log)
        } catch (e) {
          console.log('Probably click properly close modal')
        }
      })
    }
    it('Guest re-join to community successfully', async () => {
      const joinCommunityModal = new JoinCommunityModal(driver2)
      const isJoinCommunityModal = await joinCommunityModal.element.isDisplayed()
      expect(isJoinCommunityModal).toBeTruthy()
      await joinCommunityModal.typeCommunityCode(invitationCode)
      await joinCommunityModal.submit()
    })
    it('Guest register new username', async () => {
      const registerModal2 = new RegisterUsernameModal(driver2)
      const isRegisterModal2 = await registerModal2.element.isDisplayed()
      expect(isRegisterModal2).toBeTruthy()
      await registerModal2.typeUsername(joiningUserUsername2)
      await registerModal2.submit()
    })
    it('Guest sends a message', async () => {
      generalChannel2 = new Channel(driver2, 'general')
      await generalChannel2.element.isDisplayed()
      const isMessageInput2 = await generalChannel2.messageInput.isDisplayed()
      expect(isMessageInput2).toBeTruthy()
      await new Promise<void>(resolve => setTimeout(() => resolve(), 5000))
      await generalChannel2.sendMessage(joiningUserMessages[0])
    })
    it('Sent message is visible in a channel', async () => {
      const messages2 = await generalChannel2.getUserMessages(joiningUserUsername2)
      const text2 = await messages2[0].getText()
      expect(text2).toEqual(joiningUserMessages[0])
    })
  })
})
