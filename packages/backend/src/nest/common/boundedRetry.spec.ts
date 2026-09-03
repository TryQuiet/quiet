import { jest } from '@jest/globals'
import waitForExpect from 'wait-for-expect'

import { BoundedRetry } from './boundedRetry'

describe('BoundedRetry', () => {
  const flush = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  it('stops scheduling once a key has spent its attempt budget', async () => {
    const retry = new BoundedRetry('test', { maxAttempts: 2, baseDelayMs: 1 })
    const run = jest.fn(async () => {})

    expect(retry.schedule('peer', run)).toBe(true)
    await waitForExpect(() => expect(run).toHaveBeenCalledTimes(1))
    expect(retry.schedule('peer', run)).toBe(true)
    await waitForExpect(() => expect(run).toHaveBeenCalledTimes(2))

    // Budget spent: the caller is told, so it can surface a real failure rather
    // than stalling silently.
    expect(retry.schedule('peer', run)).toBe(false)
    await flush(20)
    expect(run).toHaveBeenCalledTimes(2)
  })

  it('backs off further on each attempt', async () => {
    const retry = new BoundedRetry('test', { maxAttempts: 3, baseDelayMs: 40 })
    const at: number[] = []
    const run = async () => {
      at.push(Date.now())
    }

    const start = Date.now()
    retry.schedule('peer', run)
    await waitForExpect(() => expect(at).toHaveLength(1))
    retry.schedule('peer', run)
    await waitForExpect(() => expect(at).toHaveLength(2), 2_000)

    expect(at[0] - start).toBeGreaterThanOrEqual(35)
    // Second delay doubles, so it lands later than the first relative to its own
    // scheduling point.
    expect(at[1] - at[0]).toBeGreaterThanOrEqual(70)
  })

  it('does not exceed the delay ceiling', async () => {
    const retry = new BoundedRetry('test', { maxAttempts: 5, baseDelayMs: 1_000, maxDelayMs: 30 })
    const run = jest.fn(async () => {})

    retry.schedule('peer', run)
    await waitForExpect(() => expect(run).toHaveBeenCalledTimes(1), 2_000)
  })

  it('gives a key its full budget back after a success', async () => {
    const retry = new BoundedRetry('test', { maxAttempts: 1, baseDelayMs: 1 })
    const run = jest.fn(async () => {})

    expect(retry.schedule('peer', run)).toBe(true)
    await waitForExpect(() => expect(run).toHaveBeenCalledTimes(1))
    expect(retry.schedule('peer', run)).toBe(false)

    retry.clear('peer')

    expect(retry.attemptsFor('peer')).toBe(0)
    expect(retry.schedule('peer', run)).toBe(true)
  })

  it('tracks budgets per key', async () => {
    const retry = new BoundedRetry('test', { maxAttempts: 1, baseDelayMs: 1 })
    const run = jest.fn(async () => {})

    expect(retry.schedule('peer-a', run)).toBe(true)
    expect(retry.schedule('peer-b', run)).toBe(true)
    expect(retry.schedule('peer-a', run)).toBe(false)
    expect(retry.schedule('peer-b', run)).toBe(false)
  })

  it('cancelPending drops queued work but keeps budgets, so a bound stays reachable', async () => {
    const retry = new BoundedRetry('test', { maxAttempts: 2, baseDelayMs: 50 })
    const run = jest.fn(async () => {})

    retry.schedule('peer', run)
    retry.cancelPending()
    await flush(120)
    expect(run).not.toHaveBeenCalled()
    // The attempt still counted: a caller that tears down and re-arms on every
    // failure must still run out of budget.
    expect(retry.attemptsFor('peer')).toBe(1)
    expect(retry.schedule('peer', run)).toBe(true)
    expect(retry.schedule('peer', run)).toBe(false)
  })

  it('clearAll cancels queued work and forgets budgets', async () => {
    const retry = new BoundedRetry('test', { maxAttempts: 1, baseDelayMs: 50 })
    const run = jest.fn(async () => {})

    retry.schedule('peer', run)
    retry.clearAll()
    await flush(120)

    expect(run).not.toHaveBeenCalled()
    expect(retry.attemptsFor('peer')).toBe(0)
    expect(retry.schedule('peer', run)).toBe(true)
  })

  it('logs and swallows a rejecting retry rather than surfacing an unhandled rejection', async () => {
    const retry = new BoundedRetry('test', { maxAttempts: 1, baseDelayMs: 1 })
    let ran = false
    retry.schedule('peer', async () => {
      ran = true
      throw new Error('still broken')
    })

    await waitForExpect(() => expect(ran).toBe(true))
    await flush(20)
  })

  // private#203 iteration-2 L-1: a rejecting attempt used to consume the budget
  // and then wait for some unrelated event to schedule again, so a transport
  // that was briefly unavailable stranded an otherwise retryable join.
  it('re-arms itself when an attempt rejects, until the budget is spent', async () => {
    const retry = new BoundedRetry('test', { maxAttempts: 3, baseDelayMs: 1 })
    let runs = 0
    retry.schedule('peer', async () => {
      runs += 1
      throw new Error('transport unavailable')
    })

    // One schedule call, three attempts, no external trigger.
    await waitForExpect(() => expect(runs).toBe(3), 3_000)
    await flush(50)
    expect(runs).toBe(3)
    expect(retry.schedule('peer', async () => {})).toBe(false)
  })

  it('stops re-arming as soon as an attempt succeeds', async () => {
    const retry = new BoundedRetry('test', { maxAttempts: 5, baseDelayMs: 1 })
    let runs = 0
    retry.schedule('peer', async () => {
      runs += 1
      if (runs < 2) {
        throw new Error('not yet')
      }
    })

    await waitForExpect(() => expect(runs).toBe(2), 3_000)
    await flush(50)
    expect(runs).toBe(2)
  })
})
