import { CreateCommunityRetry } from './create-community-retry'

describe('CreateCommunityRetry', () => {
  const makeClock = (start = 1_000_000) => {
    let t = start
    return { now: () => t, advance: (ms: number) => (t += ms) }
  }

  it('allows the first attempt immediately', () => {
    const retry = new CreateCommunityRetry(5_000, 300_000, makeClock().now)
    expect(retry.canAttempt()).toBe(true)
    expect(retry.msUntilAllowed()).toBe(0)
    expect(retry.attempts).toBe(0)
  })

  it('doubles the delay after each failure and caps it', () => {
    const clock = makeClock()
    const retry = new CreateCommunityRetry(5_000, 40_000, clock.now)
    expect(retry.recordFailure()).toBe(5_000)
    expect(retry.canAttempt()).toBe(false)
    expect(retry.msUntilAllowed()).toBe(5_000)
    clock.advance(5_000)
    expect(retry.canAttempt()).toBe(true)
    expect(retry.recordFailure()).toBe(10_000)
    expect(retry.recordFailure()).toBe(20_000)
    expect(retry.recordFailure()).toBe(40_000)
    expect(retry.recordFailure()).toBe(40_000)
    expect(retry.attempts).toBe(5)
  })

  it('resets after a success or a fresh user action', () => {
    const clock = makeClock()
    const retry = new CreateCommunityRetry(5_000, 40_000, clock.now)
    retry.recordFailure()
    retry.recordFailure()
    expect(retry.canAttempt()).toBe(false)
    retry.reset()
    expect(retry.canAttempt()).toBe(true)
    expect(retry.attempts).toBe(0)
    expect(retry.recordFailure()).toBe(5_000)
  })
})
