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
    // const communityNameInput = Selector('input').withAttribute('placeholder', 'Invite code')
    // log(`Typing community invitation code: '${code}'`)
    // await t.typeText(communityNameInput, code)

    const communityNameInput = await this.driver.findElement(
      By.xpath('//input[@placeholder="Invite code"]')
    )
    await communityNameInput.sendKeys(code)
  }

  async submit() {
    // const continueButton = Selector('button').withAttribute('data-testid', 'continue-joinCommunity')
    // await t.click(continueButton)

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
    // return this.driver.wait(
    //   until.elementLocated(
    //     By.xpath(`//div[@data-testid="${new RegExp(`userMessages-${username}`)}"]`)
    //   )
    // )

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
