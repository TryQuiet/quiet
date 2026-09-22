import { Builder, By, type WebDriver } from 'selenium-webdriver'
import { Options, ServiceBuilder } from 'selenium-webdriver/chrome'
import { SettingsModalTabName } from '../enums'
import { closeSettingsTab, waitForSettingsTab, waitForSettingsTabClosed } from '../settingsTabReady'

// These fixtures reproduce the panels' rendered content after their headings moved
// into the drawer bar. Chrome supplies real layout and Selenium visibility checks.
const panels: Array<[SettingsModalTabName, string]> = [
  [SettingsModalTabName.ABOUT, '<div class="Abouttitle"></div><p>Version: 11.0.0<br>Copyright Quiet LLC</p>'],
  [SettingsModalTabName.NOTIFICATIONS, '<div class="Notificationstitle"></div><h5>Notify me about...</h5>'],
  [SettingsModalTabName.LEAVE_COMMUNITY, '<button data-testid="leave-community-button">Leave community</button>'],
  [SettingsModalTabName.QR_CODE, '<svg width="172" height="172"></svg><h5>Invitation QR code</h5>'],
  [SettingsModalTabName.QR_CODE, '<h5>Only admins can invite new members</h5>'],
  [SettingsModalTabName.DEBUG, '<span data-testid="p2p-toggle-switch"><input type="checkbox"></span>'],
  [
    SettingsModalTabName.COMMUNITY_MEMBERSHIP,
    '<div data-testid="community-membership-search"><input placeholder="Search for users in your community"></div><ul data-testid="community-membership-list"></ul>',
  ],
  [SettingsModalTabName.INVITE, '<h5 data-testid="invite-a-friend">Add Members</h5>'],
  [SettingsModalTabName.LINKED_DEVICES, '<h5 data-testid="linked-devices-title">Linked devices</h5>'],
  // This line's tab is the Link devices content, whose body carries `link-devices` and whose
  // heading is "Link devices"; released 11.x panels print the `linked-devices-title` above.
  [
    SettingsModalTabName.LINKED_DEVICES,
    '<div data-testid="link-devices"><h1>Link devices</h1><div data-testid="link-devices-display-qr">Display QR code</div></div>',
  ],
]

const describeLinux = process.platform === 'linux' ? describe : describe.skip

describeLinux('settings panel readiness in Chrome', () => {
  let driver: WebDriver

  beforeAll(async () => {
    const options = new Options()
    options.addArguments('--headless=new', '--no-sandbox', '--disable-dev-shm-usage')
    // npm adds the Electron drivers to PATH. This fixture drives installed
    // Chrome, so let Selenium Manager select the browser's matching driver.
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

  afterAll(async () => {
    await driver?.quit()
  })

  const showPanel = async (body: string) => {
    await driver.get(
      `data:text/html;charset=utf-8,${encodeURIComponent(`<!doctype html><html><body>${body}</body></html>`)}`
    )
  }

  it.each(panels)('accepts visible %s panel content without the old heading', async (tab, body) => {
    await showPanel(body)
    await expect(waitForSettingsTab(driver, tab, 1_000)).resolves.toBeUndefined()
  })

  it('reproduces the zero-height About heading while accepting the visible version', async () => {
    await showPanel('<div class="Abouttitle"></div><p>Version: 11.0.0<br>Copyright Quiet LLC</p>')
    expect(await driver.findElement(By.css('.Abouttitle')).isDisplayed()).toBe(false)
    await expect(waitForSettingsTab(driver, SettingsModalTabName.ABOUT, 1_000)).resolves.toBeUndefined()
  })

  it('still rejects a panel whose body is hidden, even when its drawer heading is visible', async () => {
    await showPanel('<h2>About Quiet</h2><div class="Abouttitle"></div><p style="display:none">Version: 11.0.0</p>')
    await expect(waitForSettingsTab(driver, SettingsModalTabName.ABOUT, 200)).rejects.toThrow("wasn't visible")
  })

  it('does not accept an empty obsolete heading without panel content', async () => {
    await showPanel('<div class="Notificationstitle"></div>')
    await expect(waitForSettingsTab(driver, SettingsModalTabName.NOTIFICATIONS, 200)).rejects.toThrow("wasn't ready")
  })

  it('recognizes a closed tab when its back button is reused as the menu close button', async () => {
    await showPanel(`<div data-testid="close-tab-button-box"><button onclick="
      this.parentElement.removeAttribute('data-testid');
      this.setAttribute('data-testid', 'close-settings-button');
    ">Back</button></div>`)
    const button = await driver.findElement(By.css('button'))
    await button.click()
    await expect(waitForSettingsTabClosed(driver, 1_000)).resolves.toBeUndefined()
    expect(await button.getAttribute('data-testid')).toBe('close-settings-button')
    expect(await button.isDisplayed()).toBe(true)
  })

  it('also accepts a hidden tab left in the DOM by an older drawer', async () => {
    await showPanel('<div data-testid="close-tab-button-box" style="display:none"><button>Back</button></div>')
    await expect(waitForSettingsTabClosed(driver, 1_000)).resolves.toBeUndefined()
  })

  it('still rejects a tab whose back button remains visible', async () => {
    await showPanel('<div data-testid="close-tab-button-box"><button>Back</button></div>')
    await expect(waitForSettingsTabClosed(driver, 200)).rejects.toThrow('Settings tab did not finish closing')
  })

  it('clicks the back button after the released drawer finishes sliding into place', async () => {
    await showPanel(`<div id="drawer" style="position:absolute;left:100px;top:50px;transform:translateX(400px)">
      <div data-testid="close-tab-button-box"><button onclick="
        document.body.dataset.clickX = this.getBoundingClientRect().x;
        document.getElementById('drawer').remove();
      ">Back</button></div>
    </div>`)
    await driver.executeScript(`
      const drawer = document.getElementById('drawer');
      drawer.style.transition = 'transform 1s linear';
      drawer.getBoundingClientRect();
      drawer.style.transform = 'translateX(0)';
    `)
    await closeSettingsTab(driver, 3_000)
    expect(Number(await driver.findElement(By.css('body')).getAttribute('data-click-x'))).toBeCloseTo(100, 0)
  })
})
