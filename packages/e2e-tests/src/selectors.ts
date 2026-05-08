import { By, Key, type ThenableWebDriver, type WebElement, until, WebElementPromise } from 'selenium-webdriver'
import { BuildSetup, logAndReturnError, promiseWithRetries, sleep, type BuildSetupInit } from './utils'
import path from 'path'
import { FileDownloadStatus, PhotoExt, SettingsModalTabName, FileAttachmentType, X_DATA_TESTID } from './enums'
import { MessageIds, RetryConfig, UserListItem, UserListStatus } from './types'
import { createLogger } from './logger'
import { DateTime } from 'luxon'
import { execSync } from 'child_process'

const logger = createLogger('selectors')

export class App {
  thenableWebDriver?: ThenableWebDriver
  buildSetup: BuildSetup
  isOpened: boolean
  modalWatcher: Promise<void> | null = null
  retryConfig: RetryConfig = {
    attempts: 3,
    timeoutMs: 600000,
  }
  shortRetryConfig: RetryConfig = {
    ...this.retryConfig,
    timeoutMs: 30000,
  }

  constructor(buildSetupConfig?: BuildSetupInit) {
    this.buildSetup = new BuildSetup({ ...buildSetupConfig })
    this.isOpened = false
  }

  get driver(): ThenableWebDriver {
    if (!this.thenableWebDriver) {
      this.thenableWebDriver = this.buildSetup.getDriver()
    }
    return this.thenableWebDriver
  }

  get name() {
    return this.buildSetup.dataDir
  }

  async open(qssEnabled = false): Promise<void> {
    logger.info('opening the app', this.buildSetup.dataDir)
    this.buildSetup.resetDriver()
    await this.buildSetup.createChromeDriver(qssEnabled)
    this.isOpened = true
    this.thenableWebDriver = this.buildSetup.getDriver()
    await this.driver.getSession()
    const startingPanel = new StartingLoadingPanel(this.driver)
    const startingPanelLoaded = startingPanel.waitForLoadingToComplete()
    await startingPanelLoaded
    this.watchForLaunchModals()
  }

  async openWithRetries(overrideConfig?: RetryConfig, qssEnabled = false): Promise<void> {
    const config = {
      ...this.retryConfig,
      ...(overrideConfig ? overrideConfig : {}),
    }
    const failureReason = `Failed to open app within ${config.timeoutMs}ms`
    await promiseWithRetries(this.open(qssEnabled), failureReason, config, this.close)
  }

  /**
   * Close the application if it is still running.
   *
   * * Safe to call multiple times – a no‑op if everything is already gone.
   * * Gracefully quits when possible, falls back to killing ChromeDriver.
   * * Handles the case where the Electron process is dead but the DevTools
   *   session / chromedriver is still alive.
   */
  async close(options?: { forceSaveState?: boolean }): Promise<void> {
    logger.info('Closing the app', this.buildSetup.dataDir)

    // Signal any background watchers (e.g. modal watcher) to stop ASAP.
    const wasOpened = this.isOpened
    this.isOpened = false

    // 1. Detect whether an Electron window is still around.
    let sessionOpen = false
    try {
      sessionOpen = await this.isSessionOpen()
      logger.info(`isSessionOpen: ${sessionOpen}`)
    } catch {
      /* swallowing – isSessionOpen throws if chromedriver is already gone */
    }

    // App was already closed – nothing to do.
    if (!wasOpened && !sessionOpen) {
      logger.info('App already closed ensuring driver is shut down')
      try {
        await this.buildSetup.closeDriver()
        await this.buildSetup.killChromeDriver()
      } catch {
        /* ignore */
      }
      return
    }

    // 2. Optionally persist state before quitting.
    if (options?.forceSaveState && wasOpened && sessionOpen) {
      logger.info('Saving state before closing')
      try {
        await this.saveState()
        await this.waitForSavedState()
      } catch (e) {
        logger.warn('Failed to save state while closing', e)
      }
    }

    // 3. Attempt a graceful quit *only* if we believe the renderer is alive.
    if (sessionOpen) {
      logger.info('Attempting graceful app quit')
      try {
        await this.quitProgrammatically()
      } catch (e) {
        logger.error('Error while sending quit', e)
      }
    }

    // 4. Wait (≤15 s) for the DevTools session to disappear.
    let closed = false
    for (let i = 0; i < 30; i++) {
      try {
        if (!(await this.isSessionOpen())) {
          closed = true
          break
        }
      } catch {
        // Driver threw (likely ECONNREFUSED) → treat as closed.
        closed = true
        break
      }
      await sleep(500)
    }

    // 5. If still not closed, force‑kill the driver & chromedriver.
    if (!closed) {
      logger.warn('App did not close gracefully, forcing shutdown')
    }
    try {
      logger.info('Closing driver')
      await this.buildSetup.closeDriver()
    } catch {
      /* ignore */
    }
    try {
      logger.info('Killing ChromeDriver')
      await this.buildSetup.killChromeDriver()
    } catch {
      /* ignore */
    }

    if (process.platform === 'win32') {
      logger.info('Killing nine')
      this.buildSetup.killNine()
      await sleep(2_000)
    }

    this.isOpened = false
    logger.info('App closed', this.buildSetup.dataDir)
  }

  async closeWindowViaX() {
    await this.driver.executeScript("require('@electron/remote').BrowserWindow.getFocusedWindow().close();")
    if (process.platform !== 'darwin') {
      this.isOpened = false
    }
    await sleep(2000)
  }

  async quitProgrammatically() {
    await this.driver.executeScript("require('@electron/remote').app.quit();")
    this.isOpened = false
    await sleep(6000)
  }

  async terminateBackendProcess() {
    logger.warn('Terminating backend process')
    const pids = new Set<number>()
    const bundlePath = path.normalize('backend-bundle/bundle.cjs')

    try {
      logger.info('Getting backend process PID')
      const { pid } = require('@electron/remote').getGlobal('backendProcess') ?? {}
      if (pid) pids.add(pid)
    } catch (e) {
      /* remote not available – ignore */
      logger.error('Error while getting backend process PID', e)
    }

    try {
      let cmd = ''
      switch (process.platform) {
        case 'darwin':
          cmd = `ps -A -o pid= -o command= | grep "${bundlePath}" | grep "${this.buildSetup.dataDir}" | grep -v grep`
          break
        case 'linux':
          cmd = `pgrep -af "${bundlePath}" | grep "${this.buildSetup.dataDir}" | grep -v grep`
          break
        case 'win32': {
          const bundleWin = bundlePath.replace(/\\/g, '\\\\')
          cmd = `wmic process where "CommandLine like '%${bundleWin}%' and CommandLine like '%${this.buildSetup.dataDir}%'" get ProcessId`
          break
        }
      }
      if (cmd) {
        const out = execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] }).toString()

        out
          .split('\n')
          .map(l => l.trim())
          .filter(Boolean)
          .forEach(line => {
            const m = line.match(/^(\d+)\b/)
            if (!m) return

            const pid = Number(m[1])
            // Skip obviously bogus entries (0, kernel tasks, or > 10 million).
            if (Number.isFinite(pid) && pid > 10 && pid < 10_000_000) {
              pids.add(pid)
            }
          })
      }
    } catch {
      /* scanning failed – ignore */
    }

    if (pids.size === 0) {
      logger.warn(`terminateBackendProcess: no backend PID found for ${this.buildSetup.dataDir}`)
      return
    }

    logger.info(`Terminating backend PIDs ${[...pids].join(', ')} for ${this.buildSetup.dataDir}`)

    // ----- step 3: SIGINT, wait, SIGKILL -----
    for (const pid of pids) {
      try {
        logger.info(`Sending SIGINT to PID ${pid}`)
        process.kill(pid, 'SIGINT')
      } catch {
        /* empty */
      }
    }
    await sleep(2000)
  }

  async cleanup(force: boolean = false) {
    logger.info(`Performing app cleanup`, this.buildSetup.dataDir)
    if (this.isOpened) {
      throw new Error(`App with dataDir ${this.buildSetup.dataDir} is still open, close before cleaning up!`)
    }
    this.buildSetup.clearDataDir(force)
  }

  get saveStateButton() {
    return this.driver.wait(
      until.elementLocated(By.xpath('//div[@data-testid="save-state-button"]')),
      10_000,
      `Save state button couldn't be located within timeout`,
      500
    )
  }

  async closeUpdateModalIfPresent() {
    const updateModal = new UpdateModal(this.driver)
    await updateModal.close()
  }

  private isNoSuchSessionError(error: unknown): boolean {
    if (!error) return false
    if (error instanceof Error) {
      return error.name === 'NoSuchSessionError' || error.message.includes('invalid session id')
    }
    const anyError = error as { name?: unknown; message?: unknown }
    return (
      anyError.name === 'NoSuchSessionError' ||
      (typeof anyError.message === 'string' && anyError.message.includes('invalid session id'))
    )
  }

  private async hasActiveDriverSession(): Promise<boolean> {
    try {
      await this.driver.getSession()
      return true
    } catch {
      return false
    }
  }

  private watchForLaunchModals(timeoutMs = 20_000) {
    const start = Date.now()
    const watcher = (async () => {
      while (Date.now() - start < timeoutMs && this.isOpened) {
        if (!(await this.hasActiveDriverSession())) return
        await Promise.all([this.tryCloseDebugModalIfPresent(), this.tryCloseUpdateModalIfPresent()])
        await sleep(500)
      }
    })()
    this.modalWatcher = watcher
    watcher
      .catch(e => logger.warn('Modal watcher failed', e))
      .finally(() => {
        if (this.modalWatcher === watcher) this.modalWatcher = null
      })
  }

  private async tryCloseDebugModalIfPresent() {
    if (!process.env.TEST_MODE) return
    if (!this.isOpened) return
    try {
      const modals = await this.driver.findElements(By.xpath("//h3[text()='App is running in debug mode']"))
      if (!modals.length) return
      await new DebugModeModal(this.driver).close()
    } catch (e) {
      if (this.isNoSuchSessionError(e)) return
      logger.warn('Could not close debug modal', e)
    }
  }

  private async tryCloseUpdateModalIfPresent() {
    if (!this.isOpened) return
    try {
      const modals = await this.driver.findElements(
        By.xpath("//h3[text()='Software update']/ancestor::div[contains(@class,'MuiModal-root')]")
      )
      if (!modals.length) return
      await this.closeUpdateModalIfPresent()
      logger.info('Closed update modal')
    } catch (e) {
      if (this.isNoSuchSessionError(e)) return
      logger.warn('Could not close update modal (may not be displayed)', e)
    }
  }

  async saveState() {
    const stateButton = await this.saveStateButton
    await this.driver.executeScript('arguments[0].click();', stateButton)
  }

  async waitForSavedState() {
    const dataSaved = this.driver.wait(
      until.elementLocated(By.xpath('//div[@data-is-saved="true"]')),
      20_000,
      `State couldn't be saved within timeout`,
      500
    )
    return await dataSaved
  }

  async isSessionOpen(): Promise<boolean> {
    try {
      logger.info('Checking if session is open')
      // Try to get the session; if it fails, the app is not running
      await this.driver.getSession()
      logger.info('Session is open, checking for windows')
      const windows = await this.driver.executeScript<number>(
        "return require('@electron/remote').BrowserWindow.getAllWindows().length"
      )
      logger.info(`Number of windows: ${windows}`)
      return windows > 0
    } catch (e) {
      logger.info('Session is not open', e)
      return false
    }
  }

  async waitForClosed(timeoutMs = 30000, pollInterval = 500): Promise<void> {
    const startTime = Date.now()
    let opened = true
    while (Date.now() - startTime < timeoutMs) {
      opened = await this.isSessionOpen()
      if (!opened) {
        return
      }
      await sleep(pollInterval)
    }
    if (opened) {
      throw new Error(`App did not close within ${timeoutMs}ms`)
    }
  }

  /**
   * Returns true if the main window is visible (not hidden/minimized/destroyed).
   * On macOS, closing via X hides the window but does not quit the app.
   */
  async isVisible(): Promise<boolean> {
    try {
      const isVisible = await this.driver.executeScript(
        "const win = require('@electron/remote').BrowserWindow.getAllWindows()[0]; return win ? win.isVisible() : false;"
      )
      return Boolean(isVisible)
    } catch (e) {
      return false
    }
  }
}

