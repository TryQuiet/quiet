import { By, Key, type ThenableWebDriver, type WebElement, until, error } from 'selenium-webdriver'
import { BuildSetup, logAndReturnError, promiseWithRetries, sleep, type BuildSetupInit } from './utils'
import path from 'path'
import { BACK_ARROW_DATA_TESTID } from './enums'
import { MessageIds, RetryConfig } from './types'

export class App {
  thenableWebDriver?: ThenableWebDriver
  buildSetup: BuildSetup
  isOpened: boolean
  retryConfig: RetryConfig = {
    attempts: 3,
    timeoutMs: 600000,
  }
  shortRetryConfig: RetryConfig = {
    ...this.retryConfig,
    timeoutMs: 30000,
  }

  constructor(buildSetupConfig?: BuildSetupInit) {
    this.buildSetup = new BuildSetup({ ...buildSetupConfig })
    this.isOpened = false
  }

  get driver(): ThenableWebDriver {
    if (!this.thenableWebDriver) {
      this.thenableWebDriver = this.buildSetup.getDriver()
    }
    return this.thenableWebDriver
  }

  get name() {
    return this.buildSetup.dataDir
  }

  async open(): Promise<void> {
    console.log('opening the app', this.buildSetup.dataDir)
    this.buildSetup.resetDriver()
    await this.buildSetup.createChromeDriver()
    this.isOpened = true
    this.thenableWebDriver = this.buildSetup.getDriver()
    await this.driver.getSession()
    const debugModal = new DebugModeModal(this.driver)
    await debugModal.close()
  }

  async openWithRetries(overrideConfig?: RetryConfig): Promise<void> {
    const config = {
      ...this.retryConfig,
      ...(overrideConfig ? overrideConfig : {}),
    }
    const failureReason = `Failed to open app within ${config.timeoutMs}ms`
    await promiseWithRetries(this.open(), failureReason, config, this.close)
  }

  async close(options?: { forceSaveState?: boolean }): Promise<void> {
    if (!this.isOpened) return
    console.log('Closing the app', this.buildSetup.dataDir)
    if (options?.forceSaveState) {
      await this.saveState() // Selenium creates community and closes app so fast that redux state may not be saved properly
      await this.waitForSavedState()
    }
    await this.buildSetup.closeDriver()
    await this.buildSetup.killChromeDriver()
    if (process.platform === 'win32') {
      this.buildSetup.killNine()
      await new Promise<void>(resolve => setTimeout(() => resolve(), 2000))
    }
    this.isOpened = false
    console.log('App closed', this.buildSetup.dataDir)
  }

  async cleanup(force: boolean = false) {
    console.log(`Performing app cleanup`, this.buildSetup.dataDir)
    if (this.isOpened) {
      throw new Error(`App with dataDir ${this.buildSetup.dataDir} is still open, close before cleaning up!`)
    }
    this.buildSetup.clearDataDir(force)
  }

  get saveStateButton() {
    return this.driver.wait(until.elementLocated(By.xpath('//div[@data-testid="save-state-button"]')))
  }

  async closeUpdateModalIfPresent() {
    const updateModal = new UpdateModal(this.driver)
    await updateModal.close()
  }

  async saveState() {
    const stateButton = await this.saveStateButton
    await this.driver.executeScript('arguments[0].click();', stateButton)
  }

  async waitForSavedState() {
    const dataSaved = this.driver.wait(until.elementLocated(By.xpath('//div[@data-is-saved="true"]')))
    return await dataSaved
  }
}

export class StartingLoadingPanel {
  private readonly driver: ThenableWebDriver
  constructor(driver: ThenableWebDriver) {
    this.driver = driver
  }

  get element() {
    return this.driver.wait(until.elementLocated(By.xpath('//div[@data-testid="startingPanelComponent"]')))
  }
}

export class WarningModal {
  private readonly driver: ThenableWebDriver

  constructor(driver: ThenableWebDriver) {
    this.driver = driver
  }

  get titleElement() {
    return this.driver.wait(until.elementLocated(By.xpath('//h3[@data-testid="warningModalTitle"]')))
  }

  async close() {
    const submitButton = await this.driver.findElement(By.xpath('//button[@data-testid="warningModalSubmit"]'))
    await submitButton.click()
  }
}

export class JoiningLoadingPanel {
  private readonly driver: ThenableWebDriver
  constructor(driver: ThenableWebDriver) {
    this.driver = driver
  }

