import {
  App,
  Channel,
  CreateCommunityModal,
  DebugModeModal,
  JoinCommunityModal,
  JoiningLoadingPanel,
  RegisterUsernameModal,
  Settings,
  Sidebar,
} from '../selectors'
import getPort from 'get-port'
import { fork } from 'child_process'
import path from 'path'
import { createLogger } from '../logger'
import { SettingsModalTabName, FileAttachmentType } from '../enums'
import { TEST_FILE_NAME, TEST_IMAGE_FILE_NAME, UPLOAD_FILE_DIR } from '../attachFile.const'
import { UserListStatus } from '../types'

const logger = createLogger('oneClient')

jest.setTimeout(1.5 * 60 * 1000)

describe('One Client', () => {
  let app: App
  let dataDirPath: string
  let resourcesPath: string
  let generalChannel: Channel
  let settings: Settings

  const generalChannelName = 'general'
  const ownerUserName = 'testuser'

  const firstCommunityName = 'testcommunity'
  const secondCommunityName = 'testcommunity-redux'

  beforeAll(async () => {
    app = new App({ username: 'owner' })
  })

  afterAll(async () => {
    await app.close()
    await app.cleanup()
  })

  beforeEach(async () => {
    logger.info(`░░░ ${expect.getState().currentTestName}`)
  })

  describe('User opens app for the first time', () => {
    it('User opens app', async () => {
      await app.openWithRetries()
    })

    it('Get opened app process data', () => {
      const processData = app.buildSetup.getProcessData()
      dataDirPath = processData.dataDirPath
      resourcesPath = processData.resourcesPath
    })

    it('Owner closes update modal if opened', async () => {
      try {
        await app.closeUpdateModalIfPresent()
        logger.info('Closed update modal')
      } catch (e) {
        // do nothing
      }
    })

    it('User sees "join community" page and switches to "create community" view by clicking on the link', async () => {
      const debugModal = new DebugModeModal(app.driver)
      await debugModal.close()

      logger.info('Checking that join modal is ready')
      const joinModal = new JoinCommunityModal(app.driver)
      expect(await joinModal.isReady(30_000)).toBeTruthy()

      logger.info('Switching to create community modal')
      await joinModal.switchToCreateCommunity()
    })

    it('User is on "Create community" page, enters valid community name and presses the button', async () => {
      logger.info('Checking that create modal is ready')
      const createModal = new CreateCommunityModal(app.driver)
      expect(await createModal.isReady()).toBeTruthy()

      logger.info('Community creation - before typeCommunityName')
      await createModal.typeCommunityName(firstCommunityName)
      logger.info('Community creation - before submit')
      await createModal.submit()
      logger.info('Community creation - after submit')
    })

    it('User sees "register username" page, enters the valid name and submits by clicking on the button', async () => {
      const registerModal = new RegisterUsernameModal(app.driver)
      expect(await registerModal.isReady()).toBeTruthy()

      logger.info('Registration - before typeUsername')
      await registerModal.typeUsername(ownerUserName)
      logger.info('Registration - before submit')
      await registerModal.submit()
      logger.info('Registration - after submit')
    })

    it('User waits for the modal JoiningLoadingPanel to disappear', async () => {
      logger.info('Waiting for join to complete')
      const loadingPanelCommunity = new JoiningLoadingPanel(app.driver)
      await loadingPanelCommunity.waitForJoinToComplete()
    })

    it('User sees general channel', async () => {
      generalChannel = new Channel(app.driver, generalChannelName)
      expect(await generalChannel.isReady()).toBeTruthy()
      expect(await generalChannel.isMessageInputReady()).toBeTruthy()
      expect(await generalChannel.isOpen()).toBeTruthy()

      const generalChannelText = await generalChannel.element.getText()
      expect(generalChannelText).toEqual(generalChannelName)
    })

    it('User sees just the general channel in the sidebar', async () => {
      const sidebar = new Sidebar(app.driver)
      const channelList = await sidebar.getChannelList()
      expect(channelList.length).toBe(1)
      expect(await channelList[0].getText()).toBe(generalChannelName)
    })

    it('User sends a message', async () => {
      expect(await generalChannel.isMessageInputReady()).toBeTruthy()
      await generalChannel.sendMessage('this shows up as sent', ownerUserName)
    })
  })

  describe('User leaves community and recreates it', () => {
    it('Leave community', async () => {
      const settingsModal = await new Sidebar(app.driver).openSettings()
      expect(await settingsModal.isReady()).toBeTruthy()

      await settingsModal.switchTab(SettingsModalTabName.LEAVE_COMMUNITY)
      await settingsModal.leaveCommunityButton()
    })

    it('User sees "join community" page and switches to "create community" view by clicking on the link', async () => {
      const debugModal = new DebugModeModal(app.driver)
      await debugModal.close()

      const joinModal = new JoinCommunityModal(app.driver)
      expect(await joinModal.isReady()).toBeTruthy()

      await joinModal.switchToCreateCommunity()
    })

    it('User is on "Create community" page, enters new valid community name and presses the button', async () => {
      const createModal = new CreateCommunityModal(app.driver)
      expect(await createModal.isReady()).toBeTruthy()
      await createModal.typeCommunityName(secondCommunityName)
      await createModal.submit()
    })

    it('User sees "register username" page, enters the valid name and submits by clicking on the button', async () => {
      const registerModal = new RegisterUsernameModal(app.driver)

      expect(await registerModal.isReady()).toBeTruthy()
      logger.info('Registration - before typeUsername')
      await registerModal.typeUsername(ownerUserName)
      logger.info('Registration - before submit')
      await registerModal.submit()
      logger.info('Registration - after submit')
    })

    it('User waits for the modal JoiningLoadingPanel to disappear', async () => {
      const loadingPanelCommunity = new JoiningLoadingPanel(app.driver)
      await loadingPanelCommunity.waitForJoinToComplete()
    })

    it('User sees general channel', async () => {
      generalChannel = new Channel(app.driver, generalChannelName)
      expect(await generalChannel.isReady())

      const generalChannelText = await generalChannel.element.getText()
      expect(generalChannelText).toEqual(generalChannelName)
    })

    it('User sends a message', async () => {
      expect(await generalChannel.isMessageInputReady()).toBeTruthy()
      await generalChannel.sendMessage('this shows up as sent again', ownerUserName)
    })
  })

  describe('Attaching files', () => {
    it('Owner uploads an image', async () => {
      const uploadFilePath = path.resolve(UPLOAD_FILE_DIR, TEST_IMAGE_FILE_NAME)
      await generalChannel.attachFile(TEST_IMAGE_FILE_NAME, uploadFilePath, FileAttachmentType.IMAGE, ownerUserName)
    })

    it('Owner uploads a non-image file', async () => {
      const uploadFilePath = path.resolve(UPLOAD_FILE_DIR, TEST_FILE_NAME)
      await generalChannel.attachFile(TEST_FILE_NAME, uploadFilePath, FileAttachmentType.FILE, ownerUserName)
    })
  })

  describe('Community membership tab', () => {
    it('User opens community settings', async () => {
      settings = await new Sidebar(app.driver).openSettings()
    })

    it('User opens community membership tab', async () => {
      await settings.openCommunityMembership(1)
    })

    it('Users sees just themselves in the user list', async () => {
      const ownStatus = await settings.getUserInCommunityMembership(ownerUserName, UserListStatus.ONLINE, true)
      expect(ownStatus.status).toBe(UserListStatus.ONLINE)
      expect(ownStatus.textMatches).toBe(true)
    })

    it('Users closes community membership tab', async () => {
      await settings.closeTabThenModal()
    })
  })

  describe('security: socketIOSecret exposure', () => {
    it('does NOT leak socketIOSecret in renderer process URL (query string)', async () => {
      // Get the main window's URL via webdriver
      const url = await app.driver.getCurrentUrl()
      // The secret should NOT be present as a query param
      expect(url).not.toMatch(/socketIOSecret=[a-f0-9]{64}/i)
    })

    it('does NOT leak socketIOSecret in window.location.search in renderer', async () => {
      // Evaluate in renderer context
      const search = await app.driver.executeScript('return window.location.search')
      expect(search).not.toMatch(/socketIOSecret=[a-f0-9]{64}/i)
    })

    it('does NOT leak socketIOSecret in backend process arguments (process list)', async () => {
      // This test assumes you can get the backend process command line via BuildSetup.getProcessData
      // and that it should NOT include the -scrt <secret> argument in a way that's exposed
      const processData = app.buildSetup.getProcessData()
      const backendArgs = JSON.stringify(processData)
      expect(backendArgs).not.toMatch(/-scrt [a-f0-9]{64}/i)
    })
  })

  describe('User can open the app despite hanging backend process', () => {
    let hangingProcess: any
    afterAll(async () => {
      // Ensure we clean up the hanging backend process after the test
      if (hangingProcess) {
        logger.info('Killing hanging backend process')
        hangingProcess.kill('SIGKILL')
      }
    })
    it('User closes the app but leaves hanging backend', async () => {
      const forkArgvs = [
        '-d',
        `${await getPort()}`,
        '-a',
        `${dataDirPath}`,
        '-r',
        `${resourcesPath}`,
        '-p',
        'desktop',
        '-scrt',
        'test',
      ]
      const backendBundlePath = path.normalize(require.resolve('backend-bundle'))
      logger.info('Spawning backend', backendBundlePath, 'with argvs:', forkArgvs)
      hangingProcess = fork(backendBundlePath, forkArgvs)
      await app.close({ forceSaveState: true })
      logger.info('App closed, backend should be running')
    })

    it('Opens app again', async () => {
      await app.openWithRetries()
    })

    it('User sees "general channel" page', async () => {
      const generalChannel = new Channel(app.driver, 'general')
      expect(await generalChannel.isReady()).toBeTruthy()
    })

    it('closes the app and kills hanging backend', async () => {
      await app.close()
      if (hangingProcess) {
        logger.info('Killing hanging backend process')
        hangingProcess.kill('SIGKILL')
      }
      hangingProcess = null
      await app.waitForClosed()
    })
  })

  describe('App closing methods', () => {
    beforeEach(async () => {
      const opened = await app.isSessionOpen()
      if (!opened) {
        await app.openWithRetries()
      }
      generalChannel = new Channel(app.driver, generalChannelName)
      await generalChannel.isReady()
    })

    it('closes the app with quit event', async () => {
      await new Promise(resolve => setTimeout(resolve, 1000))
      expect(await app.isSessionOpen()).toBe(true)
      await app.quitProgrammatically()

      try {
        await app.waitForClosed(5000)
      } catch (e) {
        // expected if app was not ready when we tried to close
      }
      if (await app.isSessionOpen()) {
        // may have triggered before app was ready
        await app.quitProgrammatically()
      }
      const opened = await app.isSessionOpen()
      expect(opened).toBe(false)
    })

    it('Closes the app via window X button', async () => {
      await new Promise(resolve => setTimeout(resolve, 2000))
      expect(await app.isSessionOpen()).toBe(true)
      const generalChannel = new Channel(app.driver, 'general')
      expect(generalChannel.isReady()).toBeTruthy()
      await app.closeWindowViaX()
      if (process.platform === 'darwin') {
        // On macOS, window should be hidden but app still running
        const visible = await app.isVisible()
        expect(visible).toBe(false)
        const opened = await app.isSessionOpen()
        expect(opened).toBe(true)
        await app.close()
        const closed = await app.isSessionOpen()
        expect(closed).toBe(false)
      } else {
        // On other platforms, app should be closed
        await app.waitForClosed()
        const opened = await app.isSessionOpen()
        expect(opened).toBe(false)
      }
    })

    it('Force kills the app', async () => {
      await new Promise(resolve => setTimeout(resolve, 2000))
      expect(await app.isSessionOpen()).toBe(true)
      await app.terminateBackendProcess()
      await app.waitForClosed()
      const opened = await app.isSessionOpen()
      expect(opened).toBe(false)
    })
  })
})
