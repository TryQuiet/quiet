import { error, Session, WebDriver, WebElement, type ThenableWebDriver } from 'selenium-webdriver'
import { Command, Name } from 'selenium-webdriver/lib/command'
import { Channel } from './selectors'

describe('Channel message polling', () => {
  let visibleMessageIds: string[]
  let channel: Channel
  let execute: jest.Mock

  const advanceTime = async (milliseconds: number) => {
    // Let WebDriver's promise chain finish before advancing each poll timer.
    await new Promise<void>(resolve => setImmediate(resolve))
    for (let elapsed = 0; elapsed < milliseconds; elapsed += 500) {
      jest.advanceTimersByTime(Math.min(500, milliseconds - elapsed))
      await new Promise<void>(resolve => setImmediate(resolve))
    }
  }

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