export class StartingLoadingPanel {
  private readonly driver: ThenableWebDriver
  constructor(driver: ThenableWebDriver) {
    this.driver = driver
  }

  get element() {
    return this.driver.wait(
      until.elementLocated(By.xpath('//div[@data-testid="startingPanelComponent"]')),
      10_000,
      `Loading panel element couldn't be located within timeout`,
      500
    )
  }

  async waitForLoadingToComplete(visibleTimeoutMs = 5_000, completionTimeoutMs = 15_000): Promise<void> {
    let panel: WebElement
    try {
      panel = await this.element
      logger.info('Found element for starting loading panel, waiting for visibility')
      await this.driver.wait(
        until.elementIsVisible(panel),
        visibleTimeoutMs,
        `Loading panel element couldn't be seen within timeout`,
        500
      )
    } catch (e) {
      logger.warn(`Starting loading panel disappeared and we couldn't get visibility information.  This is fine.`)
      return
    }

    try {
      await this.driver.wait(
        until.elementIsNotVisible(panel),
        completionTimeoutMs,
        `Starting loading panel element didn't disappear within timeout`,
        250
      )
    } catch (e) {
      if (e.message?.includes('stale element reference')) {
        logger.warn(`Starting loading panel disappeared and we couldn't get visibility information. This is fine.`)
      } else {
        logger.warn('Either socket didnt get setup or you are running on an old version.')
      }
    }
  }
}

export class WarningModal {
  private readonly driver: ThenableWebDriver

  constructor(driver: ThenableWebDriver) {
    this.driver = driver
  }

  async isReady(): Promise<boolean> {
    await this.driver.wait(
      until.elementIsVisible(this.titleElement),
      15_000,
      `Warning modal couldn't be seen within timeout`,
      500
    )
    return true
  }

  get titleElement() {
    return this.driver.wait(
      until.elementLocated(By.xpath('//h3[@data-testid="warningModalTitle"]')),
      10_000,
      `Warning modal title element couldn't be located within timeout`,
      500
    )
  }

  async close() {
    const submitButton = await this.driver.wait(
      until.elementLocated(By.xpath('//button[@data-testid="warningModalSubmit"]')),
      10_000,
      `Warning modal couldn't be closed within timeout`,
      500
    )
    await this.driver.wait(until.elementIsVisible(submitButton), 5_000)
    await this.driver.wait(until.elementIsEnabled(submitButton), 5_000)
    await submitButton.click()
  }
}

export class JoiningLoadingPanel {
  private readonly driver: ThenableWebDriver
  constructor(driver: ThenableWebDriver) {
    this.driver = driver
  }

  get element() {
    return this.driver.wait(
      until.elementLocated(By.xpath('//div[@data-testid="joiningPanelComponent"]')),
      15_000,
      `Joining loading panel element couldn't be located within timeout`,
      500
    )
  }

  async waitForJoinToComplete(visibleTimeoutMs = 60_000, completionTimeoutMs = 360_000): Promise<void> {
    // First check if the panel exists at all. In some flows (e.g., Not Now on server offer),
    // the joining panel may never appear, which is OK.
    const candidates = await this.driver.findElements(By.xpath('//div[@data-testid="joiningPanelComponent"]'))
    if (!candidates || candidates.length === 0) {
      logger.warn('Joining loading panel not present; skipping wait')
      return
    }

    const panel = candidates[0]
    await this.driver.wait(
      until.elementIsVisible(panel),
      visibleTimeoutMs,
      `Loading panel element couldn't be seen within timeout`,
      500
    )

    try {
      await this.driver.wait(
        until.elementIsNotVisible(panel),
        completionTimeoutMs,
        `Loading panel element didn't disappear within timeout`,
        5_000
      )
    } catch (e) {
      if (e.message.includes('stale element reference')) {
        logger.warn(`Join loading panel disappeared and we couldn't get visibility information. This is fine.`)
      } else {
        throw e
      }
    }
  }
}

export class UsersList {
  private readonly driver: ThenableWebDriver
  constructor(driver: ThenableWebDriver) {
    this.driver = driver
  }

  get element() {
    return this.driver.wait(
      until.elementLocated(By.xpath('//ul[@data-testid="usersList"]')),
      15_000,
      `Users list couldn't be located within timeout`,
      500
    )
  }

  async isReady(): Promise<boolean> {
    await this.driver.wait(
      until.elementIsVisible(this.element),
      15_000,
      `Users list was not visibile within timeout`,
      500
    )
    return true
  }

  async getUser(username: string, expectedState: UserListStatus): Promise<UserListItem> {
    logger.debug('Getting user list item', username)
    let status: UserListStatus = UserListStatus.NOT_FOUND

    let userItem: WebElement
    try {
      userItem = await this.driver.wait(
        until.elementLocated(By.xpath(`//div[@data-testid="${username}-user-link"]`)),
        120_000,
        `Users item for ${username} couldn't be located within timeout`,
        500
      )
      await this.driver.wait(
        until.elementIsVisible(userItem),
        120_000,
        `Users item for ${username} was not visibile within timeout`,
        500
      )
    } catch (e) {
      return {
        element: undefined,
        status,
        textMatches: true,
      }
    }

    const statusBadge = await this.driver.wait(
      until.elementLocated(By.xpath(`//span[@data-testid="${username}-user-link-status-badge"]`)),
      240_000,
      `Users item status badge for ${username} couldn't be located within timeout`,
      500
    )

    if (expectedState === UserListStatus.ONLINE) {
      try {
        await this.driver.wait(
          until.elementIsVisible(statusBadge),
          240_000,
          `Users item status badge for ${username} was not visibile within timeout`,
          500
        )
        status = UserListStatus.ONLINE
      } catch (e) {
        status = UserListStatus.OFFLINE
      }
    } else {
      try {
        await this.driver.wait(
          until.elementIsNotVisible(statusBadge),
          240_000,
          `Users item status badge for ${username} was not invisible within timeout`,
          500
        )
        status = UserListStatus.OFFLINE
      } catch (e) {
        status = UserListStatus.ONLINE
      }
    }

    return {
      element: userItem,
      status,
      textMatches: true,
    }
  }
}

export class ChannelContextMenu {
  private readonly driver: ThenableWebDriver
  constructor(driver: ThenableWebDriver) {
    this.driver = driver
  }

  async openMenu(): Promise<{ menuButton: boolean; menuOpened: boolean; iconVisible: boolean }> {
    let menu: WebElement
    try {
      menu = await this.driver.wait(
        until.elementLocated(By.xpath('//div[@data-testid="channelContextMenuButton"]')),
        15_000,
        `Channel context menu couldn't be located within timeout`,
        500
      )
      await this.driver.wait(
        until.elementIsVisible(menu),
        15_000,
        `Channel context menu was not visibile within timeout`,
        500
      )
    } catch (e) {
      logger.error('Error while checking for channel context menu button', e)
      return {
        menuButton: false,
        menuOpened: false,
        iconVisible: false,
      }
    }
    try {
      await menu.click()
    } catch (e) {
      return {
        menuButton: true,
        menuOpened: false,
        iconVisible: false,
      }
    }
    try {
      const channelTypeIcon = this.driver.wait(
        until.elementLocated(By.xpath(`//*[@data-testid="contextMenu-channel-settings-type-icon"]`)),
        15_000,
        `Channel context menu lock/hash icon couldn't be located within timeout`,
        500
      )
      await this.driver.wait(
        until.elementIsVisible(channelTypeIcon),
        15_000,
        `Channel context menu lock/hash icon was not visibile within timeout`,
        500
      )
      return {
        menuButton: true,
        menuOpened: true,
        iconVisible: true,
      }
    } catch (e) {
      logger.error('Error while checking for channel icon on context menu', e)
      return {
        menuButton: true,
        menuOpened: true,
        iconVisible: false,
      }
    }
  }

  async openDeletionChannelModal() {
    const tab = this.driver.wait(
      until.elementLocated(By.xpath('//div[@data-testid="contextMenuItemDelete"]')),
      15_000,
      `Channel context menu channel deletion modal couldn't be located within timeout`,
      500
    )
    await this.driver.wait(
      until.elementIsVisible(tab),
      15_000,
      `Channel context menu channel deletion tab was not visibile within timeout`,
      500
    )
    await tab.click()
  }

  async openAddMembersModal() {
    const tab = this.driver.wait(
      until.elementLocated(By.xpath('//div[@data-testid="contextMenuItemAdd_members"]')),
      15_000,
      `Channel context menu channel add members tab couldn't be located within timeout`,
      500
    )
    await this.driver.wait(
      until.elementIsVisible(tab),
      15_000,
      `Channel context menu channel add members tab was not visibile within timeout`,
      500
    )
    await tab.click()
  }

  // TODO: replace sleep
  async deleteChannel() {
    const button = this.driver.wait(
      until.elementLocated(By.xpath('//button[@data-testid="deleteChannelButton"]')),
      20_000,
      `Channel deletion button couldn't be located within timeout`,
      500
    )
    await this.driver.wait(
      until.elementIsVisible(button),
      15_000,
      `Channel context menu delete channel button was not visibile within timeout`,
      500
    )
    await button.click()
    await sleep(5000)
  }

