import { ThenableWebDriver } from 'selenium-webdriver'
import {
  Channel,
  CreateCommunityModal,
  DebugModeModal,
  JoinCommunityModal,
  LoadingPanel,
  RegisterUsernameModal
} from './newSelectors'
import { BuildSetup } from './test.utils'

jest.setTimeout(350000)
describe('Smoke', () => {
  let buildSetup: BuildSetup
  let driver: ThenableWebDriver
  const port = 9515
  beforeAll(async () => {
    buildSetup = new BuildSetup(port)
    await buildSetup.createChromeDriver()
    driver = buildSetup.getDriver()
    await driver.getSession()
  })

  afterAll(async () => {
    await buildSetup.closeDriver()
    buildSetup.killChromeDriver()
  })
  describe('Stages:', () => {
    it('User waits for the modal Starting Quiet to disappear', async () => {
      console.log(1)
      const loadingPanel = new LoadingPanel(driver, 'Starting Quiet')
      const isLoadingPanel = await loadingPanel.element.isDisplayed()
      expect(isLoadingPanel).toBeTruthy()
    })
    console.log('if windows', process.env.TEST_SYSTEM)
    if (process.env.TEST_SYSTEM === 'windows') {
      console.log('if windows', process.env.TEST_SYSTEM)
      it('Debug Modal', async () => {
        console.log('Debug Modal')
        const debugModal = new DebugModeModal(driver)
        const isDebugModal = await debugModal.element.isDisplayed()
        expect(isDebugModal).toBeTruthy()
        await debugModal.close()
      })
    }

    it('User sees "join community" page and switches to "create community" view by clicking on the link', async () => {
      console.log(2)
      const joinModal = new JoinCommunityModal(driver)
      const isJoinModal = await joinModal.element.isDisplayed()
      expect(isJoinModal).toBeTruthy()

      if (!isJoinModal) {
        const generalChannel = new Channel(driver, 'general')
        const isGeneralChannel = await generalChannel.element.isDisplayed()

        expect(isGeneralChannel).toBeTruthy()
      } else {
        await joinModal.switchToCreateCommunity()
      }
    })

    it('User is on "Create community" page, enters valid community name and presses the button', async () => {
      console.log(3)
      const createModal = new CreateCommunityModal(driver)
      const isCreateModal = await createModal.element.isDisplayed()
      expect(isCreateModal).toBeTruthy()
      await createModal.typeCommunityName('testcommunity')
      await createModal.submit()
    })

    it('User sees "register username" page, enters the valid name and submits by clicking on the button', async () => {
      console.log(4)
      const registerModal = new RegisterUsernameModal(driver)
      const isRegisterModal = await registerModal.element.isDisplayed()

      expect(isRegisterModal).toBeTruthy()
      await registerModal.typeUsername('testuser')
      await registerModal.submit()
    })

    it('User waits for the modal Connecting to peers to disappear', async () => {
      console.log(5)
      const loadingPanelCommunity = new LoadingPanel(driver, 'Connecting to peers')
      const isLoadingPanelCommunity = await loadingPanelCommunity.element.isDisplayed()
      expect(isLoadingPanelCommunity).toBeTruthy()
    })

    it('User sees general channel', async () => {
      console.log(6)
      const generalChannel = new Channel(driver, 'general')
      const isGeneralChannel = await generalChannel.element.isDisplayed()
      const generalChannelText = await generalChannel.element.getText()
      expect(isGeneralChannel).toBeTruthy()
      expect(generalChannelText).toEqual('# general')
    })
  })
})
