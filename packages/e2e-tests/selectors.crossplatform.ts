import { By, Key, ThenableWebDriver, until } from 'selenium-webdriver'
export class StartingLoadingPanel {
  private readonly text: string
  private readonly driver: ThenableWebDriver
  constructor(driver: ThenableWebDriver) {
    this.driver = driver
  }

  get element() {
    return this.driver.wait(
      until.elementLocated(By.xpath('//div[@data-testid="startingPanelComponent"]'))
    )
  }
  // get element() {
  //   return this.driver.wait(until.elementLocated(By.xpath(`//span[text()="${this.text}"]`)))
  // }
  // get title() {
  //   return this.driver.findElement(By.xpath(`//span[text()="${this.text}"]`))
  // }
}

export class WarningModal {
  private readonly driver: ThenableWebDriver

  constructor(driver: ThenableWebDriver) {
    this.driver = driver
  }

  get titleElement() {
    return this.driver.wait(
      until.elementLocated(By.xpath('//h3[@data-testid="warningModalTitle"]'))
    )
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
    return this.driver.wait(
      until.elementLocated(By.xpath('//div[@data-testid="joiningPanelComponent"]'))
    )
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

  async typeUsername(username: string) {
    const usernameInput = await this.driver.findElement(By.xpath('//input[@name="userName"]'))
    await usernameInput.sendKeys(username)
  }

  async submit() {
    const submitButton = await this.driver.findElement(By.xpath('//button[text()="Register"]'))
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
    const communityNameInput = await this.driver.findElement(
      By.xpath('//input[@placeholder="Invite code"]')
    )
    await communityNameInput.sendKeys(code)
  }

  async submit() {
    const continueButton = await this.driver.findElement(
      By.xpath('//button[@data-testid="continue-joinCommunity"]')
    )
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
    const communityNameInput = await this.driver.findElement(
      By.xpath('//input[@placeholder="Community name"]')
    )
    await communityNameInput.sendKeys(name)
  }

  async submit() {
    const continueButton = await this.driver.findElement(
      By.xpath('//button[@data-testid="continue-createCommunity"]')
    )
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

  get getAllMessages() {
    return this.driver.wait(
      until.elementsLocated(By.xpath('//*[contains(@data-testid, "userMessages-")]'))
    )
  }

  get element() {
    return this.driver.wait(until.elementLocated(By.xpath('//p[@data-testid="general-link-text"]')))
  }

  get messageInput() {
    return this.driver.wait(until.elementLocated(By.xpath('//div[@data-testid="messageInput"]')))
  }

  async sendMessage(message: string) {
    const communityNameInput = await this.messageInput
    await communityNameInput.sendKeys(message)
    await communityNameInput.sendKeys(Key.ENTER)
  }

  async getUserMessages(username: string) {
    return await this.driver.wait(
      until.elementsLocated(By.xpath(`//*[contains(@data-testid, "userMessages-${username}")]`))
    )
  }
}
export class Sidebar {
  private readonly driver: ThenableWebDriver
  constructor(driver: ThenableWebDriver) {
    this.driver = driver
  }

  async openSettings() {
    const button = await this.driver.findElement(
      By.xpath('//span[@data-testid="settings-panel-button"]')
    )
    await button.click()
    return new Settings(this.driver)
  }

  async switchChannel(name: string) {
    const channelLink = await this.driver.wait(
      until.elementLocated(By.xpath(`//div[@data-testid="${name}-link"]`))
    )
    await channelLink.click()
    return new Channel(this.driver, name)
  }

  async addNewChannel(name: string) {
    const button = await this.driver.findElement(
      By.xpath('//button[@data-testid="addChannelButton"]')
    )
    await button.click()
    const channelNameInput = await this.driver.findElement(By.xpath('//input[@name="channelName"]'))
    await channelNameInput.sendKeys(name)
    const channelNameButton = await this.driver.findElement(
      By.xpath('//button[@data-testid="channelNameSubmit"]')
    )
    await channelNameButton.click()
    return new Channel(this.driver, name)
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

  async switchTab(name: string) {
    const tab = await this.driver.findElement(
      By.xpath(`//button[@data-testid='${name}-settings-tab']`)
    )
    await tab.click()
  }

  async invitationCode() {
    const unlockButton = await this.driver.findElement(
      By.xpath('//button[@data-testid="show-invitation-link"]')
    )

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
    return this.driver.wait(
      until.elementLocated(By.xpath("//h3[text()='App is running in debug mode']"))
    )
  }

  get button() {
    return this.driver.wait(until.elementLocated(By.xpath("//button[text()='Understand']")))
  }

  async close() {
    console.log('Closing debug modal')
    await this.element.isDisplayed()
    const button = await this.button
    console.log('Debug modal title is displayed')
    await button.isDisplayed()
    console.log('Button is displayed')
    await button.click()
    console.log('Button click')
    try {
      const log = await this.driver.executeScript('arguments[0].click();', button)
      console.log('executeScript', log)
    } catch (e) {
      console.log('Probably click properly close modal')
    }
  }
}