  // TODO: replace sleep
  async addMembersToChannel(channelName: string, memberNames: string[]) {
    const autoCompleteInput = await this.driver.wait(
      until.elementLocated(By.xpath(`//div[@data-testid="${channelName}-add-members-autocomplete"]`)),
      20_000,
      `Channel add members autocomplete input div couldn't be located within timeout`,
      500
    )
    await this.driver.wait(
      until.elementIsVisible(autoCompleteInput),
      15_000,
      `Channel context menu channel add members autocomplete div was not visibile within timeout`,
      500
    )

    const inputField = await this.driver.wait(
      autoCompleteInput.findElement(By.xpath(`//input[@aria-autocomplete="list"]`)),
      5_000,
      `Channel add members autocomplete input field couldn't be located within timeout`,
      500
    )
    for (const memberName of memberNames) {
      await inputField.sendKeys(memberName)
      await inputField.sendKeys(Key.ENTER)
    }

    const button = this.driver.wait(
      until.elementLocated(By.xpath(`//button[@data-testid="${channelName}-add-members-button"]`)),
      20_000,
      `Channel add members button couldn't be located within timeout`,
      500
    )
    await this.driver.wait(
      until.elementIsVisible(button),
      15_000,
      `Channel context menu channel add members button was not visibile within timeout`,
      500
    )
    await button.click()
    await sleep(5_000)
  }

  async checkForMembersInAddMembersAutocomplete(channelName: string, memberNames: string[]): Promise<string[]> {
    const autoCompleteInput = await this.driver.wait(
      until.elementLocated(By.xpath(`//div[@data-testid="${channelName}-add-members-autocomplete"]`)),
      20_000,
      `Channel add members autocomplete input div couldn't be located within timeout`,
      500
    )
    await this.driver.wait(
      until.elementIsVisible(autoCompleteInput),
      15_000,
      `Channel context menu channel add members autocomplete div was not visibile within timeout`,
      500
    )

    const inputField = await this.driver.wait(
      autoCompleteInput.findElement(By.xpath(`//input[@aria-autocomplete="list"]`)),
      5_000,
      `Channel add members autocomplete input field couldn't be located within timeout`,
      500
    )

    const waitForUserInAutocomplete = async (memberName: string) => {
      const autoCompleteOption = await this.driver.wait(
        until.elementLocated(
          By.xpath(`//div[@data-testid="${channelName}-add-members-autocomplete-option-${memberName}"]`)
        ),
        2_000,
        `Channel add members autocomplete option for ${memberName} couldn't be located within timeout`,
        500
      )
      await this.driver.wait(
        until.elementIsVisible(autoCompleteOption),
        2_000,
        `Channel add members autocomplete option for ${memberName} wasn't visible within timeout`,
        500
      )
    }

    const membersInAutocomplete: string[] = []
    for (const memberName of memberNames) {
      await inputField.sendKeys(memberName)
      try {
        await waitForUserInAutocomplete(memberName)
        membersInAutocomplete.push(memberName)
      } catch {
        // do nothing
      }
      await inputField.clear()
    }

    const button = this.driver.wait(
      until.elementLocated(By.xpath(`//button[@data-testid="${channelName}-add-members-leave-button"]`)),
      20_000,
      `Channel add members leave button couldn't be located within timeout`,
      500
    )
    await this.driver.wait(
      until.elementIsVisible(button),
      15_000,
      `Channel add members leave button wasn't visibile within timeout`,
      500
    )
    await button.click()
    await sleep(5000)
    return membersInAutocomplete
  }
}

export class UserProfileContextMenu {
  private readonly driver: ThenableWebDriver

  constructor(driver: ThenableWebDriver) {
    this.driver = driver
  }

  get menuElement() {
    return this.driver.wait(
      until.elementLocated(By.xpath(`//*[text()='Profile']`)),
      10_000,
      `User profile menu couldn't be found within timeout`,
      500
    )
  }

  get editProfileMenuElement() {
    return this.driver.wait(
      until.elementLocated(By.xpath(`//*[text()='Edit profile']`)),
      10_000,
      `User profile edit menu couldn't be found within timeout`,
      500
    )
  }

  async isMenuReady() {
    await this.driver.wait(
      until.elementIsVisible(this.menuElement),
      15_000,
      `User profile menu wasn't ready within timeout`,
      500
    )
    return true
  }

  async isEditProfileMenuReady() {
    await this.driver.wait(
      until.elementIsVisible(this.editProfileMenuElement),
      15_000,
      `User profile edit menu wasn't ready within timeout`,
      500
    )
    return true
  }

  async openMenu() {
    const button = await this.driver.wait(
      until.elementLocated(By.xpath('//div[@data-testid="user-profile-menu-button"]')),
      20_000,
      'Context menu button not found',
      500
    )
    await this.driver.wait(until.elementIsVisible(button), 20_000, 'Context menu button never became visible', 500)
    await button.click()
    await this.isMenuReady()
  }

  async back(dataTestid: X_DATA_TESTID) {
    const button = await this.driver.wait(
      until.elementLocated(By.xpath(`//button[@data-testid="${dataTestid}"]`)),
      20_000,
      `Context back button with data-testid ${dataTestid} not found`,
      500
    )

    await this.driver.wait(
      until.elementIsVisible(button),
      5_000,
      `Context back button with data-testid ${dataTestid} not visibile`,
      500
    )
    await button.click()
  }

  async openEditProfileMenu() {
    await sleep(8_000)
    const button = await this.driver.wait(
      until.elementLocated(By.xpath('//div[@data-testid="contextMenuItemEdit_profile"]')),
      20_000,
      'Edit Profile button not found',
      500
    )
    await this.driver.wait(until.elementIsVisible(button), 20000, 'Edit Profile button never became visible', 500)
    await button.click()
    await this.isEditProfileMenuReady()
  }

  async uploadPhoto(fileName: string) {
    const input = await this.driver.wait(
      until.elementLocated(By.xpath('//input[@data-testid="user-profile-edit-photo-input"]')),
      10_000,
      'Edit Photo button not found',
      500
    )
    const filePath = path.join(__dirname, fileName)
    await input.sendKeys(filePath)
  }

  async uploadPNGPhoto() {
    await this.uploadPhoto('../assets/profile-photo.png')
  }

  async uploadJPEGPhoto() {
    await this.uploadPhoto('../assets/profile-photo.jpg')
  }

  async uploadGIFPhoto() {
    await this.uploadPhoto('../assets/profile-photo.gif')
  }

  async waitForPhoto(): Promise<WebElement> {
    const photoElement = await this.driver.wait(
      until.elementLocated(By.className('UserProfileContextMenuprofilePhoto')),
      30_000,
      'Profile photo element never located',
      500
    )
    return photoElement
  }

  async getProfilePhotoSrc(ext: PhotoExt): Promise<string> {
    return await this.driver.wait(
      async () => {
        let i = 0
        while (i < 5) {
          const photoElement = await this.waitForPhoto()

          logger.info(`found photoElement ${photoElement}`)
          const src = await photoElement.getAttribute('src')

          logger.info(`photoElement src ${src}`)

          if (src.endsWith(ext)) {
            return src
          }
          i++
        }
        throw new Error(`Failed to find image with data type ${ext} after 5 tries`)
      },
      15_000,
      `Failed to find image with data type ${ext} within timeout`,
      500
    )
  }
}

export class RegisterUsernameModal {
  private readonly driver: ThenableWebDriver
  constructor(driver: ThenableWebDriver) {
    this.driver = driver
  }

  get element() {
    return this.driver.wait(
      until.elementLocated(By.xpath("//h3[text()='Register a username']")),
      15_000,
      `Username registration modal couldn't be located within timeout`,
      500
    )
  }

  get elementUsernameTaken() {
    return this.driver.wait(
      until.elementLocated(By.xpath("//h6[text()='Username taken']")),
      15_000,
      `Username taken registration modal couldn't be located within timeout`,
      500
    )
  }

  get error() {
    return this.driver.wait(
      until.elementLocated(By.xpath("//p[text()='Username already taken.']")),
      15_000,
      `Username taken error modal couldn't be located within timeout`,
      500
    )
  }

  get usernameInput() {
    return this.driver.wait(
      until.elementLocated(By.xpath('//input[@name="userName"]')),
      10_000,
      `Username input couldn't be found within timeout`,
      500
    )
  }

  async isReady(): Promise<boolean> {
    await this.driver.wait(
      until.elementIsVisible(this.element),
      10_000,
      `Username registration modal wasn't ready within timeout`,
      500
    )
    return true
  }

  async isUsernameTakenReady(): Promise<boolean> {
    await this.driver.wait(
      until.elementIsVisible(this.elementUsernameTaken),
      10_000,
      `Username taken registration modal wasn't ready within timeout`,
      500
    )
    return true
  }

  async typeUsername(username: string) {
    const usernameInput = await this.usernameInput
    await usernameInput.sendKeys(username)
  }

  async clearInput() {
    const usernameInput = await this.usernameInput
    if (process.platform === 'darwin') {
      await usernameInput.sendKeys(Key.COMMAND + 'a')
      await usernameInput.sendKeys(Key.DELETE)
    } else {
      await usernameInput.sendKeys(Key.CONTROL + 'a')
      await usernameInput.sendKeys(Key.DELETE)
    }
  }

  async submit() {
    const submitButton = await this.driver.wait(
      until.elementLocated(By.xpath('//button[text()="Register"]')),
      10_000,
      `Username registration submit button couldn't be found within timeout`,
      500
    )
    await this.driver.wait(until.elementIsVisible(submitButton), 5_000)
    await this.driver.wait(until.elementIsEnabled(submitButton), 5_000)
    await submitButton.click()
  }

  async submitUsernameTaken() {
    const submitButton = await this.driver.wait(
      until.elementLocated(By.xpath('//button[text()="Continue"]')),
      10_000,
      `Username taken registration submit button couldn't be found within timeout`,
      500
    )
    await this.driver.wait(until.elementIsVisible(submitButton), 5_000)
    await this.driver.wait(until.elementIsEnabled(submitButton), 5_000)
    await submitButton.click()
  }

  /**
   * Closes the Create Username modal via header close button.
   */
  async close() {
    const actionsRoot = await this.driver.wait(
      until.elementLocated(By.xpath("//div[@data-testid='createUsernameModalActions']")),
      10_000,
      `CreateUsername modal actions couldn't be found within timeout`,
      500
    )
    const closeBtn = await actionsRoot.findElement(By.css('button'))
    await closeBtn.click()
  }
}

export class JoinCommunityModal {
  private readonly driver: ThenableWebDriver
  constructor(driver: ThenableWebDriver) {
    this.driver = driver
  }

  get element() {
    return this.driver.wait(
      until.elementLocated(By.xpath("//h3[text()='Join community']")),
      10_000,
      `Join community modal couldn't be found within timeout`,
      500
    )
  }

  async isReady(timeoutMs: number = 10_000): Promise<boolean> {
    await this.driver.wait(
      until.elementIsVisible(this.element),
      timeoutMs,
      `Join community modal wasn't ready within timeout`,
      500
    )
    return true
  }

