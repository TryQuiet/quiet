/**
 * Bug repro: QSSService.close() does not clear `_reconnectQueueProcessor`,
 * the setInterval created in connect() at qss.service.ts:340. The interval
 * keeps firing every 60s after close, retaining a reference to the defunct
 * service instance.
 *
 * This test inspects the private field directly to catch the leak — no
 * filesystem-level timer count, no flakiness from libp2p/orbitdb background
 * tasks. It fails on develop and will pass once close() adds:
 *
 *   if (this._reconnectQueueProcessor != null) {
 *     clearInterval(this._reconnectQueueProcessor)
 *     this._reconnectQueueProcessor = undefined as unknown as NodeJS.Timeout
 *   }
 */
import { jest } from '@jest/globals'

import { bootQssHarness, type QssHarness } from '../harness'

jest.setTimeout(60_000)

describe('QSS bug: orphan reconnect timer survives close()', () => {
  let harness: QssHarness | undefined

  afterEach(async () => {
    if (harness != null) {
      await harness.shutdown().catch(() => undefined)
      harness = undefined
    }
  })

  it('close() leaves _reconnectQueueProcessor referencing a live setInterval', async () => {
    harness = await bootQssHarness({ username: 'leak-probe', teamName: 'leak-probe-team' })
    harness.primeCaptcha()
    await harness.qssService.connect(harness.qssEndpoint, true)

    // Connect populates the interval (see qss.service.ts:339-341).
    const svc = harness.qssService as unknown as { _reconnectQueueProcessor: NodeJS.Timeout | undefined }
    expect(svc._reconnectQueueProcessor).toBeDefined()

    // The interval object Node returns has internal state; once cleared, its
    // `_destroyed` flag flips. Capture it pre-close.
    const intervalRef = svc._reconnectQueueProcessor as unknown as { _destroyed?: boolean }
    expect(intervalRef._destroyed).toBeFalsy()

    harness.qssService.close()

    // After close(), the field should either be unset or the interval object
    // should be marked destroyed. Currently neither is true — the interval
    // is still alive and still referenced.
    const fieldAfter = svc._reconnectQueueProcessor
    const stillAlive = fieldAfter != null && !(fieldAfter as unknown as { _destroyed?: boolean })._destroyed
    expect(stillAlive).toBe(false)
  })
})
