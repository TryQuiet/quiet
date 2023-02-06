import { By, Key, ThenableWebDriver, until } from 'selenium-webdriver'

export class LoadingPanel {
  private readonly text: string
  private readonly driver: ThenableWebDriver

  constructor(driver: ThenableWebDriver, title: string) {
    this.driver = driver
    this.text = title
  }

  get element() {
    return this.driver.wait(until.elementLocated(By.xpath(`//span[text()="${this.text}"]`)))
  }

  get title() {
    return this.driver.findElement(By.xpath(`//span[text()="${this.text}"]`))
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

  // ______________________________________

  // TO TEST

  get messagesList() {
    // return Selector('ul').withAttribute('id', 'messages-scroll')
    return this.driver.findElement(By.xpath('//ul[@id="messages-scroll"]'))
  }

  async messagesGroup() {
    // return this.messagesList.find('li')
    const messagesList = await this.messagesList
    return await messagesList.findElement(By.css('li'))
  }

  async messagesGroupContent() {
    // return this.messagesGroup.find('p').withAttribute('data-testid', /messagesGroupContent-/)
    const messagesGroup = await this.messagesGroup()
    return await messagesGroup.findElement(By.xpath('//p[@data-testid="/messagesGroupContent-/"]'))
  }

  get getAllMessages() {
    // return Selector('div').withAttribute('data-testid', 'userMessages-')
    return this.driver.wait(
      until.elementsLocated(By.xpath('//*[contains(@data-testid, "userMessages-")]'))
    )
  }

  // ____________________________

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

  // ______________________________________

  // TO TEST

  async switchChannel(name: string) {
    // const channelLink = Selector('div').withAttribute('data-testid', `${name}-link`)
    // await t.expect(channelLink.exists).ok()
    // await t.click(channelLink)
    // return new Channel(name)

    const channelLink = await this.driver.wait(
      until.elementLocated(By.xpath(`//div[@data-testid="${name}-link"]`))
    )
    await channelLink.click()
    return new Channel(this.driver, name)
  }

  async addNewChannel(name: string) {
    // const button = Selector('button').withAttribute('data-testid', 'addChannelButton')
    // await t.expect(button.exists).ok()
    // await t.click(button)
    // const channelNameInput = Selector('input').withAttribute('name', 'channelName')
    // await t.typeText(channelNameInput, name)
    // const channelNameButton = Selector('button').withAttribute('data-testid', 'channelNameSubmit')
    // await t.click(channelNameButton)
    // return new Channel(name)

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

  // ______________________________________
}

export class Settings {
  private readonly driver: ThenableWebDriver

  constructor(driver: ThenableWebDriver) {
    this.driver = driver
  }

  get element() {
    // return Selector('h6').withText('Settings')
    return this.driver.wait(until.elementLocated(By.xpath("//h6[text()='Settings']")))
  }

  async switchTab(name: string) {
    const tab = await this.driver.findElement(
      By.xpath(`//button[@data-testid='${name}-settings-tab']`)
    )
    await tab.click()
  }

  async invitationCode() {
    const unlockClass =
      'MuiButtonBase-root MuiIconButton-root MuiIconButton-sizeSmall InviteToCommunityeyeIcon css-1j7qk7u'

    const unlockButton = await this.driver.findElement(By.className(unlockClass))
    await unlockButton.click()
    return await this.driver.findElement(By.xpath("//p[@data-testid='invitation-code']"))
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
  }

  get element() {
    return this.driver.wait(
      until.elementLocated(By.xpath("//h3[text()='App is running in debug mode']"))
    )
  }

  // TO TEST

  async close() {
    await new Promise<void>(resolve => setTimeout(() => resolve(), 2000))
    const isVisible = await this.element.isDisplayed()
    console.log({ isVisible })
    if (isVisible) {
      console.log('if')
      const closeButton = await this.driver.findElement(By.xpath("//button[text()='Understand']"))
      console.log('after closeButton')
      const understandBtn = await this.driver.wait(
        until.elementLocated(By.xpath("//button[text()='Understand']"))
      )
      console.log('after understandBtn')

      await new Promise<void>(resolve => setTimeout(() => resolve(), 2000))

      console.log('is understandBtn', await understandBtn.isDisplayed())
      console.log('is closeButton', await closeButton.isDisplayed())
      await understandBtn.click()
      console.log('after click')
    }
    console.log('outside if')
  }
}
