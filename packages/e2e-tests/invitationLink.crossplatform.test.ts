import { ThenableWebDriver } from 'selenium-webdriver'
import {
  Channel,
  CreateCommunityModal,
  DebugModeModal,
  JoinCommunityModal,
  JoiningLoadingPanel,
  RegisterUsernameModal,
  Sidebar,
  StartingLoadingPanel,
  WarningModal
} from './selectors.crossplatform'
import { BuildSetup } from './crossplatform.utils'
import { invitationDeepUrl } from '@quiet/common'
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

  const communityName = 'testcommunity'
  const ownerUsername = 'bob'
  const joiningUserUsername = 'alice-joining'
  beforeAll(async () => {
    const port = await getPort()
    const debugPort = await getPort()
    buildSetupOwner = new BuildSetup({ port, debugPort })
    await buildSetupOwner.createChromeDriver()
    driverOwner = buildSetupOwner.getDriver()
    await driverOwner.getSession()
  })

  afterAll(async () => {
    await buildSetupOwner.closeDriver()
    await buildSetupOwner.killChromeDriver()

    await buildSetupGuest.closeDriver()
    await buildSetupGuest.killChromeDriver()
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
      console.log('Received invitation code:', invitationCode)
      await settingsModal.close()
    })

    it('Guest opens the app', async () => {
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
    })

    it('Guest is redirected to UsernameModal and submits username', async () => {
      const registerModal = new RegisterUsernameModal(driverGuest)
      const isRegisterModalDisplayed = await registerModal.element.isDisplayed()
      expect(isRegisterModalDisplayed).toBeTruthy()
      await registerModal.typeUsername(joiningUserUsername)
      await registerModal.submit()
    })

    it('Guest joined a community and sees general channel', async () => {
      const generalChannel = new Channel(driverGuest, 'general')
      await generalChannel.element.isDisplayed()
    })
  })
})