  async switchToCreateCommunity() {
    const link = await this.driver.wait(
      until.elementLocated(By.linkText('create a new community')),
      10_000,
      `Create community button couldn't be found within timeout`,
      500
    )
    await this.driver.wait(until.elementIsVisible(link), 5_000)
    await this.driver.wait(until.elementIsEnabled(link), 5_000)
    await link.click()
  }

  async typeCommunityInviteLink(inviteLink: string) {
    const communityNameInput = await this.driver.wait(
      until.elementLocated(By.xpath('//input[@placeholder="Invite link"]')),
      10_000,
      `Invite link input couldn't be found within timeout`,
      500
    )
    await this.driver.wait(until.elementIsVisible(communityNameInput), 5_000)
    await communityNameInput.sendKeys(inviteLink)
  }

  async submit() {
    const continueButton = await this.driver.wait(
      until.elementLocated(By.xpath('//button[@data-testid="continue-joinCommunity"]')),
      10_000,
      `Join community continue button couldn't be found within timeout`,
      500
    )
    await this.driver.wait(until.elementIsVisible(continueButton), 5_000)
    await this.driver.wait(until.elementIsEnabled(continueButton), 5_000)
    await continueButton.click()
  }
}
export class CreateCommunityModal {
  private readonly driver: ThenableWebDriver
  constructor(driver: ThenableWebDriver) {
    this.driver = driver
  }

  get element() {
    return this.driver.wait(
      until.elementLocated(By.xpath("//h3[text()='Create your community']")),
      10_000,
      `Create community modal couldn't be found within timeout`,
      500
    )
  }

  async isReady(): Promise<boolean> {
    await this.driver.wait(
      until.elementIsVisible(await this.element),
      10_000,
      `Create community modal wasn't ready within timeout`,
      500
    )
    return true
  }

  async typeCommunityName(name: string) {
    const communityNameInput = await this.driver.wait(
      until.elementLocated(By.xpath('//input[@placeholder="Community name"]')),
      10_000,
      `Community name input couldn't be found within timeout`,
      500
    )
    await this.driver.wait(until.elementIsVisible(communityNameInput), 5_000)
    await this.driver.wait(until.elementIsEnabled(communityNameInput), 5_000)
    await communityNameInput.sendKeys(name)
  }

  async clearInput() {
    const communityNameInput = await this.driver.wait(
      until.elementLocated(By.xpath('//input[@placeholder="Community name"]')),
      10_000,
      `Community name input couldn't be found within timeout`,
      500
    )
    await this.driver.wait(until.elementIsVisible(communityNameInput), 5_000)
    await this.driver.wait(until.elementIsEnabled(communityNameInput), 5_000)
    if (process.platform === 'darwin') {
      await communityNameInput.sendKeys(Key.COMMAND + 'a')
      await communityNameInput.sendKeys(Key.DELETE)
    } else {
      await communityNameInput.sendKeys(Key.CONTROL + 'a')
      await communityNameInput.sendKeys(Key.DELETE)
    }
  }

  async submit() {
    const continueButton = await this.driver.wait(
      until.elementLocated(By.xpath('//button[@data-testid="continue-createCommunity"]')),
      10_000,
      `Create community submit button couldn't be found within timeout`,
      500
    )
    await this.driver.wait(until.elementIsVisible(continueButton), 5_000)
    await this.driver.wait(until.elementIsEnabled(continueButton), 5_000)
    await continueButton.click()
  }
}

export class ServerOfferModal {
  private readonly driver: ThenableWebDriver

  constructor(driver: ThenableWebDriver) {
    this.driver = driver
  }

  get useServerButton() {
    return this.driver.wait(
      until.elementLocated(By.xpath("//button[@data-testid='ServerOffer-UseQuietServer']")),
      5_000,
      `Use Quiet’s server button couldn't be found within timeout`,
      500
    )
  }

  get notNowButton() {
    return this.driver.wait(
      until.elementLocated(By.xpath("//button[@data-testid='ServerOffer-NotNow']")),
      5_000,
      `Not now button couldn't be found within timeout`,
      500
    )
  }

  get dontShowAgainCheckbox() {
    return this.driver.wait(
      until.elementLocated(
        By.xpath("//label[contains(@class,'ServerOfferComponent-mutedAction')]//input[@type='checkbox']")
      ),
      5_000,
      `Don't show this again checkbox couldn't be found within timeout`,
      500
    )
  }

  async isReady(timeoutMs: number = 10_000): Promise<boolean> {
    const actions = await this.useServerButton
    await this.driver.wait(
      until.elementIsVisible(actions),
      timeoutMs,
      `ServerOfferModalActions wasn't visible within timeout`,
      500
    )
    return true
  }

  async chooseUseServer() {
    const button = await this.useServerButton
    await button.click()
  }

  async chooseNotNow() {
    const button = await this.notNowButton
    await button.click()
  }

  async setDontShowAgain(checked: boolean) {
    const checkbox = await this.dontShowAgainCheckbox
    const isChecked = await checkbox.isSelected()
    if (isChecked !== checked) {
      await checkbox.click()
    }
  }
}

export class TermsOfServiceModal {
  private readonly driver: ThenableWebDriver

  constructor(driver: ThenableWebDriver) {
    this.driver = driver
  }

  get agreeAndJoinButton() {
    return this.driver.wait(
      until.elementLocated(By.xpath("//button[@data-testid='TermOfService-UseQuietServer']")),
      5_000,
      `Agree and Join button couldn't be found within timeout`,
      500
    )
  }

  get abortButton() {
    return this.driver.wait(
      until.elementLocated(By.xpath("//button[@data-testid='TermOfService-Abort']")),
      5_000,
      `Leave Community button couldn't be found within timeout`,
      500
    )
  }

  async isReady(timeoutMs: number = 10_000): Promise<boolean> {
    const button = await this.agreeAndJoinButton
    await this.driver.wait(
      until.elementIsVisible(button),
      timeoutMs,
      `TermsOfServiceModalActions wasn't visible within timeout`,
      500
    )
    return true
  }

  async chooseAgreeAndJoin() {
    const button = await this.agreeAndJoinButton
    await button.click()
  }

  async chooseAbort() {
    const button = await this.abortButton
    await button.click()
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
    return this.driver.wait(
      until.elementLocated(By.xpath(`//*[@data-testid='channelTitle']`)),
      10_000,
      `Channel title element for ${this.name} couldn't be found within timeout`,
      500
    )
  }

  get lock() {
    return this.driver.wait(
      until.elementLocated(By.xpath(`//*[@data-testid='channelTitle-icon-private']`)),
      10_000,
      `Channel title private icon element for ${this.name} couldn't be found within timeout`,
      500
    )
  }

  get hash() {
    return this.driver.wait(
      until.elementLocated(By.xpath(`//*[@data-testid='channelTitle-icon-public']`)),
      10_000,
      `Channel title public icon element for ${this.name} couldn't be found within timeout`,
      500
    )
  }

  get messagesList() {
    return this.driver.wait(
      until.elementLocated(By.xpath('//ul[@id="messages-scroll"]')),
      10_000,
      `Channel message list element for ${this.name} couldn't be found within timeout`,
      500
    )
  }

  async isReady(timeoutMs = 15_000): Promise<boolean> {
    await this.driver.wait(
      until.elementIsVisible(this.element),
      timeoutMs,
      `Channel ${this.name} wasn't ready within timeout`,
      500
    )
    return true
  }

  async isOpen(isPublic: boolean = true, timeout = 15_000): Promise<boolean> {
    const titleElement = await this.driver.wait(
      until.elementIsVisible(await this.title),
      timeout,
      `Channel title element for ${this.name} couldn't be seen within timeout`,
      500
    )

    await this.driver.wait(
      until.elementIsVisible(await (isPublic ? this.hash : this.lock)),
      timeout,
      `Channel title type icon element for ${this.name} couldn't be seen within timeout`,
      500
    )
    return (await titleElement.getText()) === this.name
  }

  async isMessageInputReady(): Promise<boolean> {
    await this.driver.wait(
      until.elementIsVisible(this.messageInput),
      15_000,
      `Channel message input element for ${this.name} couldn't be seen within timeout`,
      500
    )
    await this.driver.wait(
      until.elementIsEnabled(this.messageInput),
      15_000,
      `Channel message input element for ${this.name} wasn't enabled within timeout`,
      500
    )
    return true
  }

  async waitForUserMessageByText(
    username: string,
    messageContent: string,
    timeoutMs: number = 30_000
  ): Promise<WebElement> {
    logger.info(`Waiting for user "${username}" message "${messageContent}"`)
    return this.driver.wait(
      async () => {
        const startTime = DateTime.utc().toMillis()
        const endTime = startTime + timeoutMs
        while (DateTime.utc().toMillis() < endTime) {
          try {
            const messages = await this.getUserMessages(username)
            for (const element of messages) {
              const text = await element.getText()
              logger.info(`Checking if message ${text} contains ${messageContent}`)
              if (text.includes(messageContent)) {
                logger.info(`Found message with matching text ${text}`)
                return element
              }
            }
          } catch (e) {
            // swallow timeout error during polling
          }
          await sleep(500)
        }
        throw logAndReturnError(`No message found for user ${username} and message content ${messageContent}`)
      },
      timeoutMs,
      `Message in channel ${this.name} couldn't be found within timeout`,
      500
    )
  }

  async waitForUserMessageByFilename(
    username: string,
    filename: string,
    fileType: FileAttachmentType
  ): Promise<WebElement> {
    logger.info(`Waiting for user "${username}" message with uploaded file "${filename}"`)
    return this.driver.wait(
      async () => {
        const startTime = DateTime.utc().toMillis()
        const endTime = startTime + 40_000
        while (DateTime.utc().toMillis() < endTime) {
          const messages = await this.getUserMessages(username)
          for (const element of messages) {
            const filenameElement = await this.getFileAttachmentnameElementByType(filename, fileType, element)
            if (filenameElement != null) {
              logger.info(`Found message with matching filename ${filename}`)
              return element
            }
          }
          await sleep(500)
        }
        throw logAndReturnError(`No message found for user ${username} and filename ${filename}`)
      },
      45_000,
      `Message for uploaded file ${filename} in channel ${this.name} couldn't be found within timeout`,
      500
    )
  }

  private async getFileAttachmentnameElementByType(
    filename: string,
    fileType: FileAttachmentType,
    baseElement: WebElement
  ): Promise<WebElement | undefined> {
    let filenameElement: WebElement | undefined = undefined
    switch (fileType) {
      case FileAttachmentType.IMAGE:
        filenameElement = await this.getImageAttachmentFilenameElement(filename, baseElement)
        break
      case FileAttachmentType.FILE:
        filenameElement = await this.getFileAttachmentFilenameElement(filename, baseElement)
        break
    }

    return filenameElement
  }

