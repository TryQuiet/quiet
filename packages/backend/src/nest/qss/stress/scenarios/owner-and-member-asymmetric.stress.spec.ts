/**
 * Asymmetric per-peer chaos scenarios.
 *
 * Each member harness allocates its OWN toxiproxy listener (default for
 * `bootMemberHarness`). Toxics on the owner's proxy don't leak to the
 * member's, and vice-versa. That's the whole point: real deployments
 * have asymmetric link conditions, and the QSS auth-sync handshake
 * routes through QSS so a one-side stall is the failure mode we care
 * about.
 *
 * These cases verify that the harness correctly applies per-peer chaos
 * AND that the QSS auth flow handles asymmetric conditions. If one
 * passes here today and breaks tomorrow, we want to see exactly which
 * side stalled (`MultiPeerAuthSnapshot`).
 */
import { jest } from '@jest/globals'
import waitForExpect from 'wait-for-expect'

import { bootQssHarness, bootMemberHarness, generateOwnerInvite, type QssHarness } from '../harness'
import {
  Invariants,
  expectQssConnectedWithin,
  snapshotMultiPeerAuthConn,
  formatMultiPeerSnapshot,
} from '../invariants'
import { QSSAuthConnStatus } from '../../qss.const'
import { JoinStatus } from '../../../libp2p/libp2p.auth'
import { MULTI_PEER_PROFILES, type MultiPeerChaosProfile, type PeerChaos, type ScenarioPhase } from '../fuzz'

jest.setTimeout(240_000)

const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))

