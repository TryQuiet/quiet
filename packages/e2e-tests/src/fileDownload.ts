import { By, error, type WebDriver, type WebElement } from 'selenium-webdriver'
import { FileDownloadStatus } from './enums'

const labels: Record<FileDownloadStatus, string> = {
  [FileDownloadStatus.QUEUED]: 'Queued for download',
  [FileDownloadStatus.DOWNLOADING]: 'Downloading...',
  [FileDownloadStatus.DOWNLOADING_CAN_CANCEL]: 'Cancel download',
  [FileDownloadStatus.COMPLETED]: 'Show in folder',
  [FileDownloadStatus.CANCELED]: 'Canceled',
  [FileDownloadStatus.DOWNLOAD_FILE]: 'Download file',
}

export const waitForFileStatus = async (
  driver: WebDriver,
  messageId: string,
  statuses: FileDownloadStatus[],
  timeoutMs = 45_000,
  options: { click?: boolean; rejectCompleted?: boolean } = {}
): Promise<WebElement> => {
  if (!/^[a-zA-Z0-9_-]+$/.test(messageId)) throw new Error('Invalid attachment message ID')
  const result = await driver.wait(
    async () => {
      try {
        // React may replace the attachment while its progress or hover text changes.
        // Always query the current target message, never another file's control.
        const controls = await driver.findElements(By.css(`[data-testid="messagesGroupContent-${messageId}"] p`))
        for (const control of controls) {
          if (!(await control.isDisplayed())) continue
          const text = await control.getText()
          if (options.rejectCompleted && text === labels[FileDownloadStatus.COMPLETED]) {
            throw new Error(`Attachment ${messageId} completed before cancellation was confirmed`)
          }
          if (!statuses.some(status => labels[status] === text)) continue
          if (options.click) await control.click()
          return control
        }
      } catch (failure) {
        if (!(failure instanceof error.StaleElementReferenceError)) throw failure
      }
      return undefined
    },
    timeoutMs,
    `Attachment ${messageId} did not reach ${statuses.join(' or ')}`,
    100
  )
  if (!result) throw new Error(`Attachment ${messageId} status is missing`)
  return result
}

export const cancelAttachmentDownload = async (driver: WebDriver, messageId: string, timeoutMs = 90_000) => {
  await waitForFileStatus(
    driver,
    messageId,
    [FileDownloadStatus.DOWNLOADING, FileDownloadStatus.DOWNLOADING_CAN_CANCEL],
    timeoutMs,
    { click: true, rejectCompleted: true }
  )
  await waitForFileStatus(
    driver,
    messageId,
    [FileDownloadStatus.CANCELED, FileDownloadStatus.DOWNLOAD_FILE],
    timeoutMs,
    { rejectCompleted: true }
  )
}

/** Arm the real UI cancel action before starting a transfer that can finish between WebDriver commands. */
export const startAndCancelAttachmentDownload = async (driver: WebDriver, messageId: string, timeoutMs = 90_000) => {
  await waitForFileStatus(driver, messageId, [FileDownloadStatus.DOWNLOAD_FILE], timeoutMs, { rejectCompleted: true })
  const key = `quiet-cancel-${messageId}`
  await driver.executeScript(
    `
    const [messageId, key, labels] = arguments;
    const state = { clicked: false, result: null, observer: null };
    window[key] = state;
    const check = () => {
      if (state.result) return;
      const controls = document.querySelectorAll('[data-testid="messagesGroupContent-' + messageId + '"] p');
      for (const control of controls) {
        if (!control.getClientRects().length) continue;
        const text = control.textContent.trim();
        if (text === labels.COMPLETED) {
          state.result = 'completed';
          return;
        }
        if (state.clicked) {
          if (text === labels.CANCELED || text === labels.DOWNLOAD_FILE) state.result = 'canceled';
        } else if (text === labels.DOWNLOADING || text === labels.DOWNLOADING_CAN_CANCEL) {
          state.clicked = true;
          control.click();
          return;
        }
      }
    };
    state.observer = new MutationObserver(check);
    state.observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    check();
  `,
    messageId,
    key,
    labels
  )
  try {
    // Selenium supplies the native start click. The observer clicks the actual
    // cancel control on its first render, before another full file can arrive.
    await waitForFileStatus(driver, messageId, [FileDownloadStatus.DOWNLOAD_FILE], timeoutMs, {
      click: true,
      rejectCompleted: true,
    })
    await driver.wait(
      async () => {
        const result = await driver.executeScript<string | null>('return window[arguments[0]]?.result ?? null', key)
        if (result === 'completed')
          throw new Error(`Attachment ${messageId} completed before cancellation was confirmed`)
        return result === 'canceled'
      },
      timeoutMs,
      `Attachment ${messageId} did not acknowledge cancellation`,
      100
    )
  } finally {
    await driver.executeScript('window[arguments[0]]?.observer?.disconnect(); delete window[arguments[0]]', key)
  }
}
