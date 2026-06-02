import { WebElement } from 'selenium-webdriver'

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
import { DEFAULT_ADD_NEW_CHANNEL_OPTIONS, MessageIds, TestAddNewChannelButtonId } from '../types'
import { BACKWARD_COMPATIBILITY_BASE_VERSION, BuildSetup, copyInstallerFile, downloadInstaller, sleep } from '../utils'
import { createLogger } from '../logger'

const logger = createLogger('backwardsCompatibility')

// this test is only for linux so we need to skip it for other platforms
const itif = (condition: boolean) => (condition ? it : it.skip)

jest.setTimeout(1200000)
describe('Backwards Compatibility', () => {
  let ownerAppOldVersion: App
  let ownerAppNewVersion: App
  let generalChannel: Channel
  let secondChannel: Channel
  const messagesToCompare: Map<string, WebElement[]> = new Map()
  let sidebar: Sidebar
  let generalChannelMessageIds: MessageIds
  let dataDir: string

  const communityName = 'testcommunity'
  const ownerUsername = 'bob'
  const ownerMessages = ['Hi', 'Hello', 'After guest leave app']
  const loopMessages = 'ąbc'.split('')
  const generalChannelName = 'general'
  const newChannelName = 'mid-night-club'

  const isAlpha = BuildSetup.getEnvFileName()?.toString().includes('alpha')

  beforeAll(async () => {
    // download the old version of the app
    const appFilename = downloadInstaller()
    const copiedFilename = copyInstallerFile(appFilename)
    const chromeDriver126Path = require.resolve('electron-chromedriver-126/chromedriver.js')
    dataDir = `e2e_back_compat_${(Math.random() * 10 ** 18).toString(36)}`
    ownerAppOldVersion = new App({ dataDir, fileName: copiedFilename, chromeDriverPath: chromeDriver126Path })
  })

  beforeEach(async () => {
    logger.info(`░░░ ${expect.getState().currentTestName}`)
  })

  afterAll(async () => {
    await ownerAppNewVersion?.close()
    await ownerAppNewVersion?.cleanup(true)
    await ownerAppOldVersion?.close()
    await ownerAppOldVersion?.cleanup(true)
  })

  describe(`Old version - ${BACKWARD_COMPATIBILITY_BASE_VERSION}`, () => {
    describe(`Owner opens older version of the app`, () => {
      itif(process.platform == 'linux')('Owner opens the app', async () => {
        await ownerAppOldVersion.open()
      })

      itif(process.platform == 'linux')('Owner closes "update available" modal if present', async () => {
        try {
          await ownerAppOldVersion.closeUpdateModalIfPresent()
          logger.info('Closed update modal')
        } catch (e) {
          logger.warn('Could not close update modal', e)
        }
      })

      itif(process.platform == 'linux')(
        'Owner sees "join community" modal and switches to "create community" modal',
        async () => {
          const joinModal = new JoinCommunityModal(ownerAppOldVersion.driver)
          expect(await joinModal.isReady()).toBeTruthy()
          await joinModal.switchToCreateCommunity()
        }
      )

      itif(process.platform == 'linux')('Owner submits valid community name', async () => {
        const createModal = new CreateCommunityModal(ownerAppOldVersion.driver)
        expect(await createModal.isReady()).toBeTruthy()
        await createModal.typeCommunityName(communityName)
        await createModal.submit()
      })

      itif(process.platform == 'linux')('Owner sees "register username" modal and submits valid username', async () => {
        const registerModal = new RegisterUsernameModal(ownerAppOldVersion.driver)
        expect(await registerModal.isReady()).toBeTruthy()
        await registerModal.typeUsername(ownerUsername)
        await registerModal.submit()
      })

      itif(process.platform == 'linux')('Owner waits for join to complete', async () => {
        const joinPanel = new JoiningLoadingPanel(ownerAppOldVersion.driver)
        await joinPanel.waitForJoinToComplete()
        try {
          await ownerAppOldVersion.closeUpdateModalIfPresent()
          logger.info('Closed update modal')
        } catch (e) {
          logger.warn('Could not close update modal', e)
        }
      })

      itif(process.platform == 'linux')('Owner registers successfully and sees general channel', async () => {
        generalChannel = new Channel(ownerAppOldVersion.driver, 'general')
        expect(await generalChannel.isReady()).toBeTruthy()

        const generalChannelText = await generalChannel.element.getText()
        expect(generalChannelText).toEqual('# general')
      })

      itif(process.platform == 'linux')(`Verify version - ${BACKWARD_COMPATIBILITY_BASE_VERSION}`, async () => {
        const settingsModal = await new Sidebar(ownerAppOldVersion.driver).openSettings()
        expect(await settingsModal.isReady()).toBeTruthy()
        const settingVersion = await settingsModal.getVersion()
        expect(settingVersion).toEqual(BACKWARD_COMPATIBILITY_BASE_VERSION)
        await settingsModal.closeTabThenModal()
      })
    })

    describe('Owner sends a message', () => {
      itif(process.platform == 'linux')('Owner sends a message in the general channel', async () => {
        expect(await generalChannel.isMessageInputReady()).toBeTruthy()
        generalChannelMessageIds = await generalChannel.sendMessage(ownerMessages[0], ownerUsername)
      })

      itif(process.platform == 'linux')('Sent message is visible on general channel', async () => {
        const messages = await generalChannel.getUserMessages(ownerUsername)
        const text = await messages[1].getText()
        expect(text).toEqual(ownerMessages[0])
        expect(messages.length).toBe(2)
        messagesToCompare.set(generalChannelName, messages)
      })
    })

    describe('Second channel', () => {
      itif(process.platform == 'linux')('Owner creates second channel', async () => {
        sidebar = new Sidebar(ownerAppOldVersion.driver)
        await sidebar.addNewChannel(newChannelName, {
          ...DEFAULT_ADD_NEW_CHANNEL_OPTIONS,
          buttonId: TestAddNewChannelButtonId.PRE_DMS,
        })
        await sidebar.switchChannel(newChannelName, true, false)
        const channels = await sidebar.getChannelList()
        expect(channels.length).toEqual(2)
      })

      itif(process.platform == 'linux')('Owner sends a message in second channel', async () => {
        secondChannel = new Channel(ownerAppOldVersion.driver, newChannelName)
        expect(await secondChannel.isMessageInputReady()).toBeTruthy()
        await secondChannel.sendMessage(ownerMessages[1], ownerUsername)
      })

      itif(process.platform == 'linux')('Message is visible in second channel', async () => {
        const messages = await secondChannel.getUserMessages(ownerUsername)
        const text = await messages[1].getText()
        expect(text).toEqual(ownerMessages[1])
      })

      itif(process.platform == 'linux')(
        `Owner sends another ${loopMessages.length} messages to second channel`,
        async () => {
          for (const message of loopMessages) {
            await secondChannel.sendMessage(message, ownerUsername)
          }

          messagesToCompare.set(newChannelName, await secondChannel.getUserMessages(ownerUsername))
        }
      )
    })
  })

  describe('New version', () => {
    describe('Owner opens new version', () => {
      itif(process.platform == 'linux')('Owner closes the old app', async () => {
        await ownerAppOldVersion.close({ forceSaveState: true })
      })

      itif(process.platform == 'linux')('Owner opens the app in new version', async () => {
        ownerAppNewVersion = new App({ dataDir })
        await ownerAppNewVersion.openWithRetries({ timeoutMs: 60_000, attempts: 3 })
      })

      itif(process.platform == 'linux')('Owner closes debug modal if opened', async () => {
        const debugModal = new DebugModeModal(ownerAppNewVersion.driver)
        await debugModal.close()
        await sleep(30_000)
      })

      itif(process.platform == 'linux')('Owner closes update modal if opened', async () => {
        try {
          await ownerAppNewVersion.closeUpdateModalIfPresent()
          logger.info('Closed update modal')
        } catch (e) {
          // do nothing
        }
      })

      itif(process.platform == 'linux')('Owner waits for app to finish loading', async () => {
        generalChannel = new Channel(ownerAppNewVersion.driver, 'general')
        expect(await generalChannel.isReady()).toBeTruthy()
        expect(await generalChannel.isOpen()).toBeTruthy()
        expect(await generalChannel.isMessageInputReady()).toBeTruthy()
      })

      itif(process.platform == 'linux')('Confirm that the opened app is the latest version', async () => {
        const settingsModal = await new Sidebar(ownerAppNewVersion.driver).openSettings()
        expect(await settingsModal.isReady()).toBeTruthy()
        const settingVersion = await settingsModal.getVersion()
        const envVersion = ownerAppNewVersion.buildSetup.getVersionFromEnv()
        expect(settingVersion).toEqual(envVersion)
        await settingsModal.closeTabThenModal()
      })
    })

    describe('Verify channels', () => {
      itif(process.platform == 'linux')('Owner sees general channel on new version', async () => {
        generalChannel = new Channel(ownerAppNewVersion.driver, 'general')
        expect(await generalChannel.isReady()).toBeTruthy()
        expect(await generalChannel.isOpen()).toBeTruthy()
        expect(await generalChannel.isMessageInputReady()).toBeTruthy()

        const generalChannelText = await generalChannel.element.getText()
        expect(generalChannelText).toEqual('general')
      })

      itif(process.platform == 'linux')('Sent message is visible on general channel on new version', async () => {
        const messages = await generalChannel.getUserMessages(ownerUsername)
        const text = await messages[1].getText()
        expect(text).toEqual(ownerMessages[0])
        expect(messages.length).toEqual(messagesToCompare.get(generalChannelName)!.length)
      })

      itif(process.platform == 'linux')('Verify number of channels', async () => {
        sidebar = new Sidebar(ownerAppNewVersion.driver)
        const channels = await sidebar.getChannelList()
        expect(channels.length).toEqual(2)
      })

      itif(process.platform == 'linux')('Switch to second channel', async () => {
        sidebar = new Sidebar(ownerAppNewVersion.driver)
        await sidebar.switchChannel(newChannelName)
        secondChannel = new Channel(ownerAppNewVersion.driver, newChannelName)
        expect(await secondChannel.isReady()).toBeTruthy()
        expect(await secondChannel.isOpen()).toBeTruthy()
        expect(await secondChannel.isMessageInputReady()).toBeTruthy()
      })

      itif(process.platform == 'linux')('Check number of messages on second channel', async () => {
        const messagesOnNewVersion = await secondChannel.getUserMessages(ownerUsername)
        expect(messagesOnNewVersion.length).toEqual(messagesToCompare.get(newChannelName)!.length)
      })
    })
  })
})
