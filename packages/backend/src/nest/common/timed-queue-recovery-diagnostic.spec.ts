import { jest } from '@jest/globals'
import { TimedQueue } from './timed-queue'

// Opt-in reproduction of a stale retry observed during the #3590 app runs.
const diagnostic = process.env.REPRO_3590 === 'true' ? describe : describe.skip

diagnostic('Admission recovery queue cancellation #3590', () => {
  it('discards a retry queued while stopped before starting a replacement admission', async () => {
    jest.useFakeTimers()
    const queue = new TimedQueue({ start: false, baseDelayMs: 8_000, fuzzFactor: 0 })
    const staleDial = jest.fn<() => Promise<void>>().mockResolvedValue(undefined)
    const freshDial = jest.fn<() => Promise<void>>().mockResolvedValue(undefined)
    try {
      // An old libp2p dial rejects during shutdown and enqueues a delayed retry.
      // Its enqueue promise remains pending while fastq is paused.
      void queue.enqueue({ key: 'owner', task: staleDial })
      queue.stop(true)
      expect(queue.hasTask('owner')).toBe(false)

      queue.start()
      await queue.enqueue({ key: 'owner', task: freshDial, delayMs: 0 })
      await jest.advanceTimersByTimeAsync(8_000)

      expect(staleDial).not.toHaveBeenCalled()
      expect(freshDial).toHaveBeenCalledTimes(1)
    } finally {
      queue.stop(true)
      jest.useRealTimers()
    }
  })
})
