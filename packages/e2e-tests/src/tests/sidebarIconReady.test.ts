import { Builder, By, type WebDriver, type ThenableWebDriver } from 'selenium-webdriver'
import { Options, ServiceBuilder } from 'selenium-webdriver/chrome'
import { Sidebar } from '../selectors'
import { DEFAULT_ADD_NEW_CHANNEL_PRIVATE_OPTIONS } from '../types'

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
  it.each([
    [true, false],
    [true, true],
    [false, false],
  ])(
    'waits for the entering drawer without bypassing an overlay (settles=%s, replaced=%s)',
    async (settles, replaced) => {
      await driver.manage().window().setRect({ width: 800, height: 600 })
      await driver.get(
        `data:text/html,${encodeURIComponent(`
      <style>
        #drawer { position:fixed; top:0; right:0; width:380px; height:400px;
          transform:translateX(45px); transition:transform 250ms; }
        #toggle { display:block; position:absolute; right:16px; top:80px;
          width:50px; height:30px; background:gray; }
      </style>
      <div id="backdrop" style="position:fixed;right:0;top:60px;width:70px;height:80px;z-index:2"></div>
      <button data-testid="sidebar-button-createChannel" onclick="document.querySelector('#drawer').hidden=false">New channel</button>
      <div id="drawer" hidden>
        <input name="channelName" oninput="if(!window.started){window.started=true;${replaced ? `setTimeout(()=>{const node=document.querySelector('#toggle');node.replaceWith(node.cloneNode(true))},1000);` : ''}setTimeout(()=>{document.querySelector('#drawer').style.transform='none';document.querySelector('#backdrop').remove()},${settles ? 2800 : 60000})}">
        <span id="toggle" data-testid="createChannel-private-form-control-toggle"
          onclick="this.classList.toggle('checked'); window.clicks=(window.clicks||0)+1"></span>
        <button data-testid="channelNameSubmit" onclick="window.submitted=true">Create channel</button>
      </div>`)}`
      )
      const result = await new Sidebar(driver as ThenableWebDriver).addNewChannel(
        'private-chat',
        DEFAULT_ADD_NEW_CHANNEL_PRIVATE_OPTIONS
      )
      if (!settles) {
        expect(result.errors?.[0].message).toContain('Channel privacy toggle did not become clickable')
        expect(await driver.executeScript('return Boolean(window.clicks || window.submitted)')).toBe(false)
        return
      }
      expect(result.errors).toBeUndefined()
      expect(await driver.executeScript('return { clicks: window.clicks, submitted: window.submitted }')).toEqual({
        clicks: 1,
        submitted: true,
      })
      expect(await driver.findElement(By.id('toggle')).getAttribute('class')).toContain('checked')
    },
    15_000
  )
})
