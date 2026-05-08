/**
 * Repro: a brief network flap during community creation leaves the create
 * stuck. Even after the network has been stable for >90 s the backend
 * never finishes — `qssSetup` stays false. End-user symptom: clicking
 * "Create community" on a slightly flaky link leaves the spinner up
 * forever; closing and reopening the app does not help.
 *
 * What the test does:
 *   1. Boot a backend behind a TCP proxy. Pre-stuff the captcha token (the
 *      backend-only equivalent of the user solving the hCaptcha modal in
 *      the renderer).
 *   2. Connect to QSS. The QSSService auto-flow runs:
 *        QSS_CONNECTED -> QSS_HANDLE_SIGN_IN ->
 *        createCommunity ->
 *          GET_CAPTCHA_SITE_KEY ack
 *          VERIFY_CAPTCHA       ack
 *          GEN_PUB_KEYS         ack
 *          CREATE_COMMUNITY     ack   <-- writes qssSetup=true
 *   3. Drop and re-enable the proxy at 5 Hz for 4 s while the create runs.
 *   4. Then leave the proxy healthy and wait. We give the auto-flow up to
 *      90 s with the link stable to converge. It does not.
 *
 * What's actually wrong (full walkthrough in the PR description):
 *   - VERIFY_CAPTCHA succeeds on socket A. hCaptcha tokens are single-use,
 *     so qss.client.ts:319 clears the renderer-side cached token
 *     immediately on the first success.
 *   - The next message (GEN_PUB_KEYS or CREATE_COMMUNITY) is in flight
 *     when the proxy drops. socket.io's `emitWithAck` rejects with
 *     "socket has been disconnected".
 *   - QSSClient.sendMessage swallows that rejection (qss.client.ts:269-271)
 *     and returns `undefined`, identical to how it handled the timeout in
 *     bug-#11. _createCommunityImpl reads `null` and bails out.
 *   - On the next reconnect, `captchaVerified` is false (cleared by the
 *     disconnect handler at qss.client.ts:196) so the auto-flow calls
 *     `requestCaptchaVerification` again. The cached token is gone, so
 *     CaptchaService.requestHcaptchaToken asks the renderer (or in this
 *     test, nobody) for a new one. Without a second user-side captcha
 *     solve, the create never finishes.
 *
 * The test passes if `qssSetup` flips to true within the time budget. On
 * stock 7.1.0 it stays false; the failure message includes
 * connected/captchaVerified/qssEnabled so the maintainer can see the
 * service is otherwise healthy — only the create has stalled.
 */
import { jest } from '@jest/globals'

import { bootQssHarness, pickFreePort, proxyId, type QssHarness } from '../harness'
import { Invariants, expectQssConnectedWithin } from '../invariants'

jest.setTimeout(300_000)

const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))

const FLAP_CYCLE_MS = 200
const FLAP_TOTAL_MS = 4_000
const POST_FLAP_DEADLINE_MS = 90_000

async function pollQssSetup(harness: QssHarness, deadlineMs: number): Promise<boolean> {
  const deadline = Date.now() + deadlineMs
  while (Date.now() < deadline) {
    const status = await harness.qssService.getQssInitStatus()
    if (status.qssSetup) return true
    await sleep(250)
  }
  return false
}

async function runFlap(harness: QssHarness, totalMs: number, cycleMs: number): Promise<void> {
  const start = Date.now()
  let enabled = true
  while (Date.now() - start < totalMs) {
    enabled = !enabled
    await harness.toxiproxy.setEnabled(harness.proxyName, enabled).catch(() => undefined)
    await sleep(cycleMs)
  }
  // Always finish enabled.
  await harness.toxiproxy.setEnabled(harness.proxyName, true).catch(() => undefined)
}

describe('QSS create community survives a brief network flap', () => {
  let harness: QssHarness
  let invariants: Invariants

  beforeEach(async () => {
    // Allocate a private proxy listener for this test so we don't fight
    // anything else running concurrently against the shared default proxy.
    const proxyName = proxyId('qss-flap')
    const port = await pickFreePort()
    const proxyListen = `127.0.0.1:${port}`
    const qssEndpoint = `ws://${proxyListen}`

    harness = await bootQssHarness({ proxyName, proxyListen, qssEndpoint })
    invariants = new Invariants()
    invariants.start()
  })

  afterEach(async () => {
    if (harness != null) {
      await harness.toxiproxy.deleteProxy(harness.proxyName).catch(() => undefined)
      await harness.shutdown()
    }
  })

  it('finishes createCommunity after a 4 s connectivity flap', async () => {
    // Pre-stuff the captcha (renderer-side surrogate). After this call the
    // backend's GET_CAPTCHA_SITE_KEY / VERIFY_CAPTCHA / GEN_PUB_KEYS /
    // CREATE_COMMUNITY round-trips run for real over the wire to QSS.
    harness.primeCaptcha()

    // Open the websocket to QSS. This kicks off the auto-flow:
    // QSS_CONNECTED -> QSS_HANDLE_SIGN_IN -> createCommunity.
    await harness.qssService.connect(harness.qssEndpoint, true)
    await expectQssConnectedWithin(harness, 30_000)

    // Disrupt the link for 4 seconds. The auto-flow is partway through
    // the captcha + create exchange. The underlying socket is closed and
    // reopened five times per second.
    await runFlap(harness, FLAP_TOTAL_MS, FLAP_CYCLE_MS)

    // Drive a single explicit connect once the link is stable so we don't
    // have to wait the (potentially backed-off) reconnect timer.
    await harness.qssService.connect(harness.qssEndpoint, true).catch(() => undefined)

    // Wait up to 90 s for qssSetup to flip with the link healthy. On
    // stock 7.1.0 this never happens.
    const setupOk = await pollQssSetup(harness, POST_FLAP_DEADLINE_MS)

    if (!setupOk) {
      const status = await harness.qssService.getQssInitStatus()
      const connected = harness.qssService.connected
      const captchaVerified = harness.qssClient.captchaVerified
      throw new Error(
        `qssSetup still false after ${(FLAP_TOTAL_MS + POST_FLAP_DEADLINE_MS) / 1000} s ` +
          `(${POST_FLAP_DEADLINE_MS / 1000} s of which had a fully healthy link).\n` +
          `  qssService.connected=${connected}\n` +
          `  qssClient.captchaVerified=${captchaVerified}\n` +
          `  qssEnabled=${status.qssEnabled}\n` +
          `\n` +
          `  The websocket is up and the captcha state is whatever the auto-flow last left it in,\n` +
          `  but createCommunity has bailed out and there is no path for the backend alone\n` +
          `  to recover (the renderer-side captcha token was consumed by the first VERIFY_CAPTCHA\n` +
          `  ack and there is no replenishment without a user solving the captcha again).\n` +
          `  See PR description for the full code-path walkthrough.`
      )
    }

    expect(setupOk).toBe(true)
    Invariants.expectClean(invariants.stop())
  })
})
