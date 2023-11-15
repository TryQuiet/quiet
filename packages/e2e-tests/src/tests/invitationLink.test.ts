import {
  Channel,
  CreateCommunityModal,
  DebugModeModal,
  JoinCommunityModal,
  JoiningLoadingPanel,
  RegisterUsernameModal,
  App,
  Sidebar,
  WarningModal,
} from '../selectors'
import { capitalizeFirstLetter, composeInvitationDeepUrl, parseInvitationCode } from '@quiet/common'
import { execSync } from 'child_process'
import { type SupportedPlatformDesktop } from '@quiet/types'

jest.setTimeout(1900000)
it.todo('New user joins using invitation link while having app closed')
describe('New user joins using invitation link while having app opened', () => {
  // Note: this test requires no DATA_DIR env so ran on local machine may interfere with 'Quiet' data directory
  const communityName = 'testcommunity'
  const ownerUsername = 'bob'
  const joiningUserUsername = 'alice-joining'
  let invitationCode: string
  let ownerApp: App
  let guestApp: App

  beforeAll(async () => {
    ownerApp = new App()
    guestApp = new App({ useDataDir: false })
  })

  beforeEach(async () => {
    await new Promise<void>(resolve => setTimeout(() => resolve(), 1000))
  })

  afterAll(async () => {
    await ownerApp?.close()
    await guestApp?.close()
  })

  describe('Stages:', () => {
    it('Owner opens the app', async () => {
      console.log('Invitation Link', 1)
      await ownerApp.open()
    })

    it('JoinCommunityModal - owner switches to create community', async () => {
      console.log('Invitation Link', 4)
      const joinModal = new JoinCommunityModal(ownerApp.driver)
      const isJoinModal = await joinModal.element.isDisplayed()
      expect(isJoinModal).toBeTruthy()
      await joinModal.switchToCreateCommunity()
    })

    it('CreateCommunityModal - owner creates his community', async () => {
      console.log('Invitation Link', 5)
      const createModal = new CreateCommunityModal(ownerApp.driver)
      const isCreateModal = await createModal.element.isDisplayed()
      expect(isCreateModal).toBeTruthy()
      await createModal.typeCommunityName(communityName)
      await createModal.submit()
    })

    it('RegisterUsernameModal - owner has registered', async () => {
      console.log('Invitation Link', 6)
      const registerModal = new RegisterUsernameModal(ownerApp.driver)
      const isRegisterModal = await registerModal.element.isDisplayed()
      expect(isRegisterModal).toBeTruthy()
      await registerModal.typeUsername(ownerUsername)
      await registerModal.submit()
    })

    it('Owner sees general channel', async () => {
      console.log('Invitation Link', 8)
      const generalChannel = new Channel(ownerApp.driver, 'general')
      const isGeneralChannel = await generalChannel.element.isDisplayed()
      const generalChannelText = await generalChannel.element.getText()
      expect(isGeneralChannel).toBeTruthy()
      expect(generalChannelText).toEqual('# general')
    })

    it('Owner opens the settings tab and gets an invitation code', async () => {
      console.log('Invitation Link', 9)
      const settingsModal = await new Sidebar(ownerApp.driver).openSettings()
      const isSettingsModal = await settingsModal.element.isDisplayed()
      expect(isSettingsModal).toBeTruthy()
      await settingsModal.switchTab('invite') // TODO: Fix - the invite tab should be default for the owner
      await new Promise<void>(resolve => setTimeout(() => resolve(), 1000))
      const invitationCodeElement = await settingsModal.invitationCode()
      invitationCode = await invitationCodeElement.getText()
      console.log('Received invitation link:', invitationCode)
      await settingsModal.close()
    })

    if (process.platform === 'darwin') {
      // MacOS tries to open link in first app (owner's app) so the workaround is to temporarly close owner
      // while clicking on the invitation link to have just one instance of app opened
      it('Owner closes the app', async () => {
        console.log('Invitation Link', 10)
        await ownerApp.close({ forceSaveState: true })
      })
    }

    it('Guest opens the app', async () => {
      console.log('Invitation Link', 11)
      console.log('Guest opens app')
      await guestApp.open()
    })

    it.skip('Guest clicks invitation link with invalid invitation code', async () => {
      // Fix when modals ordering is fixed (joining modal hides warning modal)
      console.log('opening invalid code')
      execSync(
        `xdg-open ${composeInvitationDeepUrl({
          pairs: [{ peerId: 'invalid', onionAddress: 'alsoInvalid' }],
          psk: '1234',
        })}`
      )
    })

    it.skip('Guest sees modal with warning about invalid code, closes it', async () => {
      // Fix when modals ordering is fixed (joining modal hiddes warning modal)
      const warningModal = new WarningModal(guestApp.driver)
      const titleElement = await warningModal.titleElement
      expect(titleElement.isDisplayed()).toBeTruthy()
      expect(titleElement.getText()).toEqual('Invalid link')
      await warningModal.close()
    })

    it('Guest clicks invitation link with valid code', async () => {
      console.log('Invitation Link', 14)
      // Extract code from copied invitation url

      const url = new URL(invitationCode)
      const command = {
        linux: 'xdg-open',
        darwin: 'open',
        win32: 'start',
      }

      const copiedCode = url.hash.substring(1)
      expect(() => parseInvitationCode(copiedCode)).not.toThrow()
      const data = parseInvitationCode(copiedCode)
      execSync(`${command[process.platform as SupportedPlatformDesktop]} "${composeInvitationDeepUrl(data)}"`)
      console.log('Guest opened invitation link')
    })

    it('Guest is redirected to UsernameModal', async () => {
      console.log('Invitation Link', 15)
      console.log('Guest sees username modal')
      const registerModal = new RegisterUsernameModal(guestApp.driver)
      const isRegisterModalDisplayed = await registerModal.element.isDisplayed()
      expect(isRegisterModalDisplayed).toBeTruthy()
    })

    it('Guest submits username', async () => {
      console.log('Invitation Link', 16)
      console.log('Guest submits username')
      const registerModal = new RegisterUsernameModal(guestApp.driver)
      await registerModal.typeUsername(joiningUserUsername)
      await registerModal.submit()
    })

    if (process.platform === 'darwin') {
      // Open the owner's app again so guest would be able to register
      it('Owner opens the app again', async () => {
        console.log('Invitation Link', 17)
        console.log('Owner opens the app again')
        await ownerApp.open()
        const debugModal = new DebugModeModal(ownerApp.driver)
        await debugModal.close()
      })
    }

    it('Guest joined a community and sees general channel', async () => {
      console.log('Invitation Link', 20)
      console.log('guest sees general channel')

      const generalChannel = new Channel(guestApp.driver, 'general')
      await generalChannel.element.isDisplayed()
    })

    it('Owner sees that guest joined community', async () => {
      console.log('Invitation Link', 21)
      const generalChannel = new Channel(guestApp.driver, 'general')
      await generalChannel.element.isDisplayed()
      
      const hasMessage = await generalChannel.waitForUserMessage(
        joiningUserUsername,
        `@${joiningUserUsername} has joined and will be registered soon. 🎉 Learn more`
      )
      const isMessageDisplayed = await hasMessage?.isDisplayed()
      expect(isMessageDisplayed).toBeTruthy()
    })
  })
})