  get element() {
    return this.driver.wait(until.elementLocated(By.xpath('//div[@data-testid="joiningPanelComponent"]')))
  }
}

export class ChannelContextMenu {
  private readonly driver: ThenableWebDriver
  constructor(driver: ThenableWebDriver) {
    this.driver = driver
  }

  async openMenu() {
    const menu = this.driver.wait(until.elementLocated(By.xpath('//div[@data-testid="channelContextMenuButton"]')))
    await menu.click()
  }

  async openDeletionChannelModal() {
    const tab = this.driver.wait(until.elementLocated(By.xpath('//div[@data-testid="contextMenuItemDelete"]')))
    await tab.click()
  }

  async deleteChannel() {
    const button = this.driver.wait(until.elementLocated(By.xpath('//button[@data-testid="deleteChannelButton"]')))
    await button.click()
    await new Promise<void>(resolve =>
      setTimeout(() => {
        resolve()
      }, 5000)
    )
  }
}

export class UserProfileContextMenu {
  private readonly driver: ThenableWebDriver

  constructor(driver: ThenableWebDriver) {
    this.driver = driver
  }

  async openMenu() {
    const button = await this.driver.wait(
      until.elementLocated(By.xpath('//div[@data-testid="user-profile-menu-button"]')),
      20000,
      'Context menu button not found',
      500
    )
    await this.driver.wait(until.elementIsVisible(button), 20000, 'Context menu button never became visible', 500)
    await button.click()
  }

  async back(dataTestid: BACK_ARROW_DATA_TESTID) {
    const button = await this.driver.wait(
      until.elementLocated(By.xpath(`//div[@data-testid="${dataTestid}"]`)),
      20000,
      `Context back button with data-testid ${dataTestid} not found`,
      500
    )

    console.log('clicking back button')
    // await this.driver.executeScript('arguments[0].click();', button)
    await button.click()
  }

  async openEditProfileMenu() {
    const button = await this.driver.wait(
      until.elementLocated(By.xpath('//div[@data-testid="contextMenuItemEdit profile"]')),
      20000,
      'Edit Profile button not found',
      500
    )
    await this.driver.wait(until.elementIsVisible(button), 20000, 'Edit Profile button never became visible', 500)
    await button.click()
  }

  async uploadPhoto(fileName: string) {
    const input = await this.driver.wait(
      until.elementLocated(By.xpath('//input[@data-testid="user-profile-edit-photo-input"]')),
      10000,
      'Edit Photo button not found',
      500
    )
    const filePath = path.join(__dirname, fileName)
    await input.sendKeys(filePath)
  }

  async uploadPNGPhoto() {
    await this.uploadPhoto('../assets/profile-photo.png')
  }

  async uploadJPEGPhoto() {
    await this.uploadPhoto('../assets/profile-photo.jpg')
  }

  async uploadGIFPhoto() {
    await this.uploadPhoto('../assets/profile-photo.gif')
  }

  async waitForPhoto(): Promise<WebElement> {
    await sleep(3000)
    const photoElement = await this.driver.wait(until.elementLocated(By.className('UserProfilePanel-profilePhoto')))
    return photoElement
  }

  async getProfilePhotoSrc(): Promise<string> {
    const photoElement = await this.waitForPhoto()
    return photoElement.getAttribute('src')
  }
}

export class RegisterUsernameModal {
  private readonly driver: ThenableWebDriver
  constructor(driver: ThenableWebDriver) {
    this.driver = driver
  }

  get element() {
    return this.driver.wait(until.elementLocated(By.xpath("//h3[text()='Register a username']")))
  }

  get elementUsernameTaken() {
    return this.driver.wait(until.elementLocated(By.xpath("//h6[text()='Username taken']")))
  }

  get error() {
    return this.driver.wait(until.elementLocated(By.xpath("//p[text()='Username already taken.']")))
  }

  async typeUsername(username: string) {
    const usernameInput = await this.driver.findElement(By.xpath('//input[@name="userName"]'))
    await usernameInput.sendKeys(username)
  }

  async clearInput() {
    const usernameInput = await this.driver.findElement(By.xpath('//input[@name="userName"]'))
    if (process.platform === 'darwin') {
      await usernameInput.sendKeys(Key.COMMAND + 'a')
      await usernameInput.sendKeys(Key.DELETE)
    } else {
      await usernameInput.sendKeys(Key.CONTROL + 'a')
      await usernameInput.sendKeys(Key.DELETE)
    }
  }

