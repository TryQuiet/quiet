import { jest } from '@jest/globals'

import { TimedQueue } from './timed-queue'

describe('TimedQueue', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.restoreAllMocks()
  })

  it('retries a failed immediate task at the base delay', async () => {
    const task = jest
      .fn<() => Promise<void>>()
      .mockRejectedValueOnce(new Error('first failure') as never)
      .mockResolvedValueOnce(undefined as never)
    const queue = new TimedQueue({
      start: true,
      baseDelayMs: 100,
      backoffFactor: 2,
      fuzzFactor: 0,
      maxDelayMs: 250,
    })

    await queue.enqueue({ key: 'peer', delayMs: 0, task })
    await jest.advanceTimersByTimeAsync(0)

    expect(task).toHaveBeenCalledTimes(1)
    expect(queue.hasTask('peer')).toBe(true)

    await jest.advanceTimersByTimeAsync(99)
    expect(task).toHaveBeenCalledTimes(1)

    await jest.advanceTimersByTimeAsync(1)
    expect(task).toHaveBeenCalledTimes(2)
    expect(queue.hasTask('peer')).toBe(false)
  })

  it('backs off failed tasks and caps retries at the max delay', async () => {
    const task = jest
      .fn<() => Promise<void>>()
      .mockRejectedValueOnce(new Error('first failure') as never)
      .mockRejectedValueOnce(new Error('second failure') as never)
      .mockRejectedValueOnce(new Error('third failure') as never)
      .mockResolvedValueOnce(undefined as never)
    const queue = new TimedQueue({
      start: true,
      baseDelayMs: 100,
      backoffFactor: 2,
      fuzzFactor: 0,
      maxDelayMs: 250,
    })

    await queue.enqueue({ key: 'peer', delayMs: 0, task })

    await jest.advanceTimersByTimeAsync(0)
    expect(task).toHaveBeenCalledTimes(1)

    await jest.advanceTimersByTimeAsync(99)
    expect(task).toHaveBeenCalledTimes(1)

    await jest.advanceTimersByTimeAsync(1)
    expect(task).toHaveBeenCalledTimes(2)

    await jest.advanceTimersByTimeAsync(199)
    expect(task).toHaveBeenCalledTimes(2)

    await jest.advanceTimersByTimeAsync(1)
    expect(task).toHaveBeenCalledTimes(3)

    await jest.advanceTimersByTimeAsync(249)
    expect(task).toHaveBeenCalledTimes(3)

    await jest.advanceTimersByTimeAsync(1)
    expect(task).toHaveBeenCalledTimes(4)
  })

  it('cancels in-process timers and allows the same key to be enqueued again', async () => {
    const task = jest.fn<() => Promise<void>>().mockResolvedValue(undefined as never)
    const queue = new TimedQueue({
      start: true,
      baseDelayMs: 100,
      fuzzFactor: 0,
    })

    await queue.enqueue({ key: 'peer', delayMs: 100, task })
    expect(queue.hasTask('peer')).toBe(true)

    queue.stop(true)
    expect(queue.hasTask('peer')).toBe(false)

    await jest.advanceTimersByTimeAsync(100)
    expect(task).not.toHaveBeenCalled()

    queue.start()
    await queue.enqueue({ key: 'peer', delayMs: 0, task })
    await jest.advanceTimersByTimeAsync(0)

    expect(task).toHaveBeenCalledTimes(1)
    expect(queue.hasTask('peer')).toBe(false)
  })

  it('clears task state after successful completion and cancellation', async () => {
    const task = jest.fn<() => Promise<void>>().mockResolvedValue(undefined as never)
    const queue = new TimedQueue({
      start: true,
      baseDelayMs: 100,
      fuzzFactor: 0,
    })

    await queue.enqueue({ key: 'successful-peer', delayMs: 0, task })
    await jest.advanceTimersByTimeAsync(0)
    expect(queue.hasTask('successful-peer')).toBe(false)

    await queue.enqueue({ key: 'canceled-peer', delayMs: 100, task })
    expect(queue.hasTask('canceled-peer')).toBe(true)

    queue.stop(true)
    expect(queue.hasTask('canceled-peer')).toBe(false)
  })

  it('does not requeue a running task that fails after cancellation', async () => {
    let rejectTask: (error: Error) => void = () => {}
    const task = jest.fn<() => Promise<void>>(
      () =>
        new Promise((_resolve, reject) => {
          rejectTask = reject
        })
    )
    const queue = new TimedQueue({
      start: true,
      baseDelayMs: 100,
      backoffFactor: 2,
      fuzzFactor: 0,
    })

    await queue.enqueue({ key: 'peer', delayMs: 0, task })
    await jest.advanceTimersByTimeAsync(0)
    expect(task).toHaveBeenCalledTimes(1)

    queue.stop(true)
    rejectTask(new Error('failure after cancellation'))
    await Promise.resolve()

    expect(queue.hasTask('peer')).toBe(false)

    queue.start()
    await jest.advanceTimersByTimeAsync(100)
    expect(task).toHaveBeenCalledTimes(1)
  })
})
