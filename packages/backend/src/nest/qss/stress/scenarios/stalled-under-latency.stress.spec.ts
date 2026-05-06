/**
 * PoC for stress-sweep bucket: 20× `qssSetup still false`.
 *
 * Smallest-seed repro from the aggressive sweep: seed=0, profile
 * `latency-3000ms-jitter-1500ms` — pure 3 s ± 1.5 s downstream latency
 * (1.5 s – 4.5 s effective per packet), no outages, no flaps. The auto-create
 * flow that should set `qssSetup = true` after `qssService.connect()`
 * never finishes within 60 s.
 *
 * Root cause (see PR description):
 *
 *   - `QSSClient.getCaptchaSiteKey` calls `sendMessage` with a hardcoded
 *     2 000 ms socket.io ack timeout (`qss.client.ts` line 285).
 *   - The 1.5 – 4.5 s downstream latency means the ack arrives after the
 *     timeout fires almost every time.
 *   - On timeout, `sendMessage` returns `undefined` (the catch block on
 *     line 269 swallows the socket.io timeout error), `getCaptchaSiteKey`
 *     returns `null`, `_requestCaptchaVerificationImpl` returns `false`,
 *     and `_createCommunityImpl` returns `false` ("Can't create community
 *     on QSS because captcha verification failed", line 689).
 *   - `createCommunity`'s outer try/catch at lines 654-662 quietly returns
 *     `false`. There is no retry: `QSS_HANDLE_SIGN_IN` is only re-emitted
 *     on `QSS_CONNECTED` and `COMMUNITY_ADDED`. Sustained latency does not
 *     drop the socket, so neither event fires again, and the service
 *     stays stuck.
 *
 * It's a real stuck-state bug — not a "needs more time" threshold. This
 * spec proves it three ways:
 *
 *   1. Within 60 s under sustained 3 s±1.5 s latency, qssSetup never reaches
 *      true (matches the bucket fingerprint exactly).
 *   2. Even with 180 s, qssSetup never reaches true — the auto-flow only
 *      attempts once and never retries (see `extending the wait` test).
 *   3. After waiting past the failure, removing the latency, and waiting
 *      another 60 s on a perfectly healthy proxy, qssSetup still doesn't
 *      flip — confirming the recovery is event-gated, not timed (see
 *      `clearing latency` test). The fourth test confirms a forced socket
 *      reconnect *does* recover, isolating the missing recovery path.
 *
 * The first test is the canonical PoC for this bucket: on 7.1.0 it
 * **fails** (red) — qssSetup stays false past 60 s. A fix that either
 * (a) widens the 2 s ack timeout in `getCaptchaSiteKey` to match the
 * default 5 s, or (b) reschedules `QSS_HANDLE_SIGN_IN` after a
 * `createCommunity` failure, would flip this test to green.
 */
import { jest } from '@jest/globals'
import waitForExpect from 'wait-for-expect'

import { bootQssHarness, type QssHarness } from '../harness'
import { Invariants, expectQssConnectedWithin } from '../invariants'

jest.setTimeout(360_000)

const LATENCY_TOXIC = {
  name: 'lat',
  type: 'latency',
  stream: 'downstream' as const,
  toxicity: 1.0,
  attributes: { latency: 3000, jitter: 1500 },
}

const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))