  async submit() {
    const submitButton = await this.driver.findElement(By.xpath('//button[text()="Register"]'))
    await submitButton.click()
  }

  async submitUsernameTaken() {
    const submitButton = await this.driver.findElement(By.xpath('//button[text()="Continue"]'))
    await submitButton.click()
  }
}
export class JoinCommunityModal {
  private readonly driver: ThenableWebDriver
  constructor(driver: ThenableWebDriver) {
    this.driver = driver
  }

  get element() {
    return this.driver.wait(until.elementLocated(By.xpath("//h3[text()='Join community']")))
  }

  async switchToCreateCommunity() {
    const link = this.driver.findElement(By.linkText('create a new community'))
    await link.click()
  }

  async typeCommunityInviteLink(inviteLink: string) {
    const communityNameInput = await this.driver.findElement(By.xpath('//input[@placeholder="Invite link"]'))
    await communityNameInput.sendKeys(inviteLink)
  }

  async submit() {
    const continueButton = await this.driver.findElement(By.xpath('//button[@data-testid="continue-joinCommunity"]'))
    await continueButton.click()
  }
}
export class CreateCommunityModal {
  private readonly driver: ThenableWebDriver
  constructor(driver: ThenableWebDriver) {
    this.driver = driver
  }

  get element() {
    return this.driver.findElement(By.xpath("//h3[text()='Create your community']"))
  }

  async typeCommunityName(name: string) {
    const communityNameInput = await this.driver.findElement(By.xpath('//input[@placeholder="Community name"]'))
    await communityNameInput.sendKeys(name)
  }

  async submit() {
    const continueButton = await this.driver.findElement(By.xpath('//button[@data-testid="continue-createCommunity"]'))
    await continueButton.click()
  }
}
export class Channel {
  private readonly name: string
  private readonly driver: ThenableWebDriver
  constructor(driver: ThenableWebDriver, name: string) {
    this.driver = driver
    this.name = name
  }

  get title() {
    return this.driver.findElement(By.xpath(`//span[text()="#${this.name}}"]`))
  }

  get messagesList() {
    return this.driver.findElement(By.xpath('//ul[@id="messages-scroll"]'))
  }

  async waitForUserMessage(username: string, messageContent: string) {
    console.log(`Waiting for user "${username}" message "${messageContent}"`)
    return this.driver.wait(async () => {
      const messages = await this.getUserMessages(username)
      for (const element of messages) {
        const text = await element.getText()
        console.log(`Potential message with text: ${text}`)
        if (text.includes(messageContent)) {
          console.log(`Found message with matching text ${text}`)
          return element
        }
      }
      throw logAndReturnError(`No message found for user ${username} and message content ${messageContent}`)
    })
  }

  get getAllMessages() {
    return this.driver.wait(until.elementsLocated(By.xpath('//*[contains(@data-testid, "userMessages-")]')))
  }

  get element() {
    return this.driver.wait(until.elementLocated(By.xpath('//p[@data-testid="general-link-text"]')))
  }

  get messageInput() {
    return this.driver.wait(until.elementLocated(By.xpath('//*[@data-testid="messageInput"]')))
  }

  async sendMessage(message: string, username: string): Promise<MessageIds> {
    const communityNameInput = await this.messageInput
    await communityNameInput.sendKeys(message)
    await communityNameInput.sendKeys(Key.ENTER)
    await sleep(5000)
    return this.getMessageIdsByText(message, username)
  }

  async getMessageIdsByText(message: string, username: string): Promise<MessageIds> {
    const messageElement = await this.waitForUserMessage(username, message)
    if (!messageElement) {
      throw logAndReturnError(`No message element found for message ${message}`)
    }

    let testId = await messageElement.getAttribute('data-testid')
    console.log(`Data Test ID for message content: ${testId}`)
    let testIdSplit = testId.split('-')
    const parentMessageId = testIdSplit[testIdSplit.length - 1]

    const contentElement = await this.waitForMessageContentByText(message, messageElement)
    if (!contentElement) {
      throw logAndReturnError(`No message content element found for message content ${message}`)
    }

    testId = await contentElement.getAttribute('data-testid')
    console.log(`Data Test ID for message content: ${testId}`)
    testIdSplit = testId.split('-')
    const messageId = testIdSplit[testIdSplit.length - 1]
    return {
      messageId,
      parentMessageId,
    }
  }

