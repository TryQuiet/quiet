/**
 * Per-message wire-fault scenarios for the QSS stress harness.
 *
 * These tests pin chaos to a single specific QSS round-trip — the proxy is
 * dropped while the ack of one named message is in flight, then brought
 * back, and the harness asserts the service recovers.
 *
 * Four canonical messages are exercised (one per `it` block):
 *
 *   - GEN_PUB_KEYS              — first request after captcha succeeds, used to
 *                                 derive the team keyset before CREATE_COMMUNITY.
 *   - CREATE_COMMUNITY          — the registration write itself.
 *   - SIGN_IN_COMMUNITY         — re-attach an already-registered community.
 *   - VERIFY_CAPTCHA            — captcha-token exchange that gates create.
 *
 * The mechanism is documented in `precise-faults.ts`. Briefly: we monkey-patch
 * `qssClient.sendMessage` with `installWireFaultHooks` so a `before-*` /
 * `after-*-sent` callback fires synchronously around the matching `socket.emit`
 * (or the `emitWithAck`-bounded await). The fault action schedules a brief
 * proxy outage *after* the emit so it precisely overlaps the in-flight ack.
 *
 * Recovery contract: even when the in-flight ack is lost, the QSS service
 * should reconnect and the auto-flow should converge — qssSetup ends up true,
 * the auth conn reaches CONNECTED/JOINED. We don't assert anything about
 * intermediate failures: those are expected.
 */
import { jest } from '@jest/globals'
import waitForExpect from 'wait-for-expect'

import { bootQssHarness, type QssHarness } from '../harness'
import { Invariants, expectQssConnectedWithin } from '../invariants'
import { QSSAuthConnStatus } from '../../qss.const'
import { JoinStatus } from '../../../libp2p/libp2p.auth'
import { installWireFaultHooks, oneShot, scheduleOutageAfter, type WireFault } from '../precise-faults'

jest.setTimeout(240_000)

const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Drive the create-community auto-flow under a wire-fault profile.
 * Returns once the auth conn reaches CONNECTED / JOINED, or throws if it
 * doesn't within the recovery window.
 */
async function runFreshCreateUnderWireFaults(harness: QssHarness, wireFaults: WireFault[]): Promise<void> {
  // Prime captcha before connect so the auto-create path has it cached.
  harness.primeCaptcha()

  const restore = installWireFaultHooks(harness, wireFaults)
  try {
    await harness.qssService.connect(harness.qssEndpoint, true)
    await expectQssConnectedWithin(harness, 30_000)

    const sigchain = harness.sigchainService.activeChain
    const teamId = sigchain.team!.id

    // Wait through any wire-fault disturbance for setup to converge.
    // 90 s gives plenty of slack for one outage (~2 s) plus reconnect
    // (~2-15 s of backoff inside QSSService) plus retry of the failed
    // round-trip.
    await waitForExpect(async () => {
      const status = await harness.qssService.getQssInitStatus()
      if (!status.qssSetup) throw new Error('qssSetup still false')
    }, 90_000)

    await waitForExpect(() => {
      const conn = harness.qssAuthConnManager.getConnection(teamId)
      if (conn == null) throw new Error('auth connection not present')
      if (conn.connStatus !== QSSAuthConnStatus.CONNECTED) {
        throw new Error(`auth connStatus=${conn.connStatus}`)
      }
      if (conn.joinStatus !== JoinStatus.JOINED) {
        throw new Error(`auth joinStatus=${conn.joinStatus}`)
      }
    }, 90_000)
  } finally {
    restore()
  }
}

