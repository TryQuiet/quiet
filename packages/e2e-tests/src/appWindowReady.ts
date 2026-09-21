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
          if (!(error instanceof Error)) throw error
          // The same splash teardown can fail GetUrl after its target frame is
          // detached, before ChromeDriver reports that the window is gone.
          const detachedFrame =
            error.name === 'WebDriverError' &&
            /^unknown error: cannot determine loading status\r?\nfrom target frame detached(?:\r?\n|$)/.test(
              error.message
            )
          if (error.name !== 'NoSuchWindowError' && !detachedFrame) throw error
        }
      }
      return false
    },
    timeoutMs,
    'Quiet main window did not finish loading',
    100
  )
}
