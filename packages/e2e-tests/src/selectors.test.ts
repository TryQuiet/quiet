import { error, Session, WebDriver, WebElement, type ThenableWebDriver } from 'selenium-webdriver'
import { Command, Name } from 'selenium-webdriver/lib/command'
import { App, Channel, UserProfileContextMenu, DirectMessageList } from './selectors'
import { PhotoExt } from './enums'
import { UserListStatus } from './types'
import { waitForAppWindow } from './appWindowReady'

const advanceTime = async (milliseconds: number) => {
  // Let WebDriver's promise chain finish before advancing each poll timer.
  await new Promise<void>(resolve => setImmediate(resolve))
  for (let elapsed = 0; elapsed < milliseconds; elapsed += 500) {
    jest.advanceTimersByTime(Math.min(500, milliseconds - elapsed))
    await new Promise<void>(resolve => setImmediate(resolve))
  }
}

describe('App teardown', () => {
  it('can close an unopened client without starting a WebDriver session', async () => {
    const app = new App({ username: 'unopened-client' })
    const getDriver = jest.spyOn(app.buildSetup, 'getDriver')
    try {
      expect(await app.isSessionOpen()).toBe(false)
      await app.close()
      await app.close()
      expect(getDriver).not.toHaveBeenCalled()
      expect(app.thenableWebDriver).toBeUndefined()
    } finally {
      getDriver.mockRestore()
    }
  })
})

describe('App window handoff', () => {
  beforeEach(() => jest.useFakeTimers({ doNotFake: ['setImmediate'] }))
  afterEach(() => jest.useRealTimers())

  it.each([
    undefined,
    null,
    '',
    new error.WebDriverError(
      'unknown error: cannot determine loading status\nfrom target frame detached\n  (Session info: chrome=152.0.7977.78)'
    ),
  ])('selects the main window after ChromeDriver returns %s for a disappearing splash', async splashUrl => {
    let poll = 0
    let selected = ''
    // Replay the actual ChromeDriver handoff: GetUrl has no value after
    // Page.getFrameTree loses the splash target, despite a successful command.
    const execute = jest.fn(async (command: Command) => {
      switch (command.getName()) {
        case Name.GET_WINDOW_HANDLES:
          poll += 1
          return ['splash', 'main']
        case Name.SWITCH_TO_WINDOW:
          selected = String(command.getParameter('handle'))
          return
        case Name.GET_CURRENT_URL:
          if (selected === 'splash' && splashUrl instanceof Error) throw splashUrl
          return selected === 'splash'
            ? splashUrl
            : 'file:///C:/Quiet/resources/app.asar/dist/main/index.html?dataPort=1234#/main/channel/general'
        default:
          throw new Error(`Unexpected WebDriver command: ${command.getName()}`)
      }
    })
    const driver = new WebDriver(new Session('window-handoff', {}), { execute })
    const result = waitForAppWindow(driver).then(
      () => ({ ready: true }),
      failure => ({ failure })
    )
    await advanceTime(500)
    expect(await result).toEqual({ ready: true })
    expect(selected).toBe('main')
    expect(poll).toBe(1)
  })

  it('retries while the splash disappears and the main renderer is still blank', async () => {
    let poll = 0
    const execute = jest.fn(async (command: Command) => {
      if (command.getName() === Name.GET_WINDOW_HANDLES) {
        poll += 1
        return ['splash', 'main']
      }
      if (command.getName() === Name.SWITCH_TO_WINDOW) {
        if (command.getParameter('handle') === 'splash') throw new error.NoSuchWindowError('Splash was destroyed')
        return
      }
      if (command.getName() === Name.GET_CURRENT_URL) {
        return poll === 1 ? 'about:blank' : 'file:///Quiet/dist/main/index.html'
      }
      throw new Error(`Unexpected WebDriver command: ${command.getName()}`)
    })
    const driver = new WebDriver(new Session('loading-main-window', {}), { execute })
    const ready = waitForAppWindow(driver)
    await advanceTime(500)
    await expect(ready).resolves.toBeUndefined()
    expect(poll).toBe(2)
  })

  it('keeps the deadline when the main renderer never appears', async () => {
    const execute = jest.fn(async (command: Command) => {
      if (command.getName() === Name.GET_WINDOW_HANDLES) return ['blank']
      if (command.getName() === Name.SWITCH_TO_WINDOW) return
      if (command.getName() === Name.GET_CURRENT_URL) return 'about:blank'
      throw new Error(`Unexpected WebDriver command: ${command.getName()}`)
    })
    const driver = new WebDriver(new Session('missing-main-window', {}), { execute })
    const failure = waitForAppWindow(driver, 1000).catch(err => err)
    await advanceTime(1000)
    expect(await failure).toBeInstanceOf(error.TimeoutError)
    expect((await failure).message).toContain('Quiet main window did not finish loading')
  })

  it.each([
    new error.NoSuchSessionError('Browser session closed'),
    new error.WebDriverError('unknown error: cannot determine loading status\nfrom disconnected: renderer unavailable'),
  ])('propagates %s instead of retrying it as a splash transition', async failure => {
    const execute = jest.fn(async (command: Command) => {
      if (command.getName() === Name.GET_WINDOW_HANDLES) return ['splash']
      throw failure
    })
    const driver = new WebDriver(new Session('closed-window-session', {}), { execute })
    await expect(waitForAppWindow(driver)).rejects.toBe(failure)
  })
})