  private async getFileAttachmentFilenameElement(
    filename: string,
    baseElement: WebElement
  ): Promise<WebElement | undefined> {
    try {
      const filenameComponentElement = await this.driver.wait(
        baseElement.findElement(By.xpath(`//*[@class='FileComponentfilename']`)),
        20_000,
        `Filename parent component for uploaded file ${filename} in channel ${this.name} couldn't be found within timeout`,
        500
      )
      const parsedPath = path.parse(filename)
      // this is split because we print the message as multiple lines and contains doesn't return true when searching the full filename
      const filenameElement = await this.driver.wait(
        filenameComponentElement.findElement(By.xpath(`//h5[contains(text(), "${parsedPath.name}")]`)),
        15_000,
        `Filename component with correct filename for uploaded file ${filename} in channel ${this.name} couldn't be found within timeout`,
        500
      )
      if ((await filenameElement.getText()) === filename) {
        return filenameElement
      }
    } catch (e) {
      if (!e.message.includes('no such element')) {
        throw e
      }
    }

    return undefined
  }

  private async getImageAttachmentFilenameElement(
    filename: string,
    baseElement: WebElement
  ): Promise<WebElement | undefined> {
    try {
      const filenameElement = await this.driver.wait(
        baseElement.findElement(By.xpath(`//p[text()='${filename}']`)),
        25_000,
        `Filename component for uploaded image ${filename} in channel ${this.name} couldn't be found within timeout`,
        500
      )
      return filenameElement
    } catch (e) {
      if (!e.message.includes('no such element')) {
        throw e
      }
    }

    return undefined
  }

  public async getAllMessages() {
    return this.driver.wait(
      until.elementsLocated(By.xpath('//*[contains(@data-testid, "userMessages-")]')),
      15_000,
      `All messages in channel ${this.name} couldn't be found within timeout`,
      500
    )
  }

  get element() {
    return this.driver.wait(
      until.elementLocated(
        By.xpath(`//p[@data-testid="${this.name}-channel-link-text" or @data-testid="${this.name}-link-text"]`)
      ),
      60_000,
      `Link for channel ${this.name} couldn't be found within timeout`,
      500
    )
  }

  get messageInput() {
    return this.driver.wait(
      until.elementLocated(By.xpath('//*[@data-testid="messageInput"]')),
      15_000,
      `Message input for channel ${this.name} couldn't be found within timeout`,
      500
    )
  }

  get uploadFileInput() {
    return this.driver.wait(
      until.elementLocated(By.xpath('//*[@data-testid="uploadFileInput"]')),
      15_000,
      `File attachment button for channel ${this.name} couldn't be found within timeout`,
      500
    )
  }

  async sendMessage(message: string, username: string): Promise<MessageIds> {
    const sendMessageInput = await this.messageInput
    await sendMessageInput.sendKeys(message)
    await sendMessageInput.sendKeys(Key.ENTER)
    return this.getMessageIdsByText(message, username)
  }

  async attachFile(
    filename: string,
    filePath: string,
    fileType: FileAttachmentType,
    username: string
  ): Promise<MessageIds> {
    const uploadFileInput = await this.uploadFileInput
    await uploadFileInput.sendKeys(filePath)
    const sendMessageInput = await this.messageInput
    await sendMessageInput.sendKeys(Key.ENTER)
    return this.getMessageIdsByFile(filename, fileType, username)
  }

  async cancelFileDownload(messageIds: MessageIds): Promise<boolean> {
    try {
      const messageElement = await this.waitForMessageContentById(messageIds.messageId)
      let statusElement: WebElement | undefined = undefined
      try {
        statusElement = await this.waitForFileDownloadStatus(FileDownloadStatus.QUEUED, messageElement, 15_000)
      } catch (e) {
        logger.warn(
          `Couldn't find a queued status element for this file, this is likely because it is already downloading...`
        )
      }

      let endTime = DateTime.utc().toMillis() + 90_000
      while (DateTime.utc().toMillis() < endTime) {
        try {
          statusElement = await this.waitForFileDownloadStatus(FileDownloadStatus.DOWNLOADING, messageElement, 15_000)
          break
        } catch (e) {
          logger.warn(`Couldn't find status element with downloading status`)
        }

        try {
          statusElement = await this.waitForFileDownloadStatus(
            FileDownloadStatus.DOWNLOADING_CAN_CANCEL,
            messageElement,
            15_000
          )
          break
        } catch (e) {
          logger.warn(`Couldn't find status element with downloading cancelable status`)
        }
        sleep(2_000)
      }

      if (statusElement == null) {
        throw new Error(`File didn't start downloading within a reasonable time`)
      }

      await statusElement.click()
      endTime = DateTime.utc().toMillis() + 90_000
      while (DateTime.utc().toMillis() < endTime) {
        try {
          statusElement = await this.waitForFileDownloadStatus(FileDownloadStatus.CANCELED, messageElement, 15_000)
          break
        } catch (e) {
          logger.warn(`Couldn't find status element with canceled status`)
        }

        try {
          statusElement = await this.waitForFileDownloadStatus(FileDownloadStatus.DOWNLOAD_FILE, messageElement, 15_000)
          break
        } catch (e) {
          logger.warn(`Couldn't find status element with download file status`)
        }
        sleep(2_000)
      }
      return true
    } catch (e) {
      logger.error(`Error occurred while canceling download`, e)
      return false
    }
  }

  async getMessageIdsByText(message: string, username: string, timeoutMs: number = 30_000): Promise<MessageIds> {
    const messageElement = await this.waitForUserMessageByText(username, message, timeoutMs)
    if (!messageElement) {
      throw logAndReturnError(`No message element found for message ${message}`)
    }

    let testId = await messageElement.getAttribute('data-testid')
    logger.info(`Data Test ID for message content: ${testId}`)
    let testIdSplit = testId.split('-')
    const parentMessageId = testIdSplit[testIdSplit.length - 1]

    const contentElement = await this.waitForMessageContentByText(message, messageElement, timeoutMs)
    if (!contentElement) {
      throw logAndReturnError(`No message content element found for message content ${message}`)
    }

    testId = await contentElement.getAttribute('data-testid')
    logger.info(`Data Test ID for message content: ${testId}`)
    testIdSplit = testId.split('-')
    const messageId = testIdSplit[testIdSplit.length - 1]
    return {
      messageId,
      parentMessageId,
    }
  }

  async getMessageIdsByFile(filename: string, fileType: FileAttachmentType, username: string): Promise<MessageIds> {
    const messageElement = await this.waitForUserMessageByFilename(username, filename, fileType)
    if (!messageElement) {
      throw logAndReturnError(`No message element found for filename ${filename}`)
    }

    let testId = await messageElement.getAttribute('data-testid')
    logger.info(`Data Test ID for (parent) message content: ${testId}`)
    let testIdSplit = testId.split('-')
    const parentMessageId = testIdSplit[testIdSplit.length - 1]

    const contentElement = await this.waitForMessageContentByFilename(filename, fileType, messageElement)
    if (!contentElement) {
      throw logAndReturnError(`No message content element found for filename ${filename}`)
    }

    testId = await contentElement.getAttribute('data-testid')
    logger.info(`Data Test ID for message content: ${testId}`)
    testIdSplit = testId.split('-')
    const messageId = testIdSplit[testIdSplit.length - 1]
    return {
      messageId,
      parentMessageId,
    }
  }

  async getMessageIdsByFileAndId(
    messageIds: MessageIds,
    filename: string,
    fileType: FileAttachmentType,
    username: string
  ): Promise<MessageIds> {
    const messageElement = await this.waitForUserMessageByFilename(username, filename, fileType)
    if (!messageElement) {
      throw logAndReturnError(`No message element found for filename ${filename}`)
    }

    let testId = await messageElement.getAttribute('data-testid')
    logger.info(`Data Test ID for (parent) message content: ${testId}`)
    let testIdSplit = testId.split('-')
    const parentMessageId = testIdSplit[testIdSplit.length - 1]

    const contentElement = await this.waitForMessageContentByFilenameAndId(messageIds, filename, fileType)
    if (contentElement == null) {
      throw logAndReturnError(`No message content element found for filename ${filename}`)
    }

    testId = await contentElement.getAttribute('data-testid')
    logger.info(`Data Test ID for message content: ${testId}`)
    testIdSplit = testId.split('-')
    const messageId = testIdSplit[testIdSplit.length - 1]
    return {
      messageId,
      parentMessageId,
    }
  }

  async getUserMessages(username: string, timeoutMs: number = 15_000): Promise<WebElement[]> {
    return await this.driver.wait(
      until.elementsLocated(By.xpath(`//*[contains(@data-testid, "userMessages-${username}")]`)),
      timeoutMs,
      `Messages for user ${username} in channel ${this.name} couldn't be found within timeout`,
      500
    )
  }

  async getUserMessagesFull(username: string): Promise<WebElement[]> {
    return await this.driver.wait(
      until.elementsLocated(By.xpath(`//*[contains(@data-testid, "userMessagesWrapper-${username}")]`)),
      15_000,
      `All messages for user ${username} in channel ${this.name} couldn't be found within timeout`,
      500
    )
  }

  async getAtleastNumUserMessages(username: string, num: number): Promise<WebElement[] | null> {
    return await this.driver.wait(
      async (): Promise<WebElement[] | null> => {
        const messages = await this.getUserMessages(username)
        return messages.length >= num ? messages : null
      },
      60_000,
      `At least ${num} messages for user ${username} in channel ${this.name} couldn't be found within timeout`,
      500
    )
  }

  async waitForLabel(username: string, label: string) {
    logger.info(`Waiting for user's "${username}" label "${label}" label`)
    await this.driver.wait(
      async () => {
        const labels = await this.driver.findElements(By.xpath(`//*[contains(@data-testid, "userLabel-${username}")]`))
        const properLabels = labels.filter(async labelElement => {
          const labelText = await labelElement.getText()
          return labelText === label
        })
        return properLabels.length > 0
      },
      15_000,
      `Message label ${label} for user ${username} in channel ${this.name} couldn't be found within timeout`,
      500
    )
  }

  async waitForAvatar(username: string, messageId: string): Promise<WebElement> {
    logger.info(`Waiting for user's avatar with username ${username} for message with ID ${messageId}`)
    const avatarElement = await this.driver.wait(
      until.elementLocated(By.xpath(`//*[contains(@data-testid, "userAvatar-${username}-${messageId}")]`)),
      15_000,
      `Avatar for user ${username} in channel ${this.name} couldn't be found within timeout`,
      500
    )
    await this.driver.wait(until.elementIsVisible(avatarElement), 5_000)
    if (avatarElement) {
      logger.info(`Found user's avatar with username ${username} for message with ID ${messageId}`)
      return avatarElement
    }

    throw logAndReturnError(`Failed to find user's avatar with username ${username} for message with ID ${messageId}`)
  }

  async waitForDateLabel(username: string, messageId: string): Promise<WebElement> {
    logger.info(`Waiting for date for message with ID ${messageId}`)
    const dateElement = await this.driver.wait(
      until.elementLocated(By.xpath(`//*[contains(@data-testid, "messageDateLabel-${username}-${messageId}")]`)),
      15_000,
      `Message date label for user ${username} in channel ${this.name} couldn't be found within timeout`,
      500
    )
    await this.driver.wait(until.elementIsVisible(dateElement), 5_000)
    if (dateElement) {
      logger.info(`Found date label for message with ID ${messageId}`)
      return dateElement
    }

    throw logAndReturnError(`Failed to find date label for message with ID ${messageId}`)
  }

