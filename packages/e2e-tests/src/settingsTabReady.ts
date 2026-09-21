import { By, until, type WebDriver } from 'selenium-webdriver'
import { SettingsModalTabName } from './enums'

// Use content present in released 11.x panels, not headings moved into the drawer bar.
const tabContent: Record<SettingsModalTabName, string> = {
  [SettingsModalTabName.INVITE]: "//*[@data-testid='invite-a-friend']",
  [SettingsModalTabName.LINKED_DEVICES]: "//*[@data-testid='linked-devices-title']",
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
