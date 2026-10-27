import { By, type ThenableWebDriver, until } from 'selenium-webdriver'

/**
 * Onboarding as the released 11.0.0 baseline renders it.
 *
 * The backwards-compatibility suite creates its community on the downloaded
 * 11.0.0 AppImage, which predates the onboarding redesign (#3512): its first
 * screen is the "Join community" modal with a "create a new community" link,
 * and username registration is "Register a username" with a Register button.
 * The current selectors only match the redesigned screens, so the baseline
 * phase drives the released UI with these instead. They mirror the selectors
 * the suite used at the @quiet/desktop@11.0.0 tag; change them only together
 * with BACKWARD_COMPATIBILITY_BASE_VERSION.
 */
async function visible(driver: ThenableWebDriver, locator: By, description: string, timeoutMs = 10_000) {
  const element = await driver.wait(until.elementLocated(locator), timeoutMs, `${description} couldn't be found`, 500)
  await driver.wait(until.elementIsVisible(element), timeoutMs, `${description} wasn't visible`, 500)
  return element
}

async function click(driver: ThenableWebDriver, locator: By, description: string) {
  const element = await visible(driver, locator, description)
  await driver.wait(until.elementIsEnabled(element), 5_000, `${description} wasn't enabled`)
  await element.click()
}

export class ReleasedBaselineJoinCommunityModal {
  constructor(private readonly driver: ThenableWebDriver) {}

  async isReady(timeoutMs = 10_000): Promise<boolean> {
    await visible(this.driver, By.xpath("//h3[text()='Join community']"), 'Join community modal', timeoutMs)
    return true
  }

  async switchToCreateCommunity() {
    await click(this.driver, By.linkText('create a new community'), 'Create community link')
  }
}

export class ReleasedBaselineCreateCommunityModal {
  constructor(private readonly driver: ThenableWebDriver) {}

  async isReady(): Promise<boolean> {
    await visible(this.driver, By.xpath("//h3[text()='Create your community']"), 'Create community modal')
    return true
  }

  async typeCommunityName(name: string) {
    const input = await visible(this.driver, By.xpath('//input[@placeholder="Community name"]'), 'Community name input')
    await input.sendKeys(name)
  }

  async submit() {
    await click(
      this.driver,
      By.xpath('//button[@data-testid="continue-createCommunity"]'),
      'Create community submit button'
    )
  }
}

export class ReleasedBaselineRegisterUsernameModal {
  constructor(private readonly driver: ThenableWebDriver) {}

  async isReady(): Promise<boolean> {
    await visible(this.driver, By.xpath("//h3[text()='Register a username']"), 'Username registration modal', 15_000)
    return true
  }

  async typeUsername(username: string) {
    const input = await visible(this.driver, By.xpath('//input[@name="userName"]'), 'Username input')
    await input.sendKeys(username)
  }

  async submit() {
    await click(this.driver, By.xpath('//button[text()="Register"]'), 'Username registration submit button')
  }
}
