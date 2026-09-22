import { Builder, By, type WebDriver, type ThenableWebDriver } from 'selenium-webdriver'
import { Options, ServiceBuilder } from 'selenium-webdriver/chrome'
import { Channel } from '../selectors'
import { FileAttachmentType, FileDownloadStatus } from '../enums'

const describeLinux = process.platform === 'linux' ? describe : describe.skip

describeLinux('attachment controls in Chrome', () => {
  let driver: WebDriver
  let channel: Channel

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
    channel = new Channel(driver as ThenableWebDriver, 'general')
  }, 120_000)

  afterAll(async () => {
    await driver?.quit()
  })

  const message = (id: string, filename: string, status: string, action = '') => `
    <div data-testid="messagesGroupContent-${id}">
      <div data-testid="${id}-fileComponent">
        <div class="FileComponentfilename"><h5>${filename}</h5></div>
        <img class="FileComponentactionIcon" width="16" height="16" src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=">
        <p onclick="${action}">${status}</p>
      </div>
    </div>`
  const show = async (body: string) => {
    await driver.get(`data:text/html;charset=utf-8,${encodeURIComponent(`<!doctype html><body>${body}</body>`)}`)
  }

  it('returns the target attachment ID rather than an earlier message from the same author', async () => {
    await show(`<div data-testid="userMessages-owner-first">
      ${message('first', 'earlier.pdf', 'Show in folder')}
      ${message('target', 'large.bin', 'Downloading...')}
    </div>`)
    await expect(channel.getMessageIdsByFile('large.bin', FileAttachmentType.FILE, 'owner')).resolves.toEqual({
      messageId: 'target',
      parentMessageId: 'first',
    })
  })

  it('re-finds a rendered target and cancels only that transfer', async () => {
    await show(
      message('other', 'other.bin', 'Downloading...', 'window.otherClicked = true') +
        message('target', 'large.bin', 'Queued for download')
    )
    await driver.executeScript(`
      setTimeout(() => {
        const previous = document.querySelector('[data-testid="messagesGroupContent-target"]');
        const replacement = previous.cloneNode(true);
        const control = replacement.querySelector('p');
        control.textContent = 'Cancel download';
        control.onclick = () => {
          window.targetClicked = true;
          setTimeout(() => {
            const canceled = replacement.cloneNode(true);
            canceled.querySelector('p').textContent = 'Canceled';
            replacement.replaceWith(canceled);
          }, 150);
        };
        previous.replaceWith(replacement);
      }, 150);
    `)
    await expect(channel.cancelFileDownload({ messageId: 'target', parentMessageId: 'first' }, 2_000)).resolves.toBe(
      true
    )
    expect(await driver.executeScript('return Boolean(window.targetClicked)')).toBe(true)
    expect(await driver.executeScript('return Boolean(window.otherClicked)')).toBe(false)
  })

  it('does not count an already completed download as a cancellation', async () => {
    await show(message('other', 'other.bin', 'Canceled') + message('target', 'large.bin', 'Show in folder'))
    await expect(channel.cancelFileDownload({ messageId: 'target', parentMessageId: 'first' }, 300)).resolves.toBe(
      false
    )
  })

  it('does not accept another file’s canceled status when the target never acknowledges cancellation', async () => {
    await show(message('other', 'other.bin', 'Canceled') + message('target', 'large.bin', 'Downloading...'))
    await expect(channel.cancelFileDownload({ messageId: 'target', parentMessageId: 'first' }, 300)).resolves.toBe(
      false
    )
  })

  it('fails when a transfer finishes after the cancel click instead of acknowledging cancellation', async () => {
    await show(message('target', 'large.bin', 'Downloading...', "this.textContent = 'Show in folder'"))
    await expect(channel.cancelFileDownload({ messageId: 'target', parentMessageId: 'first' }, 300)).resolves.toBe(
      false
    )
  })

  it('starts only the requested pending download', async () => {
    await show(
      message('other', 'other.bin', 'Download file', 'window.otherClicked = true') +
        message('target', 'large.bin', 'Download file', "this.textContent = 'Downloading...'")
    )
    await channel.startFileDownload({ messageId: 'target', parentMessageId: 'first' })
    const target = await driver.findElement(By.css('[data-testid="messagesGroupContent-target"]'))
    await expect(channel.waitForFileDownloadStatus(FileDownloadStatus.DOWNLOADING, target, 300)).resolves.toBeDefined()
    expect(await driver.executeScript('return Boolean(window.otherClicked)')).toBe(false)
  })

  it('waits for a status on a replacement message element', async () => {
    await show(message('target', 'large.bin', 'Queued for download'))
    const original = await driver.findElement(By.css('[data-testid="messagesGroupContent-target"]'))
    await driver.executeScript(`setTimeout(() => {
      const old = document.querySelector('[data-testid="messagesGroupContent-target"]');
      const next = old.cloneNode(true);
      next.querySelector('p').textContent = 'Downloading...';
      old.replaceWith(next);
    }, 100)`)
    await expect(
      channel.waitForFileDownloadStatus(FileDownloadStatus.DOWNLOADING, original, 1_000)
    ).resolves.toBeDefined()
  })

  it('cancels the first active render even when completion would beat the next WebDriver command', async () => {
    await show(
      message('other', 'other.bin', 'Downloading...', 'window.otherClicked = true') +
        message('target', 'large.bin', 'Download file')
    )
    await driver.executeScript(`
      const ready = document.querySelector('[data-testid="messagesGroupContent-target"] p');
      ready.onclick = () => {
        const downloading = ready.cloneNode(true);
        downloading.textContent = 'Downloading...';
        downloading.onclick = () => {
          window.cancelClicked = true;
          downloading.textContent = 'Canceling...';
          setTimeout(() => { downloading.textContent = 'Canceled'; }, 50);
        };
        ready.replaceWith(downloading);
        setTimeout(() => {
          if (!window.cancelClicked) downloading.textContent = 'Show in folder';
        }, 0);
      };
    `)
    await expect(
      channel.startAndCancelFileDownload({ messageId: 'target', parentMessageId: 'first' }, 1_000)
    ).resolves.toBe(true)
    expect(await driver.executeScript('return Boolean(window.cancelClicked)')).toBe(true)
    expect(await driver.executeScript('return Boolean(window.otherClicked)')).toBe(false)
    expect(await driver.executeScript('return window["quiet-cancel-target"]')).toBeNull()
  })

  it('does not pass the armed cancel flow when the actual control never acknowledges the click', async () => {
    await show(
      message('target', 'large.bin', 'Download file', "this.textContent = 'Downloading...'; this.onclick = null")
    )
    await expect(
      channel.startAndCancelFileDownload({ messageId: 'target', parentMessageId: 'first' }, 300)
    ).resolves.toBe(false)
    expect(await driver.executeScript('return window["quiet-cancel-target"]')).toBeNull()
  })

  it('rejects completion without a rendered cancel control', async () => {
    await show(message('target', 'large.bin', 'Download file', "this.textContent = 'Show in folder'"))
    await expect(
      channel.startAndCancelFileDownload({ messageId: 'target', parentMessageId: 'first' }, 300)
    ).resolves.toBe(false)
  })
})