  async waitForMessageContentById(messageId: string): Promise<WebElement> {
    logger.info(`Waiting for content for message with ID ${messageId}`)
    const messageContentElement = await this.driver.wait(
      until.elementLocated(By.xpath(`//*[contains(@data-testid, "messagesGroupContent-${messageId}")]`)),
      45_000,
      `Message content element for message ID ${messageId} in channel ${this.name} couldn't be found within timeout`,
      500
    )
    if (messageContentElement) {
      logger.info(`Found content for message with ID ${messageId}`)
      return messageContentElement
    }

    throw logAndReturnError(`Failed to find content for message with ID ${messageId}`)
  }

  async waitForMessageContentByText(
    messageContent: string,
    messageElement: WebElement,
    timeoutMs: number = 15_000
  ): Promise<WebElement> {
    logger.info(`Waiting for content for message with text ${messageContent}`)
    const messageContentElements = await this.driver.wait(
      messageElement.findElements(By.xpath(`//*[contains(@data-testid, "messagesGroupContent-")]`)),
      timeoutMs,
      `Message content element for text ${messageContent} in channel ${this.name} couldn't be found within timeout`,
      500
    )
    for (const element of messageContentElements) {
      logger.info(await element.getId())
      const text = await element.getText()
      logger.info(`Testing content: ${messageContent}`)
      if (text.includes(messageContent)) {
        logger.info(`Found content element for message with text ${messageContent}`)
        return element
      }
    }

    throw logAndReturnError(`Failed to find content for message with content ${messageContent}`)
  }

  async waitForMessageContentByFilename(
    filename: string,
    fileType: FileAttachmentType,
    messageElement: WebElement
  ): Promise<WebElement> {
    logger.info(`Waiting for file content for message with filename ${filename} and type ${fileType}`)
    await this.getFileAttachmentnameElementByType(filename, fileType, messageElement)
    const messageContentElements = await this.driver.wait(
      messageElement.findElements(By.xpath(`//*[contains(@data-testid, "messagesGroupContent-")]`)),
      45_000,
      `Message content element for filename ${filename} in channel ${this.name} couldn't be found within timeout`,
      500
    )

    for (const element of messageContentElements) {
      const result = await this.testContentByFilename(filename, fileType, element)
      if (result != null) {
        return result
      }
    }

    throw logAndReturnError(`Failed to find content for message with filename ${filename} and type ${fileType}`)
  }

  async waitForMessageContentByFilenameAndId(
    messageIds: MessageIds,
    filename: string,
    fileType: FileAttachmentType
  ): Promise<WebElement> {
    logger.info(
      `Waiting for file content for message with filename ${filename} and type ${fileType} and ID ${messageIds.messageId}`
    )
    const messageContentElement = await this.waitForMessageContentById(messageIds.messageId)
    await this.getFileAttachmentnameElementByType(filename, fileType, messageContentElement)
    const result = await this.testContentByFilename(filename, fileType, messageContentElement)
    if (result != null) {
      return result
    }

    throw logAndReturnError(`Failed to find content for message with filename ${filename} and type ${fileType}`)
  }

  // class="ImageAttachmentPlaceholderplaceholderIcon"
  // class="ImageAttachmentPlaceholderplaceholder"

  private async testContentByFilename(
    filename: string,
    fileType: FileAttachmentType,
    testableMessageContentElement: WebElement
  ): Promise<WebElement | undefined> {
    logger.info(`Testing content for type ${fileType}`)
    let containerElements: WebElement[] = []
    switch (fileType) {
      case FileAttachmentType.IMAGE:
        // wait for the downloading placeholder to appear and then disappear
        try {
          const placeholderElement = await this.driver.wait(
            until.elementLocated(By.xpath(`//*[@class='ImageAttachmentPlaceholderplaceholder']`)),
            20_000,
            `Image placeholder element for ${filename} in channel ${this.name} couldn't be found within timeout`,
            500
          )
          await this.driver.wait(
            until.elementIsNotVisible(placeholderElement),
            120_000,
            `Image placeholder element for ${filename} in channel ${this.name} didn't disappear within timeout`,
            500
          )
        } catch (e) {
          logger.warn(
            `The image placeholder element never became visible, this is likely because the download completed too quickly...`
          )
        }

        containerElements = await this.driver.wait(
          testableMessageContentElement.findElements(By.xpath(`//*[@class='ImageAttachmentcontainer']`)),
          30_000,
          `Image container elements in channel ${this.name} couldn't be found within timeout`,
          500
        )
        break
      case FileAttachmentType.FILE:
        containerElements = await this.driver.wait(
          testableMessageContentElement.findElements(By.xpath(`//*[contains(@data-testid, "-fileComponent")]`)),
          15_000,
          `File container elements for ${filename} in channel ${this.name} couldn't be found within timeout`,
          500
        )
        break
    }

    for (const container of containerElements) {
      logger.info(`Testing uploaded file container ${await container.getId()}`)
      const filenameElement = await this.getFileAttachmentnameElementByType(filename, fileType, container)
      if (filenameElement == null) {
        continue
      }

      let contentElement: WebElement | undefined = undefined
      switch (fileType) {
        case FileAttachmentType.IMAGE:
          contentElement = await this.driver.wait(
            container.findElement(By.xpath(`//img[@class='ImageAttachmentimage']`)),
            30_000,
            `Image element for ${filename} in channel ${this.name} couldn't be found within timeout`,
            500
          )
          break
        case FileAttachmentType.FILE:
          contentElement = await this.driver.wait(
            container.findElement(By.xpath(`//img[@class='FileComponentactionIcon']`)),
            30_000,
            `File element for ${filename} in channel ${this.name} couldn't be found within timeout`,
            500
          )
          break
      }

      if (contentElement != null) {
        await this.driver.wait(
          until.elementIsVisible(contentElement),
          30_000,
          `Image/file content element for ${filename} in channel ${this.name} couldn't be seen within timeout`,
          500
        )
        logger.info(`Found content element for message with filename ${filename} and type ${fileType}`)
        return testableMessageContentElement
      }
    }

    return undefined
  }

  async waitForFileDownloadStatus(
    status: FileDownloadStatus,
    messageElement: WebElement,
    timeoutMs = 45_000
  ): Promise<WebElement> {
    let locatorString: string | undefined = undefined
    switch (status) {
      case FileDownloadStatus.QUEUED:
        locatorString = 'Queued for download'
        break
      case FileDownloadStatus.DOWNLOADING:
        locatorString = 'Downloading...'
        break
      case FileDownloadStatus.DOWNLOADING_CAN_CANCEL:
        locatorString = 'Cancel download'
        break
      case FileDownloadStatus.COMPLETED:
        locatorString = 'Show in folder'
        break
      case FileDownloadStatus.CANCELED:
        locatorString = 'Canceled'
        break
      case FileDownloadStatus.DOWNLOAD_FILE:
        locatorString = 'Download file'
        break
      default:
        throw new Error(`Unknown status type ${status}`)
    }
    return await this.driver.wait(
      messageElement.findElement(By.xpath(`//p[text()='${locatorString!}']`)),
      timeoutMs,
      `File download status element with text ${locatorString} in channel ${this.name} couldn't be found within timeout`,
      2_000
    )
  }

  async waitForLabelsNotPresent(username: string, timeout = 15_000) {
    logger.info(`Waiting for user's "${username}" label to not be present`)
    await this.driver.wait(
      async () => {
        const labels = await this.driver.findElements(By.xpath(`//*[contains(@data-testid, "userLabel-${username}")]`))
        return labels.length === 0
      },
      timeout,
      `User name label ${username} in channel ${this.name} didn't disappear within timeout`,
      500
    )
  }

  async getMessage(text: string) {
    return await this.driver.wait(
      until.elementLocated(By.xpath(`//span[contains(text(),"${text}")]`)),
      15_000,
      `Message with text ${text} in channel ${this.name} couldn't be found within timeout`,
      500
    )
  }
}

export class Sidebar {
  private readonly driver: ThenableWebDriver
  constructor(driver: ThenableWebDriver) {
    this.driver = driver
  }

  async getChannelIcon(channelName: string, isPublic = true): Promise<WebElement> {
    return isPublic ? this.getChannelHashIcon(channelName) : this.getChannelLockIcon(channelName)
  }

  async getChannelLockIcon(channelName: string): Promise<WebElement> {
    const channelLockIcon = await this.driver.wait(
      until.elementLocated(By.xpath(`//*[@data-testid="${channelName}-channel-link-icon-private"]`)),
      10_000,
      `Channel list private lock icon for ${channelName} wasn't located within timeout`,
      500
    )

    await this.driver.wait(
      until.elementIsVisible(channelLockIcon),
      10_000,
      `Channel list private lock icon for ${channelName} wasn't visible within timeout`,
      500
    )

    return channelLockIcon
  }

  async getChannelHashIcon(channelName: string): Promise<WebElement> {
    const channelHashIcon = await this.driver.wait(
      until.elementLocated(By.xpath(`//*[@data-testid="${channelName}-channel-link-icon-public"]`)),
      10_000,
      `Channel list public hash icon for ${channelName} wasn't located within timeout`,
      500
    )

    await this.driver.wait(
      until.elementIsVisible(channelHashIcon),
      10_000,
      `Channel list public hash icon for ${channelName} wasn't visible within timeout`,
      500
    )

    return channelHashIcon
  }

  /**
   * Get channel link elements in the sidebar
   */
  async getChannelList(): Promise<WebElement[]> {
    // We use a more generic XPath and then filter out user links to handle backwards compatibility
    const channels = await this.driver.wait(
      this.driver.findElements(By.xpath('//*[contains(@data-testid, "-link-text")]')),
      15_000,
      `Sidebar channel list couldn't be found within timeout`,
      500
    )
    const channelTestIds = await Promise.all(channels.map(async channel => await channel.getAttribute('data-testid')))
    logger.info(`Found ${channels.length} channel candidates: ${channelTestIds}`)
    // filter out any elements that include the "-user-" text, as these are user profile links
    const channelFilter = []
    for (let i = 0; i < channels.length; i++) {
      if (!channelTestIds[i].includes('user-link-text')) {
        channelFilter.push(channels[i])
      }
    }
    const filteredTestIds = await Promise.all(
      channelFilter.map(async channel => await channel.getAttribute('data-testid'))
    )
    logger.info(`Filtered channels: ${filteredTestIds}`)
    return channelFilter
  }