  async verifyMessageSentStatus(messageIds: MessageIds, username: string, expectedUnsent: boolean): Promise<void> {
    await sleep(3000)
    const sendingAsExpected = await this.waitForSending(username, messageIds.parentMessageId, expectedUnsent)
    if (!sendingAsExpected) {
      throw logAndReturnError(
        `Sending... element presence was expected to be ${expectedUnsent} due to unsent being expected to be ${expectedUnsent}`
      )
    }

    const expectedOpacity = expectedUnsent ? '0.5' : '1'

    const avatar = await this.waitForAvatar(username, messageIds.parentMessageId)
    const avatarOpacity = await avatar.getCssValue('opacity')
    if (avatarOpacity !== expectedOpacity) {
      throw logAndReturnError(
        `Opacity of avatar was expected to be ${expectedOpacity} due to unsent being expected to be ${expectedUnsent} but was ${avatarOpacity}`
      )
    }

    const dateLabel = await this.waitForDateLabel(username, messageIds.parentMessageId)
    const dateLabelOpacity = await dateLabel.getCssValue('opacity')
    if (dateLabelOpacity !== expectedOpacity) {
      throw logAndReturnError(
        `Opacity of date label was expected to be ${expectedOpacity} due to unsent being expected to be ${expectedUnsent} but was ${dateLabelOpacity}`
      )
    }

    const messageContent = await this.waitForMessageContentById(messageIds.messageId)
    const messageContentOpacity = await messageContent.getCssValue('opacity')
    if (messageContentOpacity != expectedOpacity) {
      throw logAndReturnError(
        `Opacity of message content was expected to be ${expectedOpacity} due to unsent being expected to be ${expectedUnsent} but was ${messageContentOpacity}`
      )
    }
  }

  async getUserMessages(username: string) {
    return await this.driver.wait(
      until.elementsLocated(By.xpath(`//*[contains(@data-testid, "userMessages-${username}")]`))
    )
  }

  async getUserMessagesFull(username: string) {
    return await this.driver.wait(
      until.elementsLocated(By.xpath(`//*[contains(@data-testid, "userMessagesWrapper-${username}")]`))
    )
  }

  async getAtleastNumUserMessages(username: string, num: number): Promise<WebElement[] | null> {
    return await this.driver.wait(async (): Promise<WebElement[] | null> => {
      const messages = await this.getUserMessages(username)
      return messages.length >= num ? messages : null
    })
  }

  async waitForLabel(username: string, label: string) {
    console.log(`Waiting for user's "${username}" label "${label}" label`)
    await this.driver.wait(async () => {
      const labels = await this.driver.findElements(By.xpath(`//*[contains(@data-testid, "userLabel-${username}")]`))
      const properLabels = labels.filter(async labelElement => {
        const labelText = await labelElement.getText()
        return labelText === label
      })
      return properLabels.length > 0
    })
  }

  async waitForAvatar(username: string, messageId: string): Promise<WebElement> {
    console.log(`Waiting for user's avatar with username ${username} for message with ID ${messageId}`)
    const avatarElement = await this.driver.wait(
      this.driver.findElement(By.xpath(`//*[contains(@data-testid, "userAvatar-${username}-${messageId}")]`))
    )
    if (avatarElement) {
      console.log(`Found user's avatar with username ${username} for message with ID ${messageId}`)
      return avatarElement
    }

    throw logAndReturnError(`Failed to find user's avatar with username ${username} for message with ID ${messageId}`)
  }

  async waitForDateLabel(username: string, messageId: string): Promise<WebElement> {
    console.log(`Waiting for date for message with ID ${messageId}`)
    const dateElement = await this.driver.wait(
      this.driver.findElement(By.xpath(`//*[contains(@data-testid, "messageDateLabel-${username}-${messageId}")]`))
    )
    if (dateElement) {
      console.log(`Found date label for message with ID ${messageId}`)
      return dateElement
    }

    throw logAndReturnError(`Failed to find date label for message with ID ${messageId}`)
  }

  async waitForMessageContentById(messageId: string): Promise<WebElement> {
    console.log(`Waiting for content for message with ID ${messageId}`)
    const messageContentElement = await this.driver.wait(
      this.driver.findElement(By.xpath(`//*[contains(@data-testid, "messagesGroupContent-${messageId}")]`))
    )
    if (messageContentElement) {
      console.log(`Found content for message with ID ${messageId}`)
      return messageContentElement
    }

    throw logAndReturnError(`Failed to find content for message with ID ${messageId}`)
  }

