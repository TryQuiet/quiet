import { By, Key, type ThenableWebDriver, type WebElement, until } from 'selenium-webdriver'
import { BuildSetup, sleep, type BuildSetupInit } from './utils'
import path from 'path'
import { X_DATA_TESTID } from './enums'
import { createLogger } from './logger'

const logger = createLogger('selectors')

export class App {
  thenableWebDriver?: ThenableWebDriver
  buildSetup: BuildSetup
  isOpened: boolean
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

  async open() {
    logger.info('opening the app', this.buildSetup.dataDir)
    this.buildSetup.resetDriver()
    await this.buildSetup.createChromeDriver()
    this.isOpened = true
    this.thenableWebDriver = this.buildSetup.getDriver()
    await this.driver.getSession()
    const debugModal = new DebugModeModal(this.driver)
    await debugModal.close()
  }

  async close(options?: { forceSaveState?: boolean }) {
    if (!this.isOpened) return
    logger.info('Closing the app', this.buildSetup.dataDir)
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
    logger.info('App closed', this.buildSetup.dataDir)
  }

  async cleanup(force: boolean = false) {
    logger.info(`Performing app cleanup`, this.buildSetup.dataDir)
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

  async back(dataTestid: X_DATA_TESTID) {
    const button = await this.driver.wait(
      until.elementLocated(By.xpath(`//button[@data-testid="${dataTestid}"]`)),
      20000,
      `Context back button with data-testid ${dataTestid} not found`,
      500
    )

    logger.info('clicking back button')
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

  async messagesGroup() {
    const messagesList = await this.messagesList
    return await messagesList.findElement(By.css('li'))
  }

  async messagesGroupContent() {
    const messagesGroup = await this.messagesGroup()
    return await messagesGroup.findElement(By.xpath('//p[@data-testid="/messagesGroupContent-/"]'))
  }

  async waitForUserMessage(username: string, messageContent: string) {
    logger.info(`Waiting for user "${username}" message "${messageContent}"`)
    return this.driver.wait(async () => {
      const messages = await this.getUserMessages(username)
      const hasMessage = messages.find(async msg => {
        const messageText = await msg.getText()
        logger.info(`got message "${messageText}"`)
        return messageText.includes(messageContent)
      })
      return hasMessage
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

  async sendMessage(message: string) {
    const communityNameInput = await this.messageInput
    await communityNameInput.sendKeys(message)
    await communityNameInput.sendKeys(Key.ENTER)
    await new Promise<void>(resolve =>
      setTimeout(() => {
        resolve()
      }, 5000)
    )
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
    logger.info(`Waiting for user's "${username}" label "${label}" label`)
    await this.driver.wait(async () => {
      const labels = await this.driver.findElements(By.xpath(`//*[contains(@data-testid, "userLabel-${username}")]`))
      const properLabels = labels.filter(async labelElement => {
        const labelText = await labelElement.getText()
        return labelText === label
      })
      return properLabels.length > 0
    })
  }

  async waitForLabelsNotPresent(username: string) {
    logger.info(`Waiting for user's "${username}" label to not be present`)
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
    logger.info(`Waiting for ${num} channels`)
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
    logger.info('Waiting for update modal root element')
    return this.driver.wait(
      until.elementLocated(By.xpath("//h3[text()='Software update']/ancestor::div[contains(@class,'MuiModal-root')]"))
    )
  }

  async close() {
    const updateModalRootElement = await this.element
    logger.info('Found update modal root element')
    const closeButton = await updateModalRootElement.findElement(
      By.xpath("//*[self::div[@data-testid='ModalActions']]/button")
    )

    try {
      logger.info('Before clicking update modal close button')
      await closeButton.click()
      return
    } catch (e) {
      logger.error('Error while clicking close button on update modal', e)
    }

    try {
      const log = await this.driver.executeScript('arguments[0].click();', closeButton)
      logger.info('executeScript', log)
    } catch (e) {
      logger.warn('Probably clicked hidden close button on update modal')
    }
  }
}
export class Settings {
  private readonly driver: ThenableWebDriver
  constructor(driver: ThenableWebDriver) {
    this.driver = driver
  }

  get element() {
    return this.driver.wait(until.elementLocated(By.xpath("//p[text()='Community Settings']")))
  }

  async switchTab(name: string) {
    const tab = await this.driver.findElement(By.xpath(`//div[@data-testid='${name}-settings-tab']`))
    await tab.click()
    await new Promise<void>(resolve => setTimeout(() => resolve(), 500))
  }

  async getVersion() {
    await this.switchTab('about')

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

  async leaveCommunity() {
    await this.switchTab('leave-community')

    const button = await this.driver.wait(
      until.elementLocated(By.xpath('//button[@data-testid="leave-community-button"]'))
    )
    await button.click()
  }

  async invitationCode() {
    await this.switchTab('invite')

    const unlockButton = await this.driver.findElement(By.xpath('//button[@data-testid="show-invitation-link"]'))
    await unlockButton.click()

    return await this.driver.findElement(By.xpath("//p[@data-testid='invitation-link']"))
  }

  async closeTab() {
    const closeButton = await this.driver
      .findElement(By.xpath('//div[@data-testid="close-tab-button-box"]'))
      .findElement(By.css('button'))
    await closeButton.click()
  }

  async closeModal() {
    const closeButton = await this.driver.findElement(By.xpath('//div[@data-testid="close-settings-button"]'))
    await closeButton.click()
  }

  async closeTabThenModal() {
    await this.closeTab()
    await this.closeModal()
  }
}

export class DebugModeModal {
  private readonly driver: ThenableWebDriver
  constructor(driver: ThenableWebDriver) {
    this.driver = driver
    logger.info('Debug modal')
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
      logger.info('Closing debug modal')
      await this.element.isDisplayed()
      logger.info('Debug modal title is displayed')
      button = await this.button
      logger.info('Debug modal button is displayed')
    } catch (e) {
      logger.error('Debug modal might have been covered by "join community" modal', e)
      return
    }

    await button.isDisplayed()
    logger.info('Button is displayed')
    await button.click()
    logger.info('Button click')
    try {
      const log = await this.driver.executeScript('arguments[0].click();', button)
      logger.info('executeScript', log)
    } catch (e) {
      logger.warn('Probably clicked hidden close button on debug modal')
    }
    await new Promise<void>(resolve => setTimeout(() => resolve(), 2000))
  }
}