  /**
   * Get user profile link elements in the sidebar
   */
  async getUserProfileList(): Promise<WebElement[]> {
    const userProfileList = await this.driver.wait(
      this.driver.findElements(By.xpath('//*[contains(@data-testid, "user-link-text")]')),
      15_000,
      `Sidebar user profile list couldn't be found within timeout`,
      500
    )
    return userProfileList
  }

  /**
   * Get names of all users in the sidebar
   */
  async getUserNames(): Promise<string[]> {
    const elements = await this.getUserProfileList()
    return Promise.all(
      elements.map(async element => {
        const fullName = await element.getText()
        return fullName.split(' ')[1]
      })
    )
  }

  /**
   * Get names of all channels in the sidebar
   */
  async getChannelsNames(): Promise<string[]> {
    const elements = await this.getChannelList()
    return Promise.all(
      elements.map(async element => {
        return await element.getText()
      })
    )
  }

  async waitForChannelsNum(num: number, timeoutMs: number = 15_000): Promise<boolean> {
    logger.info(`Waiting for ${num} channels`)
    return this.driver.wait(
      async () => {
        const channels = await this.getChannelList()
        return channels.length === num
      },
      timeoutMs,
      `Sidebar channel list length couldn't be determined within timeout`,
      500
    )
  }

  async waitForChannels(channelsNames: Array<string>): Promise<void> {
    await this.waitForChannelsNum(channelsNames.length)
    const names = await this.getChannelsNames()
    expect(names).toEqual(expect.arrayContaining(channelsNames))
  }

  async openSettings(): Promise<Settings> {
    await this.driver.wait(
      until.elementLocated(By.xpath('//span[@data-testid="settings-panel-button"]')),
      10_000,
      `Community settings button couldn't be found within timeout`,
      500
    )
    const button = await this.driver.findElement(By.xpath('//span[@data-testid="settings-panel-button"]'))
    await this.driver.wait(until.elementIsVisible(button), 10_000)
    await this.driver.wait(until.elementIsEnabled(button), 10_000)
    await button.click()
    return new Settings(this.driver)
  }

  async switchChannel(name: string, isPublic: boolean = true): Promise<Channel> {
    const channelLink = await this.driver.wait(
      until.elementLocated(By.xpath(`//div[@data-testid="${name}-link"]`)),
      20_000,
      `Channel link button for ${name} couldn't be found within timeout`,
      500
    )
    await channelLink.click()
    const channel = new Channel(this.driver, name)
    await channel.isOpen(isPublic)
    return channel
  }

  async addNewChannel(name: string, isPublic: boolean = true): Promise<Channel> {
    const button = await this.driver.wait(
      until.elementLocated(By.xpath('//button[@data-testid="sidebar-button-createChannel"]')),
      5_000,
      `Add channel button couldn't be found within timeout`,
      500
    )
    await this.driver.wait(until.elementIsVisible(button), 5_000)
    await this.driver.wait(until.elementIsEnabled(button), 5_000)
    await button.click()
    const channelNameInput = await this.driver.wait(
      until.elementLocated(By.xpath('//input[@name="channelName"]')),
      5_000,
      `Add channel name input field couldn't be found within timeout`,
      500
    )
    await this.driver.wait(until.elementIsVisible(channelNameInput), 5_000)
    await this.driver.wait(until.elementIsEnabled(channelNameInput), 5_000)
    await channelNameInput.sendKeys(name)

    const channelPrivateToggle = await this.driver.wait(
      until.elementLocated(By.xpath('//span[@data-testid="createChannel-private-form-control-toggle"]')),
      5_000,
      `Channel private toggle couldn't be found within timeout`,
      500
    )
    await this.driver.wait(until.elementIsVisible(channelPrivateToggle), 5_000)
    if ((await channelPrivateToggle.getAttribute('class')).includes('checked')) {
      throw new Error('Channel privacy toggle was enabled before clicking')
    }
    if (!isPublic) {
      await channelPrivateToggle.click()
      if (!(await channelPrivateToggle.getAttribute('class')).includes('checked')) {
        throw new Error('Channel privacy toggle was disabled after clicking')
      }
    }
    const channelNameButton = await this.driver.wait(
      until.elementLocated(By.xpath('//button[@data-testid="channelNameSubmit"]')),
      5_000,
      `Add channel submit button couldn't be found within timeout`,
      500
    )
    await this.driver.wait(until.elementIsVisible(channelNameButton), 5_000)
    await channelNameButton.click()
    return new Channel(this.driver, name)
  }

  /**
   * Get user profile element by nickname
   */
  async getUserProfileByNickname(nickname: string) {
    return this.driver.wait(
      until.elementLocated(By.xpath(`//li[@data-testid='${nickname}-user-link']`)),
      10_000,
      `User profile for ${nickname} couldn't be found within timeout`,
      500
    )
  }

  /**
   * Wait for a specific number of user profiles in the sidebar
   */
  async waitForUserProfilesNum(num: number) {
    logger.info(`Waiting for ${num} user profiles`)
    return this.driver.wait(
      async () => {
        const users = await this.getUserProfileList()
        return users.length === num
      },
      15_000,
      `Sidebar user profile list length couldn't be determined within timeout`,
      500
    )
  }

  /**
   * Wait for a specific set of user profile names in the sidebar
   */
  async waitForUserProfiles(userNames: Array<string>) {
    await this.waitForUserProfilesNum(userNames.length)
    const names = await this.getUserNames()
    expect(names).toEqual(expect.arrayContaining(userNames))
  }

  /**
   * Check if a user's connected badge is visible
   */
  async isUserConnected(nickname: string): Promise<boolean> {
    const userProfile = await this.getUserProfileByNickname(nickname)
    try {
      const badge = await userProfile.findElement(
        By.xpath(`.//span[contains(@class, 'MuiBadge-dot') and not(contains(@class, 'MuiBadge-invisible'))]`)
      )
      return await badge.isDisplayed()
    } catch (e) {
      return false
    }
  }

  /**
   * Wait for a user's connected badge to become visible
   */
  async waitForUserConnected(nickname: string, timeout = 60_000): Promise<void> {
    const userProfile = await this.getUserProfileByNickname(nickname)
    await this.driver.wait(
      async () => {
        try {
          const badge = await userProfile.findElement(
            By.xpath(`.//span[contains(@class, 'MuiBadge-dot') and not(contains(@class, 'MuiBadge-invisible'))]`)
          )
          return await badge.isDisplayed()
        } catch (e) {
          return false
        }
      },
      timeout,
      `Connected badge for user ${nickname} was not visible within timeout`,
      500
    )
  }

  /**
   * Returns the currently displayed community name from the identity panel.
   * Tries the explicit test id first, then falls back to the styled class,
   * and finally to the button text (older builds).
   */
  async getDisplayedCommunityName(): Promise<string> {
    try {
      const nameEl = await this.driver.wait(
        until.elementLocated(By.xpath("//*[@data-testid='current-community-name']")),
        3_000,
        `Current community name element not found quickly; trying fallback`,
        500
      )
      return await nameEl.getText()
    } catch {
      try {
        const typ = await this.driver.wait(
          until.elementLocated(By.xpath("//*[contains(@class,'IdentityPanelnickname')][1]")),
          10_000,
          `Identity panel nickname element couldn't be found within timeout`,
          500
        )
        return await typ.getText()
      } catch {
        const btn = await this.driver.wait(
          until.elementLocated(By.xpath("//button[@data-testid='settings-panel-button']")),
          10_000,
          `Community name button couldn't be found within timeout`,
          500
        )
        return await btn.getText()
      }
    }
  }

  /**
   * Current user's nickname shown in the sidebar user profile panel.
   */
  async getCurrentUserNickname(): Promise<string> {
    const el = await this.driver.wait(
      until.elementLocated(By.xpath("//*[@data-testid='user-profile-nickname']")),
      15_000,
      `Current user nickname element couldn't be found within timeout`,
      500
    )
    return await el.getText()
  }
}

export class UpdateModal {
  private readonly driver: ThenableWebDriver
  constructor(driver: ThenableWebDriver) {
    this.driver = driver
  }

  get element() {
    logger.info('Waiting for update modal root element')
    return this.driver.wait(
      until.elementLocated(By.xpath("//h3[text()='Software update']/ancestor::div[contains(@class,'MuiModal-root')]")),
      20_000,
      `Update modal couldn't be found within timeout`,
      500
    )
  }

  async close() {
    const updateModalRootElement = await this.element
    logger.info('Found update modal root element')
    const closeButton = await this.driver.wait(
      updateModalRootElement.findElement(By.xpath("//*[self::div[@data-testid='ModalActions']]/button")),
      5_000,
      `Update modal close button couldn't be found within timeout`,
      500
    )

    try {
      logger.info('Before clicking update modal close button')
      await closeButton.click()
      return
    } catch (e) {
      logger.error('Error while clicking close button on update modal', e)
    }

    try {
      const log = await this.driver.executeScript('arguments[0].click();', closeButton)
      logger.info('executeScript', log)
    } catch (e) {
      logger.warn('Probably clicked hidden close button on update modal')
    }
  }
}
export class Settings {
  private readonly driver: ThenableWebDriver
  constructor(driver: ThenableWebDriver) {
    this.driver = driver
  }

  get element() {
    return this.driver.wait(
      until.elementLocated(By.xpath("//p[text()='Community Settings']")),
      15_000,
      `Settings modal couldn't be found within timeout`,
      500
    )
  }

  async isReady(): Promise<boolean> {
    await this.driver.wait(
      until.elementIsVisible(this.element),
      10_000,
      `Settings modal wasn't ready within timeout`,
      500
    )
    return true
  }

  async getVersion() {
    await this.switchTab(SettingsModalTabName.ABOUT)
    const textWebElement = await this.driver.wait(
      until.elementLocated(By.xpath('//p[contains(text(),"Version")]')),
      10_000,
      `App version couldn't be found within timeout`,
      500
    )
    await this.driver.wait(until.elementIsVisible(textWebElement), 5_000)
    const text = await textWebElement.getText()

    const version = this.formatVersionText(text)

    return version
  }

  private formatVersionText(text: string) {
    const index1 = text.indexOf(':') + 1
    const index2 = text.indexOf('\n')
    const version = text.slice(index1, index2).trim()
    return version
  }

  async openLeaveCommunityModal() {
    await this.switchTab(SettingsModalTabName.LEAVE_COMMUNITY)
  }

  async openDebugTab() {
    await this.switchTab(SettingsModalTabName.DEBUG)
  }

