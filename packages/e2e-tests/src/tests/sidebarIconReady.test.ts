import { Builder, By, type WebDriver, type ThenableWebDriver } from 'selenium-webdriver'
import { Options, ServiceBuilder } from 'selenium-webdriver/chrome'
import { Sidebar } from '../selectors'

const describeLinux = process.platform === 'linux' ? describe : describe.skip

describeLinux('sidebar icon readiness during replication', () => {
  let driver: WebDriver

  beforeAll(async () => {
    const options = new Options()
    options.addArguments('--headless=new', '--no-sandbox', '--disable-dev-shm-usage')
    const { driverPath, browserPath } = require('selenium-webdriver/common/seleniumManager').binaryPaths([
      '--browser',
      'chrome',
      '--skip-driver-in-path',
      '--language-binding',
      'javascript',
      '--output',
      'json',
    ])
    options.setChromeBinaryPath(browserPath)
    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .setChromeService(new ServiceBuilder(driverPath))
      .build()
  }, 120_000)

  afterEach(() => jest.restoreAllMocks())
  afterAll(async () => {
    await driver?.quit()
  })

  it.each([true, false])('reacquires a replaced %s-public icon before checking visibility', async isPublic => {
    const id = `general-channel-link-icon-${isPublic ? 'public' : 'private'}`
    await driver.get(`data:text/html,${encodeURIComponent(`<span data-testid="${id}">#</span>`)}`)
    const findElements = driver.findElements.bind(driver)
    let replaced = false
    jest.spyOn(driver, 'findElements').mockImplementation(async locator => {
      const elements = await findElements(locator)
      if (!replaced && elements.length && String(locator).includes(id)) {
        // Reproduce React replacing the row between Selenium's location and visibility commands.
        // The returned reference belongs to a real detached Chrome DOM node, not a mocked error.
        replaced = true
        await driver.executeScript('arguments[0].replaceWith(arguments[0].cloneNode(true))', elements[0])
      }
      return elements
    })
    const icon = await new Sidebar(driver as ThenableWebDriver).getChannelIcon('general', isPublic)
    expect(replaced).toBe(true)
    expect(await icon.isDisplayed()).toBe(true)
    expect(await icon.getAttribute('data-testid')).toBe(id)
  })
})
