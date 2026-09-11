import fs from 'fs'
import os from 'os'
import path from 'path'
import { By, until } from 'selenium-webdriver'
import { App, Channel, CreateCommunityModal, JoinCommunityModal, RegisterUsernameModal } from '../selectors'

interface HostHelperCall {
  args: string[]
  preload?: string
  libraryPath?: string
  sentinel?: string
}

const describeLinux = process.platform === 'linux' ? describe : describe.skip

describeLinux('One client AppImage host integration', () => {
  let app: App
  let fixtureDirectory: string
  let fixtureHome: string
  let capture: string

  const readCalls = (): HostHelperCall[] =>
    fs.existsSync(capture)
      ? fs
          .readFileSync(capture, 'utf8')
          .trim()
          .split('\n')
          .filter(Boolean)
          .map(line => JSON.parse(line))
      : []

  const expectCleanEnvironment = (calls: HostHelperCall[]) => {
    for (const call of calls) {
      expect(call.preload).toBeUndefined()
      expect(call.libraryPath).toBeUndefined()
      expect(call.sentinel).toBe('preserved')
    }
  }

  beforeAll(async () => {
    fixtureDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'quiet-appimage-e2e-'))
    fixtureHome = path.join(fixtureDirectory, 'home')
    const helperDirectory = path.join(fixtureDirectory, 'bin')
    capture = path.join(fixtureDirectory, 'host-helpers.jsonl')
    fs.mkdirSync(helperDirectory)
    fs.mkdirSync(path.join(fixtureHome, '.local/share/applications'), { recursive: true })
    fs.mkdirSync(path.join(fixtureHome, '.config'))
    fs.mkdirSync(path.join(fixtureHome, '.cache'))
    fs.writeFileSync(
      path.join(fixtureHome, '.local/share/applications/quiet.desktop'),
      '[Desktop Entry]\nExec=Quiet %U\n'
    )
    for (const command of ['xdg-open', 'xdg-mime', 'xdg-settings']) {
      fs.writeFileSync(
        path.join(helperDirectory, command),
        '#!/bin/sh\nexec "$QUIET_E2E_NODE" "$QUIET_E2E_HELPER_RECORDER" "${0##*/}" "$@"\n',
        { mode: 0o755 }
      )
    }

    app = new App({
      username: 'appimage-host',
      environment: {
        HOME: fixtureHome,
        APPDATA: path.join(fixtureHome, '.config'),
        XDG_CONFIG_HOME: path.join(fixtureHome, '.config'),
        XDG_CACHE_HOME: path.join(fixtureHome, '.cache'),
        PATH: `${helperDirectory}:${process.env.PATH}`,
        LD_PRELOAD: '',
        LD_LIBRARY_PATH: '/appimage-libraries-must-not-reach-host',
        QUIET_E2E_NODE: process.execPath,
        QUIET_E2E_HELPER_RECORDER: path.join(__dirname, 'resources/recordHostHelper.cjs'),
        QUIET_E2E_HELPER_LOG: capture,
        QUIET_E2E_HOST_SENTINEL: 'preserved',
      },
    })
    await app.open()
  }, 90_000)

  afterAll(async () => {
    try {
      if (app) {
        await app.close()
        await app.cleanup()
      }
    } finally {
      if (fixtureDirectory) fs.rmdirSync(fixtureDirectory, { recursive: true })
    }
  }, 60_000)

  it('registers the Quiet URL scheme using clean host helpers at startup', async () => {
    await app.driver.wait(() => readCalls().length >= 3, 10_000, 'Startup XDG registration was not captured')
    const calls = readCalls()
    // Electron also performs its own protocol registration. Assert Quiet's
    // required commands and check the environment of every captured call.
    expect(calls.map(call => call.args)).toEqual(
      expect.arrayContaining([
        ['xdg-mime', 'default', 'quiet.desktop', 'x-scheme-handler/quiet'],
        ['xdg-mime', 'query', 'default', 'x-scheme-handler/quiet'],
        ['xdg-settings', 'set', 'default-url-scheme-handler', 'quiet', 'quiet.desktop'],
      ])
    )
    expectCleanEnvironment(calls)
    const appImage = await app.driver.executeScript<string>('return process.env.APPIMAGE')
    expect(appImage).toMatch(/\.AppImage$/)
    expect(fs.readFileSync(path.join(fixtureHome, '.local/share/applications/quiet.desktop'), 'utf8')).toContain(
      `Exec=${appImage} %U`
    )
    expect(app.buildSetup.dataDirPath).toBe(path.join(fixtureHome, '.config', app.name!))
  })

  it('opens message links through clean host helpers despite inherited renderer loader settings', async () => {
    const join = new JoinCommunityModal(app.driver)
    await join.isReady()
    await join.switchToCreateCommunity()
    const create = new CreateCommunityModal(app.driver)
    await create.isReady()
    await create.typeCommunityName('host-helper-test')
    await create.submit()
    const username = new RegisterUsernameModal(app.driver)
    await username.isReady()
    await username.typeUsername('owner')
    await username.submit()
    const channel = new Channel(app.driver, 'general')
    await channel.isReady()
    await channel.isMessageInputReady()

    // Reproduce a renderer inherited from an already-started AppImage zygote.
    await app.driver.executeScript(`
      process.env.LD_PRELOAD = '/renderer-preload-must-not-reach-host.so'
      process.env.LD_LIBRARY_PATH = '/renderer-libraries-must-not-reach-host'
    `)
    const urls = [
      'https://tryquiet.org/#Downloads',
      'https://github.com/TryQuiet/quiet/wiki/Privacy-Policy',
      'https://example.com/chat?message=hello%20world&reply=1',
    ]
    for (const url of urls) {
      const { messageId } = await channel.sendMessage(url, 'owner')
      const message = await channel.waitForMessageContentById(messageId)
      const link = await message.findElement(By.css('a'))
      await app.driver.wait(until.elementIsVisible(link), 10_000)
      await link.click()
      await app.driver.wait(
        () => readCalls().some(call => call.args[0] === 'xdg-open' && call.args[1] === url),
        10_000,
        `Host helper did not receive clicked URL: ${url}`
      )
    }
    const calls = readCalls().filter(call => call.args[0] === 'xdg-open')
    expect(calls.map(call => call.args[1])).toEqual(urls)
    expectCleanEnvironment(calls)
  }, 90_000)
})
