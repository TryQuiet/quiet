import { By, Key, type ThenableWebDriver, type WebElement, until } from 'selenium-webdriver'
import { BuildSetup, type BuildSetupInit } from './utils'
import path from 'path'

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
    console.log('Opening the app', this.buildSetup.dataDir)
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

  get saveStateButton() {
    return this.driver.wait(until.elementLocated(By.xpath('//div[@data-testid="save-state-button"]')))
  }

  async waitForUpdateInfo() {
    console.log('waiting for update modal')
    const updateModal = new UpdateModal(this.driver)
    console.log('Update Modal - before check with display')
    const isUpdateModal = await updateModal.element.isDisplayed()
    console.log('Update Modal - after check with display', isUpdateModal)
    expect(isUpdateModal).toBeTruthy()
    console.log('Update Modal - before close')
    await updateModal.close()
    console.log('Update Modal - after close')
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
      until.elementLocated(By.xpath('//div[@data-testid="user-profile-menu-button"]'))
    )
    await button.click()
  }

  async openEditProfileMenu() {
    const button = await this.driver.wait(
      until.elementLocated(By.xpath('//div[@data-testid="contextMenuItemEdit profile"]'))
    )
    await this.driver.wait(until.elementIsVisible(button))
    await button.click()
  }

  async uploadPhoto() {
    const input = await this.driver.wait(
      until.elementLocated(By.xpath('//input[@data-testid="user-profile-edit-photo-input"]'))
    )
    const filePath = path.join(__dirname, '../assets/profile-photo.png')
    await input.sendKeys(filePath)
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

  async typeCommunityCode(code: string) {
    const communityNameInput = await this.driver.findElement(By.xpath('//input[@placeholder="Invite code"]'))
    await communityNameInput.sendKeys(code)
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
    console.log(`Waiting for user "${username}" message "${messageContent}"`)
    return this.driver.wait(async () => {
      const messages = await this.getUserMessages(username)
      const hasMessage = messages.find(async msg => {
        const messageText = await msg.getText()
        console.log(`got message "${messageText}"`)
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
    return this.driver.wait(until.elementLocated(By.xpath("//h3[text()='Software update']")))
  }

  async close() {
    const closeButton = await this.driver
      .findElement(By.xpath('//div[@data-testid="ModalActions"]'))
      .findElement(By.css('button'))
    await closeButton.click()
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