  async waitForMessageContentByText(messageContent: string, messageElement: WebElement): Promise<WebElement> {
    console.log(`Waiting for content for message with text ${messageContent}`)
    const messageContentElements = await this.driver.wait(
      messageElement.findElements(By.xpath(`//*[contains(@data-testid, "messagesGroupContent-")]`))
    )
    for (const element of messageContentElements) {
      console.log(await element.getId())
      const text = await element.getText()
      console.log(`Testing content: ${messageContent}`)
      if (text.includes(messageContent)) {
        console.log(`Found content element for message with text ${messageContent}`)
        return element
      }
    }

    throw logAndReturnError(`Failed to find content for message with content ${messageContent}`)
  }

  async waitForSending(username: string, messageId: string, expected: boolean): Promise<boolean> {
    const testId = `unsent-sending-${username}-${messageId}`
    console.log(`Waiting for 'sending...' element for message with data-testid ${testId}`)
    try {
      await this.driver.wait(this.driver.findElement(By.xpath(`//div[contains(@data-testid, "${testId}")]`)))
      if (!expected) {
        console.error(`Found 'sending...' element for message with ID ${messageId} but didn't expect to`)
        return false
      }
      return true
    } catch (e) {
      if (e instanceof error.NoSuchElementError) {
        if (expected) {
          console.error(`Failed to find 'sending...' element for message with ID ${messageId} but expected to`)
          return false
        }
        return true
      }
      console.error(`Error occurred while finding 'sending...' element for message with ID ${messageId}`, e)
      return false
    }
  }

  async waitForConnectionStatus(expected: boolean): Promise<boolean> {
    console.log(
      `Waiting for connection status element for channel with name ${this.name} with expected presence = ${expected}`
    )
    try {
      const element = await this.driver.wait(
        this.driver.findElement(By.xpath(`//*[contains(@data-testid, "quietTryingToConnect-${this.name}")]`))
      )
      const elementDisplayed = await element.isDisplayed()
      if (elementDisplayed && !expected) {
        console.error(
          `Found connection status element for channel with name ${this.name} and it was displayed but didn't expect to see it`
        )
        return false
      } else if (!elementDisplayed && expected) {
        console.error(
          `Found connection status element for channel with name ${this.name} and it was not displayed but expected to see it`
        )
        return false
      }
      return true
    } catch (e) {
      if (e instanceof error.NoSuchElementError) {
        if (expected) {
          console.error(`Failed to find connection status element for channel with name ${this.name} but expected to`)
          return false
        }
        return true
      }
      console.error(`Error occurred while finding connection status element for channel with name ${this.name}`, e)
      return false
    }
  }

  async waitForLabelsNotPresent(username: string) {
    console.log(`Waiting for user's "${username}" label to not be present`)
    await this.driver.wait(async () => {
      const labels = await this.driver.findElements(By.xpath(`//*[contains(@data-testid, "userLabel-${username}")]`))
      return labels.length === 0
    })
  }

  async getMessage(text: string) {
    return await this.driver.wait(until.elementLocated(By.xpath(`//span[contains(text(),"${text}")]`)))
  }
}
export class Sidebar {
  private readonly driver: ThenableWebDriver
  constructor(driver: ThenableWebDriver) {
    this.driver = driver
  }

  async getChannelList() {
    const channels = await this.driver.findElements(By.xpath('//*[contains(@data-testid, "link-text")]'))
    return channels
  }

  /**
   * Get names of all channels in the sidebar
   */
  async getChannelsNames() {
    const elements = await this.getChannelList()
    return Promise.all(
      elements.map(async element => {
        const fullName = await element.getText()
        return fullName.split(' ')[1]
      })
    )
  }

  async waitForChannelsNum(num: number) {
    console.log(`Waiting for ${num} channels`)
    return this.driver.wait(async () => {
      const channels = await this.getChannelList()
      return channels.length === num
    })
  }

  async waitForChannels(channelsNames: Array<string>) {
    await this.waitForChannelsNum(channelsNames.length)
    const names = await this.getChannelsNames()
    expect(names).toEqual(expect.arrayContaining(channelsNames))
  }

  async openSettings() {
    const button = await this.driver.findElement(By.xpath('//span[@data-testid="settings-panel-button"]'))
    await button.click()
    return new Settings(this.driver)
  }

  async switchChannel(name: string) {
    const channelLink = await this.driver.wait(until.elementLocated(By.xpath(`//div[@data-testid="${name}-link"]`)))
    await channelLink.click()
  }