describe('Channel message polling', () => {
  let visibleMessageIds: string[]
  let channel: Channel
  let execute: jest.Mock

  beforeEach(() => {
    jest.useFakeTimers({ doNotFake: ['setImmediate'] })
    visibleMessageIds = []
    // Exercise Selenium's real wait/element conversion against a controlled
    // transport and clock. No Channel or WebDriver methods are replaced.
    execute = jest.fn(async (command: Command) => {
      if (command.getName() !== Name.FIND_ELEMENTS) {
        throw new Error(`Unexpected WebDriver command: ${command.getName()}`)
      }
      return visibleMessageIds.map(id => WebElement.buildId(id))
    })
    const driver = new WebDriver(new Session('message-polling', {}), { execute })
    channel = new Channel(driver as ThenableWebDriver, 'general')
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('keeps polling when no messages arrive during the first fifteen seconds', async () => {
    let settled = false
    const result = channel.getAtleastNumUserMessages('owner', 2)
    const outcome = result.then(
      value => ({ value }),
      failure => ({ failure })
    )
    void outcome.then(() => {
      settled = true
    })

    await advanceTime(16_000)
    expect(settled).toBe(false)

    // Initial replication can arrive in several batches. One group is not
    // enough, and an empty initial page must not terminate the outer wait.
    visibleMessageIds = ['first-message']
    await advanceTime(500)
    expect(settled).toBe(false)
    visibleMessageIds.push('second-message')
    await advanceTime(500)

    await expect(outcome).resolves.toHaveProperty('value')
    const messages = await result
    expect(await Promise.all(messages!.map(message => message.getId()))).toEqual(visibleMessageIds)
  })

  it('reports missing messages at the original sixty-second deadline', async () => {
    const result = channel.getAtleastNumUserMessages('owner', 2)
    const failure = result.catch(err => err)
    await advanceTime(60_000)
    const err = await failure
    expect(err).toBeInstanceOf(error.TimeoutError)
    expect(err.message).toContain('At least 2 messages for user owner')
    expect(err.message).toContain('60000ms')
  })

  it('propagates a lost browser session instead of retrying it as an empty page', async () => {
    const failure = new error.NoSuchSessionError('Browser session closed')
    execute.mockRejectedValueOnce(failure)
    await expect(channel.getAtleastNumUserMessages('owner', 2)).rejects.toBe(failure)
    expect(execute).toHaveBeenCalledTimes(1)
  })
})

describe('Channel readiness during a join', () => {
  beforeEach(() => jest.useFakeTimers({ doNotFake: ['setImmediate'] }))
  afterEach(() => jest.useRealTimers())

  it.each(['isReady', 'isOpen', 'isMessageInputReady'] as const)(
    '%s re-finds elements replaced by a render during initial synchronization',
    async method => {
      let replaced = false
      const execute = jest.fn(async (command: Command) => {
        if (command.getName() === Name.FIND_ELEMENTS) {
          return [WebElement.buildId(replaced ? 'current-element' : 'replaced-element')]
        }
        if (!replaced) {
          replaced = true
          throw new error.StaleElementReferenceError('Channel rendered again after lookup')
        }
        switch (command.getName()) {
          case Name.IS_ELEMENT_DISPLAYED:
          case Name.IS_ELEMENT_ENABLED:
            return true
          case Name.GET_ELEMENT_TEXT:
            return 'general'
          default:
            throw new Error(`Unexpected WebDriver command: ${command.getName()}`)
        }
      })
      const driver = new WebDriver(new Session('joining-channel', {}), { execute })
      const channel = new Channel(driver as ThenableWebDriver, 'general')
      const outcome = channel[method]().then(
        value => ({ value }),
        failure => ({ failure })
      )
      await advanceTime(1000)
      expect(await outcome).toEqual({ value: true })
      expect(replaced).toBe(true)
    }
  )

  it('still reports a lost browser session immediately', async () => {
    const failure = new error.NoSuchSessionError('Browser session closed')
    const execute = jest.fn().mockRejectedValue(failure)
    const driver = new WebDriver(new Session('closed-channel', {}), { execute })
    const channel = new Channel(driver as ThenableWebDriver, 'general')
    await expect(channel.isReady()).rejects.toBe(failure)
    expect(execute).toHaveBeenCalledTimes(1)
  })
})

describe('Direct-message peer presence', () => {
  let connected: boolean
  let users: DirectMessageList

  beforeEach(() => {
    jest.useFakeTimers({ doNotFake: ['setImmediate'] })
    connected = false
    const execute = jest.fn(async (command: Command) => {
      if (command.getName() === Name.FIND_ELEMENTS) {
        const locator = String(command.getParameter('value'))
        const badge = locator.includes('status-badge')
        expect(locator).toContain(badge ? 'dm-channel-profile-photo-status-badge' : '-dm-link-text')
        return [WebElement.buildId(badge ? 'presence-badge' : 'user-name')]
      }
      if (command.getName() === Name.FIND_CHILD_ELEMENT) {
        expect(command.getParameter('value')).toBe('ancestor::*[contains(@data-testid, "-dm-link")][1]')
        return WebElement.buildId('user-item')
      }
      if (command.getName() === Name.GET_ELEMENT_ATTRIBUTE) {
        expect(command.getParameter('name')).toBe('data-testid')
        return 'dm-channel-dm-link'
      }
      if (command.getName() === Name.IS_ELEMENT_DISPLAYED) {
        return JSON.stringify(command.getParameters()).includes('presence-badge') ? connected : true
      }
      throw new Error(`Unexpected WebDriver command: ${command.getName()}`)
    })
    const driver = new WebDriver(new Session('qss-presence', {}), { execute })
    users = new DirectMessageList(driver as ThenableWebDriver)
  })

  afterEach(() => jest.useRealTimers())

  it('waits for Tor when QSS joined before the direct peer connection is ready', async () => {
    let settled = false
    const result = users.getUser('owner', UserListStatus.ONLINE, 360_000)
    void result.then(() => {
      settled = true
    })
    // The observed cold Tor bootstrap outlasted the old four-minute check.
    await advanceTime(250_000)
    expect(settled).toBe(false)
    connected = true
    await advanceTime(500)
    expect((await result).status).toBe(UserListStatus.ONLINE)
  })

  it.each([undefined, 360_000])('reports offline when the %s deadline expires', async timeoutMs => {
    const result = users.getUser('owner', UserListStatus.ONLINE, timeoutMs)
    await advanceTime(timeoutMs ?? 240_000)
    expect((await result).status).toBe(UserListStatus.OFFLINE)
  })
})

describe('Profile photo polling', () => {
  let photoSrc: string | undefined
  let menu: UserProfileContextMenu
  let execute: jest.Mock

  beforeEach(() => {
    jest.useFakeTimers({ doNotFake: ['setImmediate'] })
    photoSrc = 'file:///uploads/previous-profile.jpg'
    // Use real Selenium waits and element commands. Only the browser transport
    // and clock are controlled, as in the channel polling regressions above.
    execute = jest.fn(async (command: Command) => {
      switch (command.getName()) {
        case Name.FIND_ELEMENTS:
          return photoSrc === undefined ? [] : [WebElement.buildId('profile-photo')]
        case Name.GET_ELEMENT_ATTRIBUTE:
          if (command.getParameter('name') !== 'src') {
            throw new Error(`Unexpected image attribute: ${command.getParameter('name')}`)
          }
          return photoSrc
        default:
          throw new Error(`Unexpected WebDriver command: ${command.getName()}`)
      }
    })
    const driver = new WebDriver(new Session('profile-photo-polling', {}), { execute })
    menu = new UserProfileContextMenu(driver as ThenableWebDriver)
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('waits for the uploaded PNG while the previous JPG remains visible', async () => {
    let settled = false
    const outcome = menu.getProfilePhotoSrc(PhotoExt.PNG).then(
      value => ({ value }),
      failure => ({ failure })
    )
    void outcome.then(() => {
      settled = true
    })

    // The actual GUI failure persisted the PNG roughly nine seconds after
    // upload; five immediate reads of the old JPG must not end this wait.
    await advanceTime(9_000)
    expect(settled).toBe(false)
    photoSrc = 'file:///uploads/new-profile.png'
    await advanceTime(500)

    await expect(outcome).resolves.toEqual({ value: photoSrc })
  })

  it.each(['previous JPG', 'missing image'])('keeps the original fifteen-second deadline for %s', async state => {
    if (state === 'missing image') photoSrc = undefined
    let settled = false
    const failure = menu.getProfilePhotoSrc(PhotoExt.PNG).catch(err => err)
    void failure.then(() => {
      settled = true
    })

    await advanceTime(14_500)
    expect(settled).toBe(false)
    await advanceTime(500)
    expect(settled).toBe(true)
    const err = await failure
    expect(err).toBeInstanceOf(error.TimeoutError)
    expect(err.message).toContain('Failed to find image with data type png within timeout')
    expect(err.message).toContain('15000ms')
  })

  it('propagates a lost browser session while waiting for a profile image', async () => {
    const failure = new error.NoSuchSessionError('Browser session closed')
    execute.mockRejectedValueOnce(failure)
    await expect(menu.getProfilePhotoSrc(PhotoExt.PNG)).rejects.toBe(failure)
    expect(execute).toHaveBeenCalledTimes(1)
  })
})
