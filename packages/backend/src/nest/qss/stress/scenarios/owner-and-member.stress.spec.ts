/**
 * Two-client scenario: owner creates community on QSS, member joins via the
 * QSS-routed AUTH_SYNC handshake. Verifies that both clients converge to
 * JoinStatus.JOINED — the minimum for "they're in the same team".
 *
 * Message-exchange via QSS log fanout is a follow-up scenario (the static
 * OrbitDbService.events emitter is shared across in-process harnesses, which
 * causes cross-talk for puts; needs separate processes or a per-harness
 * event scope).
 */
import { jest } from '@jest/globals'
import waitForExpect from 'wait-for-expect'

import { bootQssHarness, bootMemberHarness, generateOwnerInvite, type QssHarness } from '../harness'
import { Invariants, expectQssConnectedWithin } from '../invariants'
import { QSSAuthConnStatus } from '../../qss.const'
import { JoinStatus } from '../../../libp2p/libp2p.auth'

jest.setTimeout(180_000)

describe('QSS stress: owner + member join over QSS', () => {
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

  it('owner creates community, member joins via QSS, both reach JOINED', async () => {
    invariants = new Invariants()
    invariants.start()

    // ── Owner ─────────────────────────────────────────────────────────
    owner = await bootQssHarness({ username: 'owner', teamName: 'two-client-team' })
    owner.primeCaptcha()
    await owner.qssService.connect(owner.qssEndpoint, true)
    await expectQssConnectedWithin(owner, 15_000)

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

    // ── Member ────────────────────────────────────────────────────────
    const invite = generateOwnerInvite(owner)
    member = await bootMemberHarness({ invite, username: 'member' })
    member.primeCaptcha()
    await member.qssService.connect(member.qssEndpoint, true)
    await expectQssConnectedWithin(member, 15_000)

    // The auto-flow runs signInToCommunity (since member.sigchain.team is null),
    // which triggers QSS_START_AUTH_CONN and the LFA handshake over AUTH_SYNC.
    await waitForExpect(() => {
      const conn = member!.qssAuthConnManager.getConnection(invite.teamId)
      expect(conn).not.toBeUndefined()
      expect(conn!.connStatus).toBe(QSSAuthConnStatus.CONNECTED)
      expect(conn!.joinStatus).toBe(JoinStatus.JOINED)
    }, 60_000)

    // Owner side should still be JOINED after the join handshake completed.
    {
      const conn = owner.qssAuthConnManager.getConnection(ownerTeamId)
      expect(conn?.joinStatus).toBe(JoinStatus.JOINED)
    }

    Invariants.expectClean(invariants.stop())
  })
})