  async addNewChannel(name: string) {
    const button = await this.driver.findElement(By.xpath('//button[@data-testid="addChannelButton"]'))
    await button.click()
    const channelNameInput = await this.driver.findElement(By.xpath('//input[@name="channelName"]'))
    await channelNameInput.sendKeys(name)
    const channelNameButton = await this.driver.findElement(By.xpath('//button[@data-testid="channelNameSubmit"]'))
    await channelNameButton.click()
    return new Channel(this.driver, name)
  }
}

export class UpdateModal {
  private readonly driver: ThenableWebDriver
  constructor(driver: ThenableWebDriver) {
    this.driver = driver
  }

  get element() {
    console.log('Waiting for update modal root element')
    return this.driver.wait(
      until.elementLocated(By.xpath("//h3[text()='Software update']/ancestor::div[contains(@class,'MuiModal-root')]"))
    )
  }

  async close() {
    const updateModalRootElement = await this.element
    console.log('Found update modal root element')
    const closeButton = await updateModalRootElement.findElement(
      By.xpath("//*[self::div[@data-testid='ModalActions']]/button")
    )

    try {
      console.log('Before clicking update modal close button')
      await closeButton.click()
      return
    } catch (e) {
      console.error('Error while clicking close button on update modal', e.message)
    }

    try {
      const log = await this.driver.executeScript('arguments[0].click();', closeButton)
      console.log('executeScript', log)
    } catch (e) {
      console.log('Probably clicked hidden close button on update modal')
    }
  }
}
export class Settings {
  private readonly driver: ThenableWebDriver
  constructor(driver: ThenableWebDriver) {
    this.driver = driver
  }

  get element() {
    return this.driver.wait(until.elementLocated(By.xpath("//h6[text()='Settings']")))
  }

  async getVersion() {
    await this.switchTab('about')
    await new Promise<void>(resolve => setTimeout(() => resolve(), 500))
    const textWebElement = await this.driver.findElement(By.xpath('//p[contains(text(),"Version")]'))
    const text = await textWebElement.getText()

    const version = this.formatVersionText(text)

    return version
  }

  private formatVersionText(text: string) {
    const index1 = text.indexOf(':') + 1
    const index2 = text.indexOf('\n')
    const version = text.slice(index1, index2).trim()
    return version
  }

  async openLeaveCommunityModal() {
    const tab = await this.driver.wait(until.elementLocated(By.xpath('//p[@data-testid="leave-community-tab"]')))
    await tab.click()
  }

  async leaveCommunityButton() {
    const button = await this.driver.wait(until.elementLocated(By.xpath('//button[text()="Leave community"]')))
    await button.click()
  }

  async switchTab(name: string) {
    const tab = await this.driver.findElement(By.xpath(`//button[@data-testid='${name}-settings-tab']`))
    await tab.click()
  }

  async invitationCode() {
    const unlockButton = await this.driver.findElement(By.xpath('//button[@data-testid="show-invitation-link"]'))

    await unlockButton.click()

    return await this.driver.findElement(By.xpath("//p[@data-testid='invitation-link']"))
  }

  async close() {
    const closeButton = await this.driver
      .findElement(By.xpath('//div[@data-testid="settingsModalActions"]'))
      .findElement(By.css('button'))
    await closeButton.click()
  }
}
export class DebugModeModal {
  private readonly driver: ThenableWebDriver
  constructor(driver: ThenableWebDriver) {
    this.driver = driver
    console.log('Debug modal')
  }

  get element() {
    return this.driver.wait(until.elementLocated(By.xpath("//h3[text()='App is running in debug mode']")), 5000)
  }

  get button() {
    return this.driver.wait(until.elementLocated(By.xpath("//button[text()='Understand']")), 5000)
  }

  async close() {
    if (!process.env.TEST_MODE) return
    let button
    try {
      console.log('Closing debug modal')
      await this.element.isDisplayed()
      console.log('Debug modal title is displayed')
      button = await this.button
      console.log('Debug modal button is displayed')
    } catch (e) {
      console.log('Debug modal might have been covered by "join community" modal', e.message)
      return
    }

    await button.isDisplayed()
    console.log('Button is displayed')
    await button.click()
    console.log('Button click')
    try {
      const log = await this.driver.executeScript('arguments[0].click();', button)
      console.log('executeScript', log)
    } catch (e) {
      console.log('Probably clicked hidden close button on debug modal')
    }
    await new Promise<void>(resolve => setTimeout(() => resolve(), 2000))
  }
}
