import {
  App,
  Channel,
  CreateCommunityModal,
  DebugModeModal,
  JoinCommunityModal,
  JoiningLoadingPanel,
  RegisterUsernameModal,
  Sidebar,
} from '../selectors'
import getPort from 'get-port'
import { fork } from 'child_process'
import path from 'path'
import { createLogger } from '../logger'
import { SettingsModalTabName, FileAttachmentType } from '../enums'
import { TEST_FILE_NAME, TEST_IMAGE_FILE_NAME, UPLOAD_FILE_DIR } from '../attachFile.const'
import { sleep } from '../utils'

const logger = createLogger('oneClient')

jest.setTimeout(1.5 * 60 * 1000)

describe('One Client', () => {
  let app: App
  let dataDirPath: string
  let resourcesPath: string
  let generalChannel: Channel

  const generalChannelName = 'general'
  const ownerUserName = 'testuser'

  const firstCommunityName = 'testcommunity'
  const secondCommunityName = 'testcommunity-redux'

  beforeAll(async () => {
    app = new App()
  })

  afterAll(async () => {
    await app.close()
    await app.cleanup()
  })

  beforeEach(async () => {
    logger.info(`░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ ${expect.getState().currentTestName}`)
  })

  describe('User opens app for the first time', () => {
    it('User opens app', async () => {
      await app.open()
    })
    it('Get opened app process data', () => {
      const processData = app.buildSetup.getProcessData()
      dataDirPath = processData.dataDirPath
      resourcesPath = processData.resourcesPath
    })

    it('User sees "join community" page and switches to "create community" view by clicking on the link', async () => {
      const debugModal = new DebugModeModal(app.driver)
      await debugModal.close()

      const joinModal = new JoinCommunityModal(app.driver)
      expect(await joinModal.isReady()).toBeTruthy()

      await joinModal.switchToCreateCommunity()
    })

    it('User is on "Create community" page, enters valid community name and presses the button', async () => {
      const createModal = new CreateCommunityModal(app.driver)
      expect(await createModal.isReady()).toBeTruthy()

      await createModal.typeCommunityName(firstCommunityName)
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
      expect(await generalChannel.isReady()).toBeTruthy()

      const generalChannelText = await generalChannel.element.getText()
      expect(generalChannelText).toEqual(`# ${generalChannelName}`)
    })

    it('User sees just the general channel in the sidebar', async () => {
      const sidebar = new Sidebar(app.driver)
      const channelList = await sidebar.getChannelList()
      expect(channelList.length).toBe(1)
      expect(await channelList[0].getText()).toBe(`# ${generalChannelName}`)
    })

    it('Users sees just themselves in the user list', async () => {
      const sidebar = new Sidebar(app.driver)
      const userList = await sidebar.getUserProfileList()
      expect(userList.length).toBe(1)
      expect(await userList[0].getText()).toBe(ownerUserName)
    })

    it('User sends a message', async () => {
      expect(await generalChannel.isMessageInputReady()).toBeTruthy()
      await generalChannel.sendMessage('this shows up as sent', ownerUserName)
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
      await app.open()
    })

    it('User sees "general channel" page', async () => {
      const generalChannel = new Channel(app.driver, 'general')
      expect(await generalChannel.isReady()).toBeTruthy()
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
      expect(generalChannelText).toEqual(`# ${generalChannelName}`)
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

  describe('App closing methods', () => {
    beforeEach(async () => {
      const opened = await app.isSessionOpen()
      if (!opened) {
        await app.open()
      }
      generalChannel = new Channel(app.driver, generalChannelName)
      await generalChannel.isReady()
    })

    it('closes the app with quit event', async () => {
      expect(await app.isSessionOpen()).toBe(true)
      await app.quitProgrammatically()

      const opened = await app.isSessionOpen()
      expect(opened).toBe(false)
    })

    it('Closes the app via window X button', async () => {
      expect(await app.isSessionOpen()).toBe(true)
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
        const opened = await app.isSessionOpen()
        expect(opened).toBe(false)
      }
    })

    it('Force kills the app', async () => {
      expect(await app.isSessionOpen()).toBe(true)
      await app.terminateBackendProcess()
      const opened = await app.isSessionOpen()
      expect(opened).toBe(false)
    })
  })
})