describe('QSS stress: per-message wire-fault precision', () => {
  let harness: QssHarness
  let invariants: Invariants

  beforeEach(async () => {
    harness = await bootQssHarness()
    invariants = new Invariants()
    invariants.start()
  })

  afterEach(async () => {
    if (harness != null) await harness.shutdown()
  })

  it('wire-fault-drop-during-gen-pub-keys-ack: proxy drop overlapping GEN_PUB_KEYS ack', async () => {
    // Use the `before-*` boundary so the outage is *scheduled* (with a
    // small delay) before the emit goes out. By the time the proxy drops,
    // the GEN_PUB_KEYS emit has reached the wire and its ack is in flight
    // — the drop kills it. (Using `after-*-sent` for ack-bearing calls
    // would only fire after the ack already returned, defeating the point.)
    const wireFaults: WireFault[] = [
      {
        at: 'before-gen-pub-keys',
        action: oneShot(scheduleOutageAfter(100, 2000)),
      },
    ]

    await runFreshCreateUnderWireFaults(harness, wireFaults)
    Invariants.expectClean(invariants.stop())
  })

  it('wire-fault-drop-during-create-community-ack: proxy drop overlapping CREATE_COMMUNITY ack', async () => {
    // CREATE_COMMUNITY uses the default 5 s ack timeout. Schedule the
    // proxy drop 100 ms after the emit goes out (via before-*), so the
    // in-flight ack window is roughly [t+0, t+5000] and the outage
    // straddles [t+100, t+2600] inside it.
    const wireFaults: WireFault[] = [
      {
        at: 'before-create-community',
        action: oneShot(scheduleOutageAfter(100, 2500)),
      },
    ]

    await runFreshCreateUnderWireFaults(harness, wireFaults)
    Invariants.expectClean(invariants.stop())
  })

  it('wire-fault-drop-during-sign-in-ack: proxy drop overlapping SIGN_IN_COMMUNITY ack on rejoin', async () => {
    // Drive a clean create first so qssSetup=true. Subsequent QSS_CONNECTED
    // events take the signInToCommunity branch (not the create branch).
    await runFreshCreateUnderWireFaults(harness, [])

    const sigchain = harness.sigchainService.activeChain
    const teamId = sigchain.team!.id

    // Force a network-induced disconnect (more realistic than .close(): the
    // service code's reconnect-after-disconnect path is what we want to
    // exercise, not its explicit-close-and-reopen path).
    await harness.toxiproxy.setEnabled(harness.proxyName, false)
    await waitForExpect(() => {
      expect(harness.qssService.connected).toBe(false)
    }, 30_000)

    // Arm the wire fault BEFORE we re-enable the proxy. The next
    // SIGN_IN_COMMUNITY emit (issued by the auto-flow once QSS_CONNECTED
    // fires again) will trip the after-sign-in-community-sent hook, which
    // schedules a brief proxy drop overlapping that ack.
    //
    // One-shot: if we re-fired on every retry the service would never
    // climb out — each reconnect would trigger another outage, indefinitely.
    // The point of this scenario is "the *first* sign-in ack got dropped";
    // the service must recover on its own retries afterwards.
    const restore = installWireFaultHooks(harness, [
      {
        at: 'before-sign-in-community',
        action: oneShot(scheduleOutageAfter(100, 2500)),
      },
    ])
    try {
      await harness.toxiproxy.setEnabled(harness.proxyName, true)
      await harness.qssService.connect(harness.qssEndpoint, true)

      // Recovery: the auth conn should re-establish CONNECTED + JOINED after
      // the wire-fault-induced proxy outage and the service's reconnect logic.
      // The QSS service's reconnect interval is 60 s (QSS_RECONNECT_DELAY_MS),
      // so we drive an explicit reconnect partway through the wait window to
      // give the recovery path a chance without sitting on the long backoff.
      const recoveryDeadline = Date.now() + 120_000
      while (Date.now() < recoveryDeadline) {
        const conn = harness.qssAuthConnManager.getConnection(teamId)
        if (
          conn != null &&
          conn.connStatus === QSSAuthConnStatus.CONNECTED &&
          conn.joinStatus === JoinStatus.JOINED
        ) {
          break
        }
        await sleep(2000)
        // Nudge a reconnect to bypass the long QSS_RECONNECT_DELAY_MS backoff.
        await harness.qssService.connect(harness.qssEndpoint, true).catch(() => undefined)
      }
      const conn = harness.qssAuthConnManager.getConnection(teamId)
      expect(conn).toBeDefined()
      expect(conn?.connStatus).toBe(QSSAuthConnStatus.CONNECTED)
      expect(conn?.joinStatus).toBe(JoinStatus.JOINED)
    } finally {
      restore()
    }

    Invariants.expectClean(invariants.stop())
  })

  it('wire-fault-drop-during-verify-captcha-ack: proxy drop overlapping VERIFY_CAPTCHA ack', async () => {
    // Bonus: surfaces races in the captcha exchange specifically. If the
    // ack is lost the service should re-issue the captcha verification on
    // the next reconnect rather than wedging on a stale captchaVerified=false.
    const wireFaults: WireFault[] = [
      {
        at: 'before-verify-captcha',
        action: oneShot(scheduleOutageAfter(50, 2000)),
      },
    ]

    await runFreshCreateUnderWireFaults(harness, wireFaults)
    Invariants.expectClean(invariants.stop())
  })
})
