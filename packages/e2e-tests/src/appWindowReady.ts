import { type WebDriver } from 'selenium-webdriver'

/** Select the main renderer after Electron replaces its startup splash. */
export async function waitForAppWindow(driver: WebDriver, timeoutMs = 30_000): Promise<void> {
  await driver.wait(
    async () => {
      for (const handle of await driver.getAllWindowHandles()) {
        try {
          await driver.switchTo().window(handle)
          const url = await driver.getCurrentUrl()
          // ChromeDriver can return no URL when the splash disappears during
          // GetUrl, even though it reports the command itself as successful.
          if (url && new URL(url).pathname.endsWith('/index.html')) return true
        } catch (error) {
          if (!(error instanceof Error) || error.name !== 'NoSuchWindowError') throw error
        }
      }
      return false
    },
    timeoutMs,
    'Quiet main window did not finish loading',
    100
  )
}
