import { error, Session, WebDriver, WebElement, type ThenableWebDriver } from 'selenium-webdriver'
import { Command, Name } from 'selenium-webdriver/lib/command'
import { App, Channel, UserProfileContextMenu } from './selectors'
import { PhotoExt } from './enums'

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
