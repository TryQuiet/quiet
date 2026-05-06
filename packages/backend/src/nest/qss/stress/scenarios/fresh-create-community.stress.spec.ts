/**
 * Primary stress scenario: fresh community creation against a real QSS server,
 * through Toxiproxy, with chaos applied to the connect / captcha / GEN_PUB_KEYS
 * / CREATE_COMMUNITY / AUTH_SYNC sequence.
 *
 * Minimally synthetic: the only piece not on the wire is the renderer-side
 * captcha solve, which we replace with the official hCaptcha test token (the
 * QSS server is configured with the matching test secret in dev, so its
 * VERIFY_CAPTCHA round-trip really runs and really succeeds).
 *
 * QSS rate-limits captcha to one create per socket, so each scenario boots a
 * fresh harness.
 */
import { jest } from '@jest/globals'
import waitForExpect from 'wait-for-expect'

import { bootQssHarness, type QssHarness } from '../harness'
import { Invariants, expectQssConnectedWithin } from '../invariants'
import { QSSAuthConnStatus } from '../../qss.const'
import { JoinStatus } from '../../../libp2p/libp2p.auth'

jest.setTimeout(180_000)

describe('QSS stress: fresh community creation', () => {
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

  it('creates a community on QSS through a healthy proxy', async () => {
    // Prime before connect: when QSS_CONNECTED fires, the QSSService's
    // auto-flow will call createCommunity, which needs the captcha cached.
    harness.primeCaptcha()

    await harness.qssService.connect(harness.qssEndpoint, true)
    await expectQssConnectedWithin(harness, 15_000)

    const sigchain = harness.sigchainService.activeChain
    const teamId = sigchain.team!.id

    // Wait for the auto-create (triggered by QSS_CONNECTED → QSS_HANDLE_SIGN_IN)
    // to flip qssSetup. Don't call createCommunity explicitly — that races the
    // auto-flow and trips QSS's one-create-per-socket captcha rule.
    await waitForExpect(async () => {
      const status = await harness.qssService.getQssInitStatus()
      expect(status.qssSetup).toBe(true)
    }, 30_000)
    expect(harness.qssClient.captchaVerified).toBe(true)

    await waitForExpect(() => {
      const conn = harness.qssAuthConnManager.getConnection(teamId)
      expect(conn).not.toBeUndefined()
      expect(conn!.connStatus).toBe(QSSAuthConnStatus.CONNECTED)
      expect(conn!.joinStatus).toBe(JoinStatus.JOINED)
    }, 30_000)

    Invariants.expectClean(invariants.stop())
  })

  it('creates a community despite high inbound latency on every round-trip', async () => {
    await harness.toxiproxy.addToxic(harness.proxyName, {
      name: 'create-latency',
      type: 'latency',
      stream: 'downstream',
      toxicity: 1.0,
      attributes: { latency: 600, jitter: 200 },
    })

    await harness.qssService.connect(harness.qssEndpoint, true)
    await expectQssConnectedWithin(harness, 30_000)

    harness.primeCaptcha()

    const sigchain = harness.sigchainService.activeChain
    const teamId = sigchain.team!.id

    const created = await harness.qssService.createCommunity(sigchain)
    expect(created).toBe(true)

    const status = await harness.qssService.getQssInitStatus()
    expect(status.qssSetup).toBe(true)

    await waitForExpect(() => {
      const conn = harness.qssAuthConnManager.getConnection(teamId)
      expect(conn?.connStatus).toBe(QSSAuthConnStatus.CONNECTED)
      expect(conn?.joinStatus).toBe(JoinStatus.JOINED)
    }, 60_000)

    Invariants.expectClean(invariants.stop())
  })

  it('survives a brief outage between VERIFY_CAPTCHA and CREATE_COMMUNITY', async () => {
    await harness.qssService.connect(harness.qssEndpoint, true)
    await expectQssConnectedWithin(harness, 15_000)

    harness.primeCaptcha()

    // Run the captcha exchange first so we know it succeeded; the next step
    // (createCommunity) will skip captcha and head straight to GEN_PUB_KEYS.
    const captchaOk = await harness.qssClient.requestCaptchaVerification()
    expect(captchaOk).toBe(true)

    // Drop the connection and bring it back before the create attempt. The
    // QSS service should reconnect and CREATE_COMMUNITY should succeed once
    // the wire is up — but the captcha-per-socket rule means createCommunity
    // will fail if the new socket inherits a stale captchaVerified flag.
    await harness.toxiproxy.setEnabled(harness.proxyName, false)
    await waitForExpect(() => {
      expect(harness.qssService.connected).toBe(false)
    }, 15_000)
    await harness.toxiproxy.setEnabled(harness.proxyName, true)
    await harness.qssService.connect(harness.qssEndpoint, true)
    await expectQssConnectedWithin(harness, 30_000)

    // Re-prime: a new socket means a new captcha context.
    harness.primeCaptcha()

    const sigchain = harness.sigchainService.activeChain
    const created = await harness.qssService.createCommunity(sigchain)
    expect(created).toBe(true)

    Invariants.expectClean(invariants.stop())
  })
})
