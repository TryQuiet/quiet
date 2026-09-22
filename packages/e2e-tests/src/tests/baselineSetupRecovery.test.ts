import { once } from 'events'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { Builder, error, type ThenableWebDriver, type WebDriver } from 'selenium-webdriver'
import { Options, ServiceBuilder } from 'selenium-webdriver/chrome'
import { completeBaselineJoin } from '../baselineSetupRecovery'
import { App, JoiningLoadingPanel } from '../selectors'

jest.setTimeout(30_000)

const releasedBaseline = { version: '11.0.0', isPlaceholder: false }
const publicationFailure =
  '2026-09-21T19:42:32.240Z ERROR baseline backend:Tor Failed to publish registered hidden service Error: Timeout while waiting for Tor HS_DESC event\n'
const describeLinux = process.platform === 'linux' ? describe : describe.skip

describeLinux('released baseline setup recovery', () => {
  let driver: WebDriver
  let app: App
  let directory: string
  let artifacts: string
  let profile: string
  let close: jest.SpyInstance
  let open: jest.SpyInstance
  const showPanel = async () =>
    driver.get('data:text/html,<div data-testid="joiningPanelComponent">Spawning hidden service for community</div>')
  const waitForJoin = () => new JoiningLoadingPanel(app.driver).waitForJoinToComplete(100, 100)

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

  beforeEach(async () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'quiet-baseline-recovery-'))
    const childScript = path.join(directory, 'driver.cjs')
    // Exercise BuildSetup's actual child-output capture, not an invented marker
    // API. The real browser supplies visibility, timeout and screenshot behavior.
    fs.writeFileSync(childScript, "process.stdin.on('data', data => process.stderr.write(data))")
    app = new App({ chromeDriverPath: childScript, environment: { APPDATA: directory } })
    await app.buildSetup.createChromeDriver()
    app.thenableWebDriver = driver as ThenableWebDriver
    fs.mkdirSync(app.buildSetup.dataDirPath, { recursive: true })
    profile = path.join(app.buildSetup.dataDirPath, 'persisted-community.json')
    fs.writeFileSync(profile, JSON.stringify({ community: 'old-community', username: 'bob', version: '11.0.0' }))
    artifacts = path.resolve('back-compat-artifacts', `${app.name}-publication-timeout`)
    close = jest.spyOn(app, 'close').mockImplementation(async () => {
      await driver.get('about:blank')
    })
    open = jest.spyOn(app, 'open').mockImplementation(async () => {
      expect(JSON.parse(fs.readFileSync(profile, 'utf8')).community).toBe('old-community')
      await driver.get('data:text/html,<h1>general</h1>')
    })
    await showPanel()
  })

  afterEach(async () => {
    if (app?.buildSetup.child?.exitCode === null) {
      const exited = once(app.buildSetup.child, 'exit')
      app.buildSetup.child.kill()
      await exited
    }
    jest.restoreAllMocks()
    if (directory && fs.existsSync(directory)) fs.rmdirSync(directory, { recursive: true })
    if (artifacts && fs.existsSync(artifacts)) fs.rmdirSync(artifacts, { recursive: true })
  })

  afterAll(async () => driver?.quit())

  async function emitPublicationFailure() {
    app.buildSetup.child!.stdin.write(publicationFailure)
    await app.buildSetup.waitForProcessOutput(publicationFailure, 2_000)
  }

  it('reopens only the failed released setup, preserving its profile and real screenshot/output evidence', async () => {
    await emitPublicationFailure()
    // This is the original wait used by the upgrade test: the real rendered
    // failure remains stuck until recovery reopens the same persisted profile.
    await expect(waitForJoin()).rejects.toThrow("Loading panel element didn't disappear")
    await completeBaselineJoin(app, releasedBaseline, waitForJoin)
    expect(close).toHaveBeenCalledTimes(1)
    expect(close).toHaveBeenCalledWith({ forceSaveState: true })
    expect(open).toHaveBeenCalledTimes(1)
    expect(fs.readFileSync(path.join(artifacts, 'process.log'), 'utf8')).toContain(publicationFailure)
    expect(fs.readFileSync(path.join(artifacts, 'setup.png')).subarray(1, 4).toString()).toBe('PNG')
    expect(fs.readFileSync(path.join(artifacts, 'failure.txt'), 'utf8')).toContain(
      "Loading panel element didn't disappear"
    )
    expect(fs.statSync(artifacts).mode & 0o777).toBe(0o700)
    for (const name of ['process.log', 'failure.txt', 'setup.png']) {
      expect(fs.statSync(path.join(artifacts, name)).mode & 0o777).toBe(0o600)
    }
    expect(JSON.parse(fs.readFileSync(profile, 'utf8')).username).toBe('bob')
    expect(app.buildSetup.hasProcessOutput(publicationFailure)).toBe(false)
  })

  it.each([
    { version: '11.0.0', isPlaceholder: true },
    { version: '11.1.0', isPlaceholder: false },
  ])('does not recover a current or unrecognized baseline: %j', async baseline => {
    await emitPublicationFailure()
    await expect(completeBaselineJoin(app, baseline, waitForJoin)).rejects.toThrow(error.TimeoutError)
    expect(close).not.toHaveBeenCalled()
    expect(open).not.toHaveBeenCalled()
  })

  it('does not reopen a stalled setup without the exact old publication failure', async () => {
    app.buildSetup.child!.stdin.write('Error: Timeout while waiting for Tor bootstrap\n')
    await app.buildSetup.waitForProcessOutput('Tor bootstrap', 2_000)
    await expect(completeBaselineJoin(app, releasedBaseline, waitForJoin)).rejects.toThrow(error.TimeoutError)
    expect(open).not.toHaveBeenCalled()
  })

  it('propagates real session failures even when the old publication failure was logged', async () => {
    await emitPublicationFailure()
    const extraDriver = new (require('selenium-webdriver').WebDriver)(driver.getSession(), {
      execute: async () => {
        throw new error.NoSuchSessionError('browser crashed')
      },
    })
    app.thenableWebDriver = extraDriver
    await expect(completeBaselineJoin(app, releasedBaseline, waitForJoin)).rejects.toThrow('browser crashed')
    expect(open).not.toHaveBeenCalled()
  })

  it('propagates a second publication failure without retrying again', async () => {
    await emitPublicationFailure()
    open.mockImplementation(async () => {
      await showPanel()
      await emitPublicationFailure()
    })
    await expect(completeBaselineJoin(app, releasedBaseline, waitForJoin)).rejects.toThrow(error.TimeoutError)
    expect(close).toHaveBeenCalledTimes(1)
    expect(open).toHaveBeenCalledTimes(1)
  })
})
