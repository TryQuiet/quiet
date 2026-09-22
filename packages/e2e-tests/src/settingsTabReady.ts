import { By, error, until, type WebDriver } from 'selenium-webdriver'
import { SettingsModalTabName } from './enums'

// Use content present in released 11.x panels, not headings moved into the drawer bar.
const tabContent: Record<SettingsModalTabName, string> = {
  // Either id: released 11.x panels print the `invite-a-friend` heading, which this line's panel
  // no longer draws now the drawer bar carries it; the masked link is the body content in both.
  [SettingsModalTabName.INVITE]: "//*[@data-testid='invite-a-friend' or @data-testid='invitation-link']",
  // Either id: released 11.x panels print `linked-devices-title`, while this line's tab is the
  // Link devices content, whose body carries `link-devices`.
  [SettingsModalTabName.LINKED_DEVICES]: "//*[@data-testid='linked-devices-title' or @data-testid='link-devices']",
  [SettingsModalTabName.ABOUT]: "//p[starts-with(normalize-space(.), 'Version:')]",
  [SettingsModalTabName.LEAVE_COMMUNITY]: "//button[@data-testid='leave-community-button']",
  [SettingsModalTabName.NOTIFICATIONS]: "//h5[normalize-space(.)='Notify me about...']",
  [SettingsModalTabName.QR_CODE]:
    "//h5[normalize-space(.)='Invitation QR code' or normalize-space(.)='Only admins can invite new members']",
  [SettingsModalTabName.DEBUG]: "//*[@data-testid='p2p-toggle-switch']",
  [SettingsModalTabName.COMMUNITY_MEMBERSHIP]: "//*[@data-testid='community-membership-search']//input",
}

export const waitForSettingsTab = async (
  driver: WebDriver,
  tabName: SettingsModalTabName,
  timeoutMs = 30_000
): Promise<void> => {
  const locator = tabContent[tabName]
  if (!locator) throw new Error(`Can't wait for unknown tab ${tabName}`)

  const content = await driver.wait(
    until.elementLocated(By.xpath(locator)),
    timeoutMs,
    `Settings tab ${tabName} wasn't ready within timeout`,
    100
  )
  await driver.wait(
    until.elementIsVisible(content),
    Math.min(timeoutMs, 10_000),
    `Settings tab ${tabName} wasn't visible within timeout`,
    100
  )
}

export const waitForSettingsTabClosed = async (driver: WebDriver, timeoutMs = 10_000): Promise<void> => {
  await driver.wait(
    async () => {
      const buttons = await driver.findElements(By.css('[data-testid="close-tab-button-box"] button'))
      for (const button of buttons) {
        try {
          if (await button.isDisplayed()) return false
        } catch (err) {
          if (!(err instanceof error.StaleElementReferenceError)) throw err
        }
      }
      return true
    },
    timeoutMs,
    'Settings tab did not finish closing',
    100
  )
}

export const closeSettingsTab = async (driver: WebDriver, timeoutMs = 10_000): Promise<void> => {
  const button = await driver.wait(
    until.elementLocated(By.css('[data-testid="close-tab-button-box"] button')),
    timeoutMs,
    "Settings tab close button couldn't be found within timeout"
  )
  await driver.wait(
    until.elementIsVisible(button),
    timeoutMs,
    "Settings tab close button wasn't visible within timeout"
  )
  // Released versions slide a second drawer over the menu. Selenium considers
  // its back button visible before the slide finishes, so it can move between
  // locating the click coordinates and dispatching the click.
  await driver.wait(
    async () =>
      await driver.executeScript<boolean>(
        `for (let element = arguments[0]; element; element = element.parentElement) {
          if (element.getAnimations().some(animation => animation.playState === 'running' || animation.pending)) {
            return false;
          }
        }
        return true;`,
        button
      ),
    timeoutMs,
    'Settings drawer did not finish its opening animation',
    50
  )
  await button.click()
  // The current drawer may reuse this node as the menu's close button.
  await waitForSettingsTabClosed(driver, timeoutMs)
}
