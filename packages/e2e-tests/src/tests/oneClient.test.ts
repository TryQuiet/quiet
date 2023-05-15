import {
  App,
  Channel,
  CreateCommunityModal,
  DebugModeModal,
  JoinCommunityModal,
  JoiningLoadingPanel,
  RegisterUsernameModal,
  StartingLoadingPanel
} from '../selectors'
import getPort from 'get-port'
import { fork } from 'child_process'
import path from 'path'

jest.setTimeout(450000)
describe('One Client', () => {
  let app: App
  let dataDirPath: string
  let resourcesPath: string

  beforeAll(async () => {
    app = new App()
    await app.open()
  })

  afterAll(async () => {
    await app.close()
  })
  describe('User opens app for the first time', () => {
    if (process.env.TEST_MODE) {
      it('Close debug modal', async () => {
        const debugModal = new DebugModeModal(app.driver)
        await debugModal.close()
      })
    }

    it('User waits for the modal StartingLoadingPanel to disappear', async () => {
      const loadingPanel = new StartingLoadingPanel(app.driver)
      const isLoadingPanel = await loadingPanel.element.isDisplayed()
      expect(isLoadingPanel).toBeTruthy()
    })

    it('Get opened app process data', () => {
      const processData = app.buildSetup.getProcessData()
      dataDirPath = processData.dataDirPath
      resourcesPath = processData.resourcesPath
    })

    it('User sees "join community" page and switches to "create community" view by clicking on the link', async () => {
      const joinModal = new JoinCommunityModal(app.driver)
      const isJoinModal = await joinModal.element.isDisplayed()
      expect(isJoinModal).toBeTruthy()

      if (!isJoinModal) {
        const generalChannel = new Channel(app.driver, 'general')
        const isGeneralChannel = await generalChannel.element.isDisplayed()

        expect(isGeneralChannel).toBeTruthy()
      } else {
        await joinModal.switchToCreateCommunity()
      }
    })

    it('User is on "Create community" page, enters valid community name and presses the button', async () => {
      const createModal = new CreateCommunityModal(app.driver)
      const isCreateModal = await createModal.element.isDisplayed()
      expect(isCreateModal).toBeTruthy()
      await createModal.typeCommunityName('testcommunity')
      await createModal.submit()
    })

    it('User sees "register username" page, enters the valid name and submits by clicking on the button', async () => {
      const registerModal = new RegisterUsernameModal(app.driver)
      const isRegisterModal = await registerModal.element.isDisplayed()

      expect(isRegisterModal).toBeTruthy()
      await registerModal.typeUsername('testuser')
      await registerModal.submit()
    })

    it('User waits for the modal JoiningLoadingPanel to disappear', async () => {
      const loadingPanelCommunity = new JoiningLoadingPanel(app.driver)
      const isLoadingPanelCommunity = await loadingPanelCommunity.element.isDisplayed()
      expect(isLoadingPanelCommunity).toBeTruthy()
    })

    it('User sees general channel', async () => {
      const generalChannel = new Channel(app.driver, 'general')
      const isGeneralChannel = await generalChannel.element.isDisplayed()
      const generalChannelText = await generalChannel.element.getText()
      expect(isGeneralChannel).toBeTruthy()
      expect(generalChannelText).toEqual('# general')
    })
  })

  if (process.platform === 'linux') {
    // TODO: Fix test for win32 and macos
    describe('User can open the app despite hanging backend process', () => {
      it('User closes the app but leaves hanging backend', async () => {
        const forkArgvs = [
          '-d',
          `${await getPort()}`,
          '-a',
          `${dataDirPath}`,
          '-r',
          `${resourcesPath}`,
          '-p',
          'desktop'
        ]
        const backendBundlePath = path.normalize(require.resolve('backend-bundle'))
        console.log('Spawning backend', backendBundlePath, 'with argvs:', forkArgvs)
        fork(backendBundlePath, forkArgvs)
        await app.close({ forceSaveState: true })
      })

      it('Opens app again', async () => {
        await app.open()
      })

      if (process.env.TEST_MODE) {
        it('Close debug modal', async () => {
          const debugModal = new DebugModeModal(app.driver)
          await debugModal.close()
        })
      }

      it('User waits for the modal StartingLoadingPanel to disappear', async () => {
        const loadingPanel = new StartingLoadingPanel(app.driver)
        const isLoadingPanel = await loadingPanel.element.isDisplayed()
        expect(isLoadingPanel).toBeTruthy()
      })

      it('User sees "general channel" page', async () => {
        const generalChannel = new Channel(app.driver, 'general')
        const isGeneralChannel = await generalChannel.element.isDisplayed()
        expect(isGeneralChannel).toBeTruthy()
      })
    })
  }
})