describe('QSS stress: asymmetric per-peer chaos', () => {
  let owner: QssHarness | undefined
  let member: QssHarness | undefined
  let invariants: Invariants

  afterEach(async () => {
    invariants?.stop()
    if (member != null) await member.shutdown().catch(() => undefined)
    member = undefined
    if (owner != null) await owner.shutdown().catch(() => undefined)
    owner = undefined
  })

  /**
   * Boot owner + member, verify owner reaches CONNECTED+JOINED and
   * generate the invite. Returns the invite and ownerTeamId so the
   * caller can apply per-peer chaos before the member joins.
   */
  async function setupOwnerHealthy(suffix: string): Promise<{
    invite: ReturnType<typeof generateOwnerInvite>
    ownerTeamId: string
  }> {
    invariants = new Invariants()
    invariants.start()

    owner = await bootQssHarness({ username: `owner-${suffix}`, teamName: `team-${suffix}` })
    owner.primeCaptcha()
    await owner.qssService.connect(owner.qssEndpoint, true)
    await expectQssConnectedWithin(owner, 30_000)

    const ownerTeamId = owner.sigchainService.activeChain.team!.id
    await waitForExpect(async () => {
      const status = await owner!.qssService.getQssInitStatus()
      expect(status.qssSetup).toBe(true)
    }, 30_000)
    await waitForExpect(() => {
      const conn = owner!.qssAuthConnManager.getConnection(ownerTeamId)
      expect(conn?.connStatus).toBe(QSSAuthConnStatus.CONNECTED)
      expect(conn?.joinStatus).toBe(JoinStatus.JOINED)
    }, 30_000)

    const invite = generateOwnerInvite(owner!)
    return { invite, ownerTeamId }
  }

  async function expectMemberJoined(teamId: string): Promise<void> {
    await waitForExpect(() => {
      const conn = member!.qssAuthConnManager.getConnection(teamId)
      if (conn == null) throw new Error('member auth connection not present')
      if (conn.connStatus !== QSSAuthConnStatus.CONNECTED) {
        throw new Error(`member auth connStatus=${conn.connStatus}`)
      }
      if (conn.joinStatus !== JoinStatus.JOINED) {
        throw new Error(`member auth joinStatus=${conn.joinStatus}`)
      }
    }, 90_000)
  }

  // ── Healthy baseline (sanity check that per-peer proxies work) ────────
  it('baseline: each peer on its own proxy, no chaos, both reach JOINED', async () => {
    const { invite, ownerTeamId } = await setupOwnerHealthy('baseline')

    member = await bootMemberHarness({ invite, username: 'member-baseline' })
    // Verify each peer has its own listener — proxyName should differ.
    expect(member.proxyName).not.toBe(owner!.proxyName)
    expect(member.qssEndpoint).not.toBe(owner!.qssEndpoint)

    member.primeCaptcha()
    await member.qssService.connect(member.qssEndpoint, true)
    await expectQssConnectedWithin(member, 30_000)

    await expectMemberJoined(invite.teamId)

    // Owner should still be JOINED.
    const ownerConn = owner!.qssAuthConnManager.getConnection(ownerTeamId)
    expect(ownerConn?.joinStatus).toBe(JoinStatus.JOINED)

    Invariants.expectClean(invariants.stop())
  })

  // ── Owner healthy, member under 2s latency ───────────────────────────
  it('owner-clean / member-2s-latency: AUTH_SYNC handshake still completes', async () => {
    const { invite, ownerTeamId } = await setupOwnerHealthy('owner-clean')

    member = await bootMemberHarness({ invite, username: 'member-slow' })

    // Apply 2s downstream latency on the member's proxy only.
    await member.toxiproxy.addToxic(member.proxyName, {
      name: 'lat',
      type: 'latency',
      stream: 'downstream',
      toxicity: 1.0,
      attributes: { latency: 2000, jitter: 200 },
    })

    member.primeCaptcha()
    await member.qssService.connect(member.qssEndpoint, true)
    await expectQssConnectedWithin(member, 60_000)

    await expectMemberJoined(invite.teamId)

    // Owner side should NOT be affected — its proxy has no toxics.
    const ownerConn = owner!.qssAuthConnManager.getConnection(ownerTeamId)
    expect(ownerConn?.joinStatus).toBe(JoinStatus.JOINED)
  })

  // ── Member healthy, owner has 5s outage during member's join ─────────
  it('owner-5s-outage / member-clean: member reaches JOINED eventually', async () => {
    const { invite, ownerTeamId } = await setupOwnerHealthy('owner-blip')

    member = await bootMemberHarness({ invite, username: 'member-clean' })

    // Schedule a 5s owner-side outage in the background. It starts now
    // and runs concurrently with the member's connect / sign-in flow.
    const ownerOutage = (async () => {
      await owner!.toxiproxy.setEnabled(owner!.proxyName, false).catch(() => undefined)
      await sleep(5000)
      await owner!.toxiproxy.setEnabled(owner!.proxyName, true).catch(() => undefined)
      // Kick reconnect on owner side.
      await owner!.qssService.connect(owner!.qssEndpoint, true).catch(() => undefined)
    })()

    member.primeCaptcha()
    await member.qssService.connect(member.qssEndpoint, true)
    await expectQssConnectedWithin(member, 60_000)

    await expectMemberJoined(invite.teamId)

    await ownerOutage

    // Owner needs time to reconnect and re-establish the auth conn after
    // the outage. Without this poll we'd race the reconnect.
    await waitForExpect(() => {
      const snap = snapshotMultiPeerAuthConn(owner, member, ownerTeamId)
      if (snap.owner?.joinStatus !== JoinStatus.JOINED) {
        throw new Error(`owner not back to JOINED: ${formatMultiPeerSnapshot(snap)}`)
      }
    }, 30_000)
  })

  // ── Both peers under independent latency (asymmetric pace) ───────────
  it('owner-500ms / member-1500ms: each side handles the other\'s pace', async () => {
    const { invite } = await setupOwnerHealthy('owner-mod-mem-slow')

    member = await bootMemberHarness({ invite, username: 'member-slow' })

    // Owner: 500ms downstream latency.
    await owner!.toxiproxy.addToxic(owner!.proxyName, {
      name: 'lat',
      type: 'latency',
      stream: 'downstream',
      toxicity: 1.0,
      attributes: { latency: 500, jitter: 100 },
    })

    // Member: 1500ms downstream latency.
    await member.toxiproxy.addToxic(member.proxyName, {
      name: 'lat',
      type: 'latency',
      stream: 'downstream',
      toxicity: 1.0,
      attributes: { latency: 1500, jitter: 300 },
    })

    member.primeCaptcha()
    await member.qssService.connect(member.qssEndpoint, true)
    await expectQssConnectedWithin(member, 60_000)

    await expectMemberJoined(invite.teamId)
  })

  // ── Owner flapping briefly while member joins ────────────────────────
  it('owner-flapping / member-clean: member converges despite owner blips', async () => {
    const { invite, ownerTeamId } = await setupOwnerHealthy('owner-flap')

    member = await bootMemberHarness({ invite, username: 'member-clean-flap' })

    // 200ms flaps for 3s on the OWNER's proxy only.
    const flapTask = (async () => {
      const start = Date.now()
      let enabled = true
      while (Date.now() - start < 3000) {
        enabled = !enabled
        await owner!.toxiproxy.setEnabled(owner!.proxyName, enabled).catch(() => undefined)
        await sleep(200)
      }
      await owner!.toxiproxy.setEnabled(owner!.proxyName, true).catch(() => undefined)
      await owner!.qssService.connect(owner!.qssEndpoint, true).catch(() => undefined)
    })()

    member.primeCaptcha()
    await member.qssService.connect(member.qssEndpoint, true)
    await expectQssConnectedWithin(member, 60_000)
    await expectMemberJoined(invite.teamId)
    await flapTask

    // Same logic as outage case: poll until the owner-side auth conn
    // settles back into JOINED after the flapping clears.
    await waitForExpect(() => {
      const snap = snapshotMultiPeerAuthConn(owner, member, ownerTeamId)
      if (snap.owner?.joinStatus !== JoinStatus.JOINED) {
        throw new Error(`owner not back to JOINED: ${formatMultiPeerSnapshot(snap)}`)
      }
    }, 30_000)
  })

  // ── Canonical MULTI_PEER_PROFILES catalog sweep ────────────────────
  it.each(MULTI_PEER_PROFILES.map((p): [string, MultiPeerChaosProfile] => [p.name, p]))(
    'multi-peer profile %s',
    async (_name, profile) => {
      const { invite, ownerTeamId } = await setupOwnerHealthy(`cat-${profile.name}`)
      member = await bootMemberHarness({ invite, username: `member-${profile.name}` })

      // Apply per-peer toxics (NOT outages/flaps yet — those are scheduled
      // per-phase below) on each peer's own proxy.
      await applyToxicsOnHarness(owner!, profile.owner)
      await applyToxicsOnHarness(member, profile.member)

      // Schedule owner-side outages/flaps in the background — they fire
      // concurrently with the member's flow.
      const ownerTasks: Promise<void>[] = []
      for (const phase of ['preCreate', 'duringAuthSync'] as ScenarioPhase[]) {
        ownerTasks.push(scheduleChaos(owner!, profile.owner, phase))
      }

      member.primeCaptcha()
      await member.qssService.connect(member.qssEndpoint, true)
      await expectQssConnectedWithin(member, 60_000)

      // Member-side outages/flaps fire on the member's own proxy.
      await scheduleChaos(member, profile.member, 'preCreate')
      await scheduleChaos(member, profile.member, 'duringAuthSync')

      try {
        await expectMemberJoined(invite.teamId)
      } catch (e) {
        const snap = snapshotMultiPeerAuthConn(owner, member, ownerTeamId)
        const msg = e instanceof Error ? e.message : String(e)
        throw new Error(`[${profile.name}] ${msg} | ${formatMultiPeerSnapshot(snap)}`)
      }
      await Promise.allSettled(ownerTasks)
    }
  )
})