describe('QSS stress: fresh-create stalls under sustained downstream latency', () => {
  let harness: QssHarness
  let invariants: Invariants

  beforeEach(async () => {
    // Use a per-test proxy name + dynamic listen port so this scenario is
    // isolated from any other stress specs that may be running concurrently
    // (the default 'qss' proxy on :3013 is shared across the harness).
    const port = 3050 + Math.floor(Math.random() * 500)
    const proxyName = `qss-stalled-${process.pid}-${Date.now().toString(36)}`
    harness = await bootQssHarness({
      proxyName,
      proxyListen: `127.0.0.1:${port}`,
      qssEndpoint: `ws://127.0.0.1:${port}`,
    })
    invariants = new Invariants()
    invariants.start()
  })

  afterEach(async () => {
    invariants.stop()
    if (harness != null) {
      try {
        await harness.toxiproxy.clearToxics(harness.proxyName)
      } catch {
        // best-effort cleanup
      }
      await harness.shutdown()
    }
  })

  it(
    'PoC: under 3s ± 1.5s downstream latency, qssSetup must reach true within 60s (RED on 7.1.0)',
    async () => {
      // Prime captcha and apply chaos before connect — matches the fuzz
      // bucket exactly. The QSSService auto-flow fires on QSS_CONNECTED.
      harness.primeCaptcha()
      await harness.toxiproxy.addToxic(harness.proxyName, LATENCY_TOXIC)

      await harness.qssService.connect(harness.qssEndpoint, true)
      await expectQssConnectedWithin(harness, 30_000)
      // Pure downstream latency does not drop the websocket, so the
      // connection should remain up for the whole scenario.
      expect(harness.qssService.connected).toBe(true)

      // The full bucket window: 60 s. On 7.1.0 this assertion fails — the
      // 2 s ack timeout in `getCaptchaSiteKey` trips before the response
      // arrives, the auto-flow gives up after one attempt, and qssSetup
      // never flips.
      await waitForExpect(
        async () => {
          const status = await harness.qssService.getQssInitStatus()
          if (!status.qssSetup) throw new Error('qssSetup still false')
        },
        60_000,
        500
      )

      // Sanity: connection still up at the end.
      expect(harness.qssService.connected).toBe(true)
    },
    120_000
  )

  it(
    'diagnostic: extending the wait to 180s does NOT unstick qssSetup — confirms stuck-state, not slow',
    async () => {
      harness.primeCaptcha()
      await harness.toxiproxy.addToxic(harness.proxyName, LATENCY_TOXIC)

      await harness.qssService.connect(harness.qssEndpoint, true)
      await expectQssConnectedWithin(harness, 30_000)

      // We want to assert the negation: qssSetup is still false after 180 s.
      // wait-for-expect is built for the positive case, so we poll manually
      // and *fail loudly* if it ever flips (which would mean the bucket is
      // a threshold issue and this PoC's diagnosis is wrong).
      const deadline = Date.now() + 180_000
      let qssSetup = false
      while (Date.now() < deadline) {
        const status = await harness.qssService.getQssInitStatus()
        if (status.qssSetup) {
          qssSetup = true
          break
        }
        await sleep(1_000)
      }
      // If qssSetup eventually becomes true under sustained latency, the
      // bucket is a threshold issue — flag it explicitly.
      expect(qssSetup).toBe(false)
      expect(harness.qssService.connected).toBe(true)
    },
    240_000
  )

  it(
    'diagnostic: clearing latency mid-test does NOT unstick the auto-flow (no event re-fires)',
    async () => {
      harness.primeCaptcha()
      await harness.toxiproxy.addToxic(harness.proxyName, LATENCY_TOXIC)

      await harness.qssService.connect(harness.qssEndpoint, true)
      await expectQssConnectedWithin(harness, 30_000)

      // Let the auto-flow attempt and fail silently.
      await sleep(20_000)
      let status = await harness.qssService.getQssInitStatus()
      expect(status.qssSetup).toBe(false)

      // Remove the toxic — proxy is now perfectly healthy.
      await harness.toxiproxy.clearToxics(harness.proxyName)

      // Wait another 60 s on a healthy proxy. If the auto-flow had any
      // recovery mechanism (timed re-emission, periodic check, etc.) it
      // would fire here; the captcha would now succeed instantly and
      // qssSetup would flip. It doesn't — the only re-trigger is a socket
      // reconnect, which a healthy connection never causes.
      const deadline = Date.now() + 60_000
      while (Date.now() < deadline) {
        status = await harness.qssService.getQssInitStatus()
        if (status.qssSetup) break
        await sleep(500)
      }

      expect(harness.qssService.connected).toBe(true)
      expect(status.qssSetup).toBe(false)
    },
    180_000
  )

  it(
    'positive control: forcing a reconnect after clearing latency does recover qssSetup',
    async () => {
      // Demonstrates the *only* known recovery path is a socket
      // disconnect/reconnect cycle: that re-fires QSS_CONNECTED →
      // QSS_HANDLE_SIGN_IN → createCommunity, which on a healthy proxy with
      // a freshly primed captcha token now completes.
      harness.primeCaptcha()
      await harness.toxiproxy.addToxic(harness.proxyName, LATENCY_TOXIC)

      await harness.qssService.connect(harness.qssEndpoint, true)
      await expectQssConnectedWithin(harness, 30_000)

      await sleep(20_000)
      let status = await harness.qssService.getQssInitStatus()
      expect(status.qssSetup).toBe(false)

      // Clear chaos and force the socket to drop and reconnect.
      await harness.toxiproxy.clearToxics(harness.proxyName)
      await harness.toxiproxy.setEnabled(harness.proxyName, false)
      await sleep(500)
      await harness.toxiproxy.setEnabled(harness.proxyName, true)
      harness.primeCaptcha()

      await harness.qssService.connect(harness.qssEndpoint, true)
      await expectQssConnectedWithin(harness, 30_000)

      await waitForExpect(
        async () => {
          const s = await harness.qssService.getQssInitStatus()
          if (!s.qssSetup) throw new Error('qssSetup still false after reconnect')
        },
        30_000
      )
      status = await harness.qssService.getQssInitStatus()
      expect(status.qssSetup).toBe(true)
    },
    180_000
  )
})
