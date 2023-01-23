import { By, ThenableWebDriver, until } from 'selenium-webdriver'

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
}