async function applyToxicsOnHarness(harness: QssHarness, peer: PeerChaos | undefined): Promise<void> {
  if (peer?.toxics == null) return
  for (const toxic of peer.toxics) {
    await harness.toxiproxy.addToxic(harness.proxyName, toxic).catch(() => undefined)
  }
}

async function scheduleChaos(
  harness: QssHarness,
  peer: PeerChaos | undefined,
  phase: ScenarioPhase
): Promise<void> {
  if (peer == null) return
  for (const o of (peer.outages ?? []).filter(x => x.at === phase)) {
    await harness.toxiproxy.setEnabled(harness.proxyName, false).catch(() => undefined)
    await sleep(o.durationMs)
    await harness.toxiproxy.setEnabled(harness.proxyName, true).catch(() => undefined)
    await harness.qssService.connect(harness.qssEndpoint, true).catch(() => undefined)
  }
  for (const f of (peer.flaps ?? []).filter(x => x.at === phase)) {
    const start = Date.now()
    let enabled = true
    while (Date.now() - start < f.totalMs) {
      enabled = !enabled
      await harness.toxiproxy.setEnabled(harness.proxyName, enabled).catch(() => undefined)
      await sleep(f.cycleMs)
    }
    await harness.toxiproxy.setEnabled(harness.proxyName, true).catch(() => undefined)
    await harness.qssService.connect(harness.qssEndpoint, true).catch(() => undefined)
  }
}
