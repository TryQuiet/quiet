import { ThenableWebDriver, Key } from 'selenium-webdriver'
import { BuildSetup } from './crossplatform.utils'
import {
  App,
  Channel,
  CreateCommunityModal,
  DebugModeModal,
  JoinCommunityModal,
  JoiningLoadingPanel,
  RegisterUsernameModal,
  StartingLoadingPanel
} from './selectors.crossplatform'
import getPort from 'get-port'
import { execSync, fork } from 'child_process'
import path from 'path'

jest.setTimeout(450000)
describe('Smoke', () => {
  let app: App
  let appBackendProcess: string
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
      const backendBundlePath = path.normalize('backend-bundle/bundle.cjs')
      const dataDirName = app.buildSetup.dataDir
      const byPlatform = {
        linux: `pgrep -af "${backendBundlePath}" | grep -v egrep | grep "${dataDirName}"`,
        darwin: `ps -A | grep "${backendBundlePath}" | grep -v egrep | grep "${dataDirName}"`,
        win32: `powershell "Get-WmiObject Win32_process -Filter {commandline LIKE '%${backendBundlePath.replace(/\\/g, '\\\\')}%' and commandline LIKE '%${dataDirName}%' and name = 'Quiet.exe'} | Format-Table CommandLine -HideTableHeaders -Wrap -Autosize"`
      }
      const command = byPlatform[process.platform]
      console.log('COMMAND', command)
      appBackendProcess = execSync(command).toString('utf8').trim()
      console.log('APP BACKEND PROCESS INFO', appBackendProcess)

      // CHECK
      // if (process.platform === 'win32') {
      //   console.log('CHECK1:', execSync(`powershell "Get-WmiObject Win32_process -Filter {commandline LIKE '%${backendBundlePath.replace(/\\/g, '\\\\')}%' and name = 'Quiet.exe'}"`).toString('utf8').trim())
      //   console.log('CHECK2', execSync(`powershell "Get-WmiObject Win32_process -Filter {commandline LIKE '%${dataDirName}%' and name = 'Quiet.exe'}"`).toString('utf8').trim())
      // }

      const args = appBackendProcess.split(' ')
      if (args.length >= 5) {
        if (process.platform === 'win32') {
          dataDirPath = args[5]
          resourcesPath = args[7]
        } else {
          dataDirPath = args[6]
          resourcesPath = args[8]
        }
      }
      console.log('ARGS:', args)
      console.log('RESULTS:', appBackendProcess, '.', dataDirPath, '-', resourcesPath)
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
      fork(backendBundlePath, forkArgvs)
      await app.close()
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

    it('User sees "join community" page', async () => {
      const joinModal = new JoinCommunityModal(app.driver)
      const isJoinModal = await joinModal.element.isDisplayed()
      expect(isJoinModal).toBeTruthy()
    })
  })
})
