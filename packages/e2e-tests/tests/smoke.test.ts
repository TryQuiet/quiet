import { ThenableWebDriver } from 'selenium-webdriver'
import {
  Channel,
  CreateCommunityModal,
  JoinCommunityModal,
  LoadingPanel,
  RegisterUsernameModal
} from './selectors'
import { BuildSetup } from './utils'

jest.setTimeout(150000)
describe('Smoke', () => {
  let buildSetup: BuildSetup
  let driver: ThenableWebDriver
  beforeAll(async () => {
    buildSetup = new BuildSetup()
    await buildSetup.buildContainer()
    driver = buildSetup.getDriver()
    await driver.getSession()
  })

  afterAll(async () => {
    await buildSetup.closeDriver()
    await buildSetup.killContainer()
  })
  describe('Stages:', () => {
    it('User waits for the modal Starting Quiet to disappear', async () => {
      const loadingPanel = new LoadingPanel(driver, 'Starting Quiet')
      const isLoadingPanel = await loadingPanel.element.isDisplayed()
      expect(isLoadingPanel).toBeTruthy()
    })

    it('User sees "join community" page and switches to "create community" view by clicking on the link', async () => {
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
      const createModal = new CreateCommunityModal(driver)
      const isCreateModal = await createModal.element.isDisplayed()
      expect(isCreateModal).toBeTruthy()
      await createModal.typeCommunityName('testcommunity')
      await createModal.submit()
    })

    it('User sees "register username" page, enters the valid name and submits by clicking on the button', async () => {
      const registerModal = new RegisterUsernameModal(driver)
      const isRegisterModal = await registerModal.element.isDisplayed()

      expect(isRegisterModal).toBeTruthy()
      await registerModal.typeUsername('testuser')
      await registerModal.submit()
    })

    it('User waits for the modal Connecting to peers to disappear', async () => {
      const loadingPanelCommunity = new LoadingPanel(driver, 'Connecting to peers')
      const isLoadingPanelCommunity = await loadingPanelCommunity.element.isDisplayed()
      expect(isLoadingPanelCommunity).toBeTruthy()
    })

    it('User sees general channel', async () => {
      const generalChannel = new Channel(driver, 'general')
      const isGeneralChannel = await generalChannel.element.isDisplayed()
      const generalChannelText = await generalChannel.element.getText()
      expect(isGeneralChannel).toBeTruthy()
      expect(generalChannelText).toEqual('# general')
    })
  })
})
