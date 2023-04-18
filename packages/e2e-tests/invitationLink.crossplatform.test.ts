import { ThenableWebDriver } from 'selenium-webdriver'
import {
  Channel,
  CreateCommunityModal,
  DebugModeModal,
  JoinCommunityModal,
  JoiningLoadingPanel,
  RegisterUsernameModal,
  App,
  Sidebar,
  StartingLoadingPanel,
  WarningModal
} from './selectors.crossplatform'
import { BuildSetup } from './crossplatform.utils'
import { capitalizeFirstLetter, invitationDeepUrl } from '@quiet/common'
import { execSync } from 'child_process'
import getPort from 'get-port'

jest.setTimeout(900000)
it.todo('New user joins using invitation link while having app closed')
describe('New user joins using invitation link while having app opened', () => {
  // Note: this test requires no DATA_DIR env so ran on local machine may interfere with 'Quiet' data directory
  let buildSetupOwner: BuildSetup
  let driverOwner: ThenableWebDriver
  let buildSetupGuest: BuildSetup
  let driverGuest: ThenableWebDriver
  let invitationCode: string
  let dataDirOwner: string

  const communityName = 'testcommunity'
  const ownerUsername = 'bob'
  const joiningUserUsername = 'alice-joining'
  beforeAll(async () => {
    const port = await getPort()
    const debugPort = await getPort()
    buildSetupOwner = new BuildSetup({ port, debugPort })
    await buildSetupOwner.createChromeDriver()
    dataDirOwner = buildSetupOwner.dataDir
    driverOwner = buildSetupOwner.getDriver()
    await driverOwner.getSession()
  })

  afterAll(async () => {
    await buildSetupOwner.closeDriver()
    await buildSetupOwner.killChromeDriver()
    buildSetupGuest && await buildSetupGuest.closeDriver()
    buildSetupGuest && await buildSetupGuest.killChromeDriver()
  })
  describe('Stages:', () => {
    if (process.env.TEST_MODE) {
      it('Close debug modal', async () => {
        const debugModal = new DebugModeModal(driverOwner)
        await debugModal.close()
      })
    }

    it('StartingLoadingPanel modal', async () => {
      const loadingPanel = new StartingLoadingPanel(driverOwner)
      const isLoadingPanel = await loadingPanel.element.isDisplayed()
      expect(isLoadingPanel).toBeTruthy()
    })

    it('JoinCommunityModal - owner switches to create community', async () => {
      const joinModal = new JoinCommunityModal(driverOwner)
      const isJoinModal = await joinModal.element.isDisplayed()
      expect(isJoinModal).toBeTruthy()
      await joinModal.switchToCreateCommunity()
    })

    it('CreateCommunityModal - owner creates his community', async () => {
      const createModal = new CreateCommunityModal(driverOwner)
      const isCreateModal = await createModal.element.isDisplayed()
      expect(isCreateModal).toBeTruthy()
      await createModal.typeCommunityName(communityName)
      await createModal.submit()
    })

    it('RegisterUsernameModal - owner has registered', async () => {
      const registerModal = new RegisterUsernameModal(driverOwner)
      const isRegisterModal = await registerModal.element.isDisplayed()
      expect(isRegisterModal).toBeTruthy()
      await registerModal.typeUsername(ownerUsername)
      await registerModal.submit()
    })

    it('Connecting to peers modal', async () => {
      const loadingPanelCommunity = new JoiningLoadingPanel(driverOwner)
      const isLoadingPanelCommunity = await loadingPanelCommunity.element.isDisplayed()
      expect(isLoadingPanelCommunity).toBeTruthy()
    })

    it('Owner sees general channel', async () => {
      const generalChannel = new Channel(driverOwner, 'general')
      const isGeneralChannel = await generalChannel.element.isDisplayed()
      const generalChannelText = await generalChannel.element.getText()
      expect(isGeneralChannel).toBeTruthy()
      expect(generalChannelText).toEqual('# general')
    })

    it('Owner opens the settings tab and gets an invitation code', async () => {
      const settingsModal = await new Sidebar(driverOwner).openSettings()
      const isSettingsModal = await settingsModal.element.isDisplayed()
      expect(isSettingsModal).toBeTruthy()
      await settingsModal.switchTab('invite') // TODO: Fix - the invite tab should be default for the owner
      const invitationCodeElement = await settingsModal.invitationCode()
      invitationCode = await invitationCodeElement.getText()
      console.log('Received invitation link:', invitationCode)
      await settingsModal.close()
    })

    if (process.platform === 'darwin') {
      // MacOS tries to open link in first app (owner's app) so the workaround is to temporarly close owner
      // while clicking on the invitation link to have just one instance of app opened
      it('Owner closes the app', async () => {
        const root = new App(driverOwner)
        await root.saveState() // Selenium creates community and closes app so fast that redux state is not saved properly
        await root.waitForSavedState()
        await buildSetupOwner.closeDriver()
        await buildSetupOwner.killChromeDriver()
      })
    }

    it('Guest opens the app', async () => {
      console.log('Guest opens app')
      const port = await getPort()
      const debugPort = await getPort()
      buildSetupGuest = new BuildSetup({ port, debugPort, useDataDir: false })
      await buildSetupGuest.createChromeDriver()
      driverGuest = buildSetupGuest.getDriver()
      await driverGuest.getSession()
    })
    if (process.env.TEST_MODE) {
      it('Close debug modal', async () => {
        const debugModal = new DebugModeModal(driverGuest)
        await debugModal.close()
      })
    }
    it('StartingLoadingPanel modal', async () => {
      const loadingPanel = new StartingLoadingPanel(driverGuest)
      const isLoadingPanel = await loadingPanel.element.isDisplayed()
      expect(isLoadingPanel).toBeTruthy()
    })

    it.skip('Guest clicks invitation link with invalid invitation code', async () => {
      // Fix when modals ordering is fixed (joining modal hiddes warning modal)
      console.log('opening invalid code')
      execSync(`xdg-open ${invitationDeepUrl('invalidcode')}`)
    })

    it.skip('Guest sees modal with warning about invalid code, closes it', async () => {
      // Fix when modals ordering is fixed (joining modal hiddes warning modal)
      const warningModal = new WarningModal(driverGuest)
      const titleElement = await warningModal.titleElement
      expect(titleElement.isDisplayed()).toBeTruthy()
      expect(titleElement.getText()).toEqual('Invalid link')
      await warningModal.close()
    })

    it('Guest clicks invitation link with valid code', async () => {
      // Extract code from copied invitation url
      const url = new URL(invitationCode)
      const command = {
        linux: 'xdg-open',
        darwin: 'open',
        win32: 'start'
      }
      execSync(`${command[process.platform]} ${invitationDeepUrl(url.hash.substring(1))}`)
      console.log('Guest opened invitation link')
    })

    it('Guest is redirected to UsernameModal', async () => {
      console.log('Guest sees username modal')
      const registerModal = new RegisterUsernameModal(driverGuest)
      const isRegisterModalDisplayed = await registerModal.element.isDisplayed()
      expect(isRegisterModalDisplayed).toBeTruthy()
    })

    it('Guest submits username', async () => {
      console.log('Guest submits username')
      const registerModal = new RegisterUsernameModal(driverGuest)
      await registerModal.typeUsername(joiningUserUsername)
      await registerModal.submit()
    })

    if (process.platform === 'darwin') {
      // Open the owner's app again so guest would be able to register
      it('Owner opens the app again', async () => {
        console.log('Owner opens the app again')
        const port = await getPort()
        const debugPort = await getPort()
        buildSetupOwner = new BuildSetup({ port, debugPort, dataDir: dataDirOwner })
        await buildSetupOwner.createChromeDriver()
        driverOwner = buildSetupOwner.getDriver()
        await driverOwner.getSession()
      })
      if (process.env.TEST_MODE) {
        it('Owner closes debug modal', async () => {
          const debugModal = new DebugModeModal(driverOwner)
          await debugModal.close()
        })
      }
      it('Owner sees starting panel', async () => {
        console.log('Owner sees starting panel')
        const loadingPanel = new StartingLoadingPanel(driverOwner)
        const isLoadingPanel = await loadingPanel.element.isDisplayed()
        expect(isLoadingPanel).toBeTruthy()
      })
    }

    it('Guest joined a community and sees general channel', async () => {
      console.log('guest sees general channel')
      const generalChannel = new Channel(driverGuest, 'general')
      await generalChannel.element.isDisplayed()
    })

    it('Owner sees that guest joined community', async () => {
      const generalChannel = new Channel(driverOwner, 'general')
      await generalChannel.element.isDisplayed()
      const userJoinedMessage = await generalChannel.getMessage(`@${joiningUserUsername} has joined ${capitalizeFirstLetter(communityName)}!`)
      expect(await userJoinedMessage.isDisplayed()).toBeTruthy()
    })
  })
})
