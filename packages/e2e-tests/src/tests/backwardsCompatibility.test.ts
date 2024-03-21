import { WebElement } from 'selenium-webdriver'
import {
  App,
  Channel,
  CreateCommunityModal,
  DebugModeModal,
  JoinCommunityModal,
  RegisterUsernameModal,
  Sidebar,
} from '../selectors'
import { BACKWARD_COMPATIBILITY_BASE_VERSION, copyInstallerFile, downloadInstaller } from '../utils'

jest.setTimeout(1200000)
describe('Backwards Compatibility', () => {
  let ownerAppOldVersion: App
  let ownerAppNewVersion: App
  let generalChannel: Channel
  let secondChannel: Channel
  let messagesToCompare: WebElement[]
  let sidebar: Sidebar

  const dataDir = `e2e_${(Math.random() * 10 ** 18).toString(36)}`
  const communityName = 'testcommunity'
  const ownerUsername = 'bob'
  const ownerMessages = ['Hi', 'Hello', 'After guest leave app']
  const loopMessages = 'ąbc'.split('')
  const newChannelName = 'mid-night-club'

  const isAlpha = process.env.FILE_NAME?.toString().includes('alpha')

  beforeAll(async () => {
    // download the old version of the app
    const appFilename = downloadInstaller()
    const copiedFilename = copyInstallerFile(appFilename)
    ownerAppOldVersion = new App({ dataDir, fileName: copiedFilename })
  })

  beforeEach(async () => {
    await new Promise<void>(resolve => setTimeout(() => resolve(), 1000))
  })

  afterAll(async () => {
    await new Promise<void>(resolve => setTimeout(() => resolve(), 5000))
    await ownerAppNewVersion?.close()
  })
  describe('User opens app for the first time', () => {
    it('Owner opens the app', async () => {
      await ownerAppOldVersion.open()
    })

    it('Owner closes "update available" modal if present', async () => {
      ownerAppOldVersion
        .closeUpdateModalIfPresent()
        .then(async () => {
          console.log('Closed update modal')
        })
        .catch(err => {
          console.log('Could not close update modal', err)
        })
    })

    it('Owner sees "join community" modal and switches to "create community" modal', async () => {
      const joinModal = new JoinCommunityModal(ownerAppOldVersion.driver)
      const isJoinModal = await joinModal.element.isDisplayed()
      expect(isJoinModal).toBeTruthy()
      await joinModal.switchToCreateCommunity()
    })
    it('Owner submits valid community name', async () => {
      const createModal = new CreateCommunityModal(ownerAppOldVersion.driver)
      const isCreateModal = await createModal.element.isDisplayed()
      expect(isCreateModal).toBeTruthy()
      await createModal.typeCommunityName(communityName)
      await createModal.submit()
    })
    it('Owner sees "register username" modal and submits valid username', async () => {
      const registerModal = new RegisterUsernameModal(ownerAppOldVersion.driver)
      const isRegisterModal = await registerModal.element.isDisplayed()
      expect(isRegisterModal).toBeTruthy()
      await registerModal.typeUsername(ownerUsername)
      await registerModal.submit()
    })

    it('Owner registers successfully and sees general channel', async () => {
      generalChannel = new Channel(ownerAppOldVersion.driver, 'general')
      const isGeneralChannel = await generalChannel.element.isDisplayed()
      const generalChannelText = await generalChannel.element.getText()
      expect(isGeneralChannel).toBeTruthy()
      expect(generalChannelText).toEqual('# general')
    })
    it(`Verify version - ${BACKWARD_COMPATIBILITY_BASE_VERSION}`, async () => {
      const settingsModal = await new Sidebar(ownerAppOldVersion.driver).openSettings()
      const isSettingsModal = await settingsModal.element.isDisplayed()
      expect(isSettingsModal).toBeTruthy()
      const settingVersion = await settingsModal.getVersion()
      expect(settingVersion).toEqual(BACKWARD_COMPATIBILITY_BASE_VERSION)
      await settingsModal.close()
    })

    it("User doesn't see the connection status element in general channel", async () => {
      const correctConnectionStatusElementPresence = await generalChannel.waitForConnectionStatus(true)
      expect(correctConnectionStatusElementPresence).toBe(true)
    })

    it('Sends a message', async () => {
      const isMessageInput = await generalChannel.messageInput.isDisplayed()
      expect(isMessageInput).toBeTruthy()
      const messageIds = await generalChannel.sendMessage(ownerMessages[0], ownerUsername)
      await generalChannel.verifyMessageSentStatus(messageIds, ownerUsername, false)
    })
    it('Sent message is visible on general channel', async () => {
      const messages = await generalChannel.getUserMessages(ownerUsername)
      const text = await messages[1].getText()
      expect(text).toEqual(ownerMessages[0])
    })
    it('Owner creates second channel', async () => {
      sidebar = new Sidebar(ownerAppOldVersion.driver)
      await sidebar.addNewChannel(newChannelName)
      await sidebar.switchChannel(newChannelName)
      const channels = await sidebar.getChannelList()
      expect(channels.length).toEqual(2)
    })
    it('Owner sends a message in second channel', async () => {
      secondChannel = new Channel(ownerAppOldVersion.driver, newChannelName)
      const isMessageInput = await secondChannel.messageInput.isDisplayed()
      expect(isMessageInput).toBeTruthy()
      const messageIds = await secondChannel.sendMessage(ownerMessages[1], ownerUsername)
      await secondChannel.verifyMessageSentStatus(messageIds, ownerUsername, false)
    })

    it("User doesn't see the connection status element in second channel", async () => {
      const correctConnectionStatusElementPresence = await secondChannel.waitForConnectionStatus(true)
      expect(correctConnectionStatusElementPresence).toBe(true)
    })

    it('Message is visible in second channel', async () => {
      const messages = await secondChannel.getUserMessages(ownerUsername)
      const text = await messages[1].getText()
      expect(text).toEqual(ownerMessages[1])
    })

    it(`User sends another ${loopMessages.length} messages to second channel`, async () => {
      for (const message of loopMessages) {
        await secondChannel.sendMessage(message, ownerUsername)
      }

      messagesToCompare = await secondChannel.getUserMessages(ownerUsername)
    })
    it('User closes the old app', async () => {
      await ownerAppOldVersion.close()
      await new Promise<void>(resolve => setTimeout(() => resolve(), 5000))
    })

    // ________________________________

    it('Owner opens the app in new version', async () => {
      console.log('New version', 1)
      ownerAppNewVersion = new App({ dataDir })
      await ownerAppNewVersion.open()
    })

    if (isAlpha) {
      it('Owner closes debug modal if opened', async () => {
        console.log('New version', 2)
        const debugModal = new DebugModeModal(ownerAppNewVersion.driver)
        await debugModal.close()
      })
    }

    it('Owener sees general channel', async () => {
      console.log('New version', 3)
      generalChannel = new Channel(ownerAppNewVersion.driver, 'general')
      const isGeneralChannel = await generalChannel.element.isDisplayed()
      const generalChannelText = await generalChannel.element.getText()
      expect(isGeneralChannel).toBeTruthy()
      expect(generalChannelText).toEqual('# general')
    })

    it('Confirm that the opened app is the latest version', async () => {
      console.log('New version', 4)
      await new Promise<void>(resolve => setTimeout(() => resolve(), 10000))
      const settingsModal = await new Sidebar(ownerAppNewVersion.driver).openSettings()
      const isSettingsModal = await settingsModal.element.isDisplayed()
      expect(isSettingsModal).toBeTruthy()
      const settingVersion = await settingsModal.getVersion()
      const envVersion = ownerAppNewVersion.buildSetup.getVersionFromEnv()
      expect(settingVersion).toEqual(envVersion)
      await settingsModal.close()
    })

    it('Check number of messages on second channel', async () => {
      console.log('New version', 5)
      await new Promise<void>(resolve => setTimeout(() => resolve(), 2000))
      sidebar = new Sidebar(ownerAppNewVersion.driver)
      await sidebar.switchChannel(newChannelName)
      await new Promise<void>(resolve => setTimeout(() => resolve(), 5000))
      secondChannel = new Channel(ownerAppNewVersion.driver, newChannelName)
      const currentMessages = await secondChannel.getUserMessages(ownerUsername)
      expect(currentMessages.length).toEqual(messagesToCompare.length)
    })
  })
})