  /**
   * Clicks the “Leave community” button, retrying until it becomes clickable or the timeout elapses.
   *
   * @param timeoutMs  how long to keep retrying (default = 30 s)
   */
  async leaveCommunityButton(timeoutMs = 30_000): Promise<void> {
    const start = Date.now()
    const retryInterval = 500 // ms
    let lastError: Error | undefined

    while (Date.now() - start < timeoutMs) {
      try {
        const button = await this.driver.wait(
          until.elementLocated(By.xpath('//button[@data-testid="leave-community-button"]')),
          10_000,
          `Leave community button couldn't be found within timeout`,
          500
        )

        // Ensure it is visible and enabled before clicking.
        await this.driver.wait(until.elementIsVisible(button), 5_000)
        await this.driver.wait(until.elementIsEnabled(button), 5_000)

        await button.click()
        return // Success – exit the loop
      } catch (e: any) {
        // Swallow common transient errors and retry.
        if (
          e.message?.includes('element not interactable') ||
          e.message?.includes('ElementNotInteractableError') ||
          e.message?.includes('stale element reference')
        ) {
          lastError = e as Error
        } else {
          // Any other error is unexpected – re‑throw.
          throw e
        }
      }

      await this.driver.sleep(retryInterval)
    }

    // Exhausted retries.
    throw lastError ?? new Error('Leave community button was not interactable within the allotted time')
  }

  async switchTab(name: SettingsModalTabName) {
    const tab = await this.driver.wait(
      until.elementLocated(By.xpath(`//div[@data-testid='${name}-settings-tab']`)),
      15_000,
      `Settings tab button for ${name} couldn't be found within timeout`,
      500
    )
    await this.driver.wait(until.elementIsVisible(tab), 5_000)
    await tab.click()
    await this.waitForTabToBeReady(name)
  }

  async invitationLink() {
    const unlockButton = await this.driver.wait(
      until.elementLocated(By.xpath('//button[@data-testid="show-invitation-link"]')),
      10_000,
      `Show invitation link button couldn't be found within timeout`,
      500
    )
    await this.driver.wait(until.elementIsVisible(unlockButton), 10_000)

    await unlockButton.click()

    return await this.driver.wait(
      until.elementLocated(By.xpath("//p[@data-testid='invitation-link']")),
      10_000,
      `Unhidden invitation link element couldn't be found within timeout`,
      500
    )
  }

  /**
   * Returns the visible, interactive switch element (the span).
   */
  async p2pToggleSwitch() {
    const toggleSwitch = await this.driver.wait(
      until.elementLocated(By.xpath("//span[@data-testid='p2p-toggle-switch']")),
      10_000,
      `P2P toggle switch couldn't be found within timeout`,
      500
    )
    await this.driver.wait(until.elementIsVisible(toggleSwitch), 5_000)
    return toggleSwitch
  }

  /**
   * Returns the boolean state by checking the hidden input child.
   */
  async p2pToggleSwitchState(): Promise<boolean> {
    // We don't wait for visibility here because the input is usually visually hidden in MUI
    const input = await this.driver.wait(
      until.elementLocated(By.xpath("//span[@data-testid='p2p-toggle-switch']/input")),
      10_000,
      `P2P toggle switch input couldn't be found`,
      500
    )
    return await input.isSelected()
  }

  /**
   * Clicks the visible switch element.
   */
  async clickP2pToggleSwitch(): Promise<void> {
    const element = await this.p2pToggleSwitch()
    await element.click()
  }

  async openCommunityMembership(expectedUserCount?: number) {
    try {
      await this.switchTab(SettingsModalTabName.COMMUNITY_MEMBERSHIP)
      const title = await this.driver.wait(
        until.elementLocated(By.xpath("//*[@data-testid='community-membership-title']")),
        5_000,
        `Community membership tab header title couldn't be found within timeout`,
        500
      )
      await this.driver.wait(
        until.elementIsVisible(title),
        5_000,
        `Community membership tab header title wasn't visible within timeout`,
        500
      )

      const search = await this.driver.wait(
        until.elementLocated(By.xpath("//*[@data-testid='community-membership-search']")),
        5_000,
        `Community membership tab search bar couldn't be found within timeout`,
        500
      )
      await this.driver.wait(
        until.elementIsVisible(search),
        5_000,
        `Community membership tab search bar wasn't visible within timeout`,
        500
      )

      const list = await this.driver.wait(
        until.elementLocated(By.xpath("//*[@data-testid='community-membership-list']")),
        5_000,
        `Community membership tab user list couldn't be found within timeout`,
        500
      )
      await this.driver.wait(
        until.elementIsVisible(list),
        5_000,
        `Community membership tab user list wasn't visible within timeout`,
        500
      )

      if (expectedUserCount == null) return

      const userElements = await this.getUsersInCommunityMembership()
      if (userElements.length !== expectedUserCount) {
        throw new Error(
          `Expected ${expectedUserCount} users in community membership user list but found ${userElements.length}`
        )
      }
      return
    } catch (e) {
      logger.error('Error while opening and verifying community membership settings tab', e)
      throw e
    }
  }

  async getUserInCommunityMembership(
    username: string,
    expectedState: UserListStatus,
    includeMeTag = false
  ): Promise<UserListItem> {
    logger.debug('Getting community membership user list item', username)
    let status: UserListStatus = UserListStatus.NOT_FOUND
    let testText = new RegExp(`${username}`)
    let baseBadgeTimeout = 60_000
    if (includeMeTag) {
      testText = new RegExp(`${username}\\s+me`)
      baseBadgeTimeout = 5_000
    }

    let userItem: WebElement | undefined = undefined
    try {
      userItem = await this.driver.wait(
        until.elementLocated(By.xpath(`//*[@data-testid="${username}-membership-list-item"]`)),
        10_000,
        `User ${username} couldn't be found in membership list within timeout`,
        500
      )

      await this.driver.wait(
        until.elementIsVisible(userItem),
        5_000,
        `User ${username} wasn't visible in membership list within timeout`,
        500
      )
    } catch (e) {
      if (expectedState !== UserListStatus.NOT_FOUND) {
        logger.error(`Error while finding user ${username} in membership list`, e)
      }
      return {
        element: undefined,
        status,
        textMatches: false,
      }
    }

    if (userItem == null) {
      if (expectedState !== UserListStatus.NOT_FOUND) {
        logger.error(`Failed to find user ${username} in membership list`)
      }
      return {
        element: undefined,
        status,
        textMatches: false,
      }
    }

    const textMatches = (await userItem.getText()).match(testText) != null

    const statusBadge = await this.driver.wait(
      until.elementLocated(By.xpath(`//span[@data-testid="${username}-profile-photo-status-badge"]`)),
      baseBadgeTimeout,
      `Users item status badge for ${username} couldn't be located within timeout`,
      500
    )

    if (expectedState === UserListStatus.ONLINE) {
      try {
        await this.driver.wait(
          until.elementIsVisible(statusBadge),
          baseBadgeTimeout * 2,
          `Users item status badge for ${username} was not visibile within timeout`,
          500
        )
        status = UserListStatus.ONLINE
      } catch (e) {
        status = UserListStatus.OFFLINE
      }
    } else {
      try {
        await this.driver.wait(
          until.elementIsNotVisible(statusBadge),
          baseBadgeTimeout * 2,
          `Users item status badge for ${username} was not invisible within timeout`,
          500
        )
        status = UserListStatus.OFFLINE
      } catch (e) {
        status = UserListStatus.ONLINE
      }
    }

    return {
      element: userItem,
      status,
      textMatches,
    }
  }

  async getUsersInCommunityMembership(): Promise<WebElement[]> {
    return await this.driver.wait(
      until.elementsLocated(By.xpath('//*[contains(@data-testid, "-membership-list-item")]')),
      5_000,
      `Users within community membership list couldn't be found within timeout`,
      500
    )
  }

  async closeTabThenModal() {
    await this.closeTab()
    await sleep(1_000)
    await this.close()
  }

  async close() {
    const closeButton = await this.driver.wait(
      until.elementLocated(By.xpath('//div[@data-testid="close-settings-button"]')),
      10_000,
      `Settings close button couldn't be found within timeout`,
      500
    )
    await this.driver.wait(until.elementIsVisible(closeButton), 5_000)
    await closeButton.click()
  }

  async closeTab() {
    const closeTabButton = await this.driver.wait(
      until.elementLocated(By.xpath('//div[@data-testid="close-tab-button-box"]//button')),
      10_000,
      `Settings tab close button couldn't be found within timeout`,
      500
    )
    await this.driver.wait(until.elementIsVisible(closeTabButton), 5_000)
    await closeTabButton.click()
  }

  private async waitForTabToBeReady(tabName: SettingsModalTabName) {
    let locator: string | undefined = undefined
    switch (tabName) {
      case SettingsModalTabName.INVITE:
        locator = "//*[@data-testid='invite-a-friend']"
        break
      case SettingsModalTabName.ABOUT:
        locator = "//div[contains(@class, 'Abouttitle')]"
        break
      case SettingsModalTabName.LEAVE_COMMUNITY:
        locator = "//div[contains(@class, 'LeaveCommunitytitleContainer')]"
        break
      case SettingsModalTabName.NOTIFICATIONS:
        locator = "//div[contains(@class, 'Notificationstitle')]"
        break
      case SettingsModalTabName.QR_CODE:
        locator = "//div[contains(@class, 'QRCodetextWrapper')]"
        break
      case SettingsModalTabName.DEBUG:
        locator = "//div[contains(@class, 'DebugInfotitleContainer')]"
        break
      case SettingsModalTabName.COMMUNITY_MEMBERSHIP:
        locator = "//*[@data-testid='community-membership-title']"
        break
      default:
        throw new Error(`Can't wait for unknown tab ${tabName}`)
    }

    const result = await this.driver.wait(
      until.elementLocated(By.xpath(locator!)),
      15_000,
      `Settings tab ${tabName} wasn't ready within timeout`,
      500
    )
    await this.driver.wait(
      until.elementIsVisible(result),
      10_000,
      `Settings tab ${tabName} wasn't visible within timeout`,
      500
    )
  }
}

export class DebugModeModal {
  private readonly driver: ThenableWebDriver
  constructor(driver: ThenableWebDriver) {
    this.driver = driver
    logger.info('Debug modal')
  }

  get element() {
    return this.driver.wait(
      until.elementLocated(By.xpath("//h3[text()='App is running in debug mode']")),
      3000,
      `Debug modal couldn't be found within timeout`,
      500
    )
  }

  get button() {
    return this.driver.wait(
      until.elementLocated(By.xpath("//button[text()='Understand']")),
      2000,
      `Debug modal understand button couldn't be found within timeout`,
      500
    )
  }

  async close() {
    if (!process.env.TEST_MODE) return
    let button
    try {
      logger.info('Closing debug modal')
      await this.driver.wait(
        until.elementIsVisible(this.element),
        3_000,
        `Debug modal couldn't be seen within timeout`,
        500
      )
      logger.info('Debug modal title is displayed')
      button = await this.button
      logger.info('Debug modal button is displayed')
    } catch (e) {
      logger.error('Debug modal might have been covered by "join community" modal', e)
      return
    }

    await button.isDisplayed()
    logger.info('Button is displayed')
    await button.click()
    logger.info('Button click')
    try {
      const log = await this.driver.executeScript('arguments[0].click();', button)
      logger.info('executeScript', log)
    } catch (e) {
      logger.warn('Probably clicked hidden close button on debug modal')
    }
    await sleep(2000)
  }
}
