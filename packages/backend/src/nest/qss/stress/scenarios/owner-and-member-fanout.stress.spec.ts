/**
 * Two-client message visibility via QSS fanout.
 *
 * This bypasses orbitdb address sharing (which would need cross-IPFS manifest
 * fetching that doesn't exist in this harness) and tests the QSS layer
 * directly: owner sends a synthetic log-entry-sync message, member's QSS
 * client should receive the matching LOG_ENTRY_SYNC fanout. Real wire, real
 * encryption with the team's MEMBER role keys, real QSS room routing.
 */
import { jest } from '@jest/globals'
import waitForExpect from 'wait-for-expect'

import { bootQssHarness, bootMemberHarness, generateOwnerInvite, type QssHarness } from '../harness'
import { expectQssConnectedWithin } from '../invariants'
import { QSSAuthConnStatus } from '../../qss.const'
import { JoinStatus } from '../../../libp2p/libp2p.auth'
import { WebsocketEvents, type LogEntrySyncMessage } from '../../qss.types'

jest.setTimeout(180_000)

describe('QSS stress: owner posts, member receives via fanout', () => {
  let owner: QssHarness | undefined
  let member: QssHarness | undefined

  afterEach(async () => {
    if (member != null) await member.shutdown().catch(() => undefined)
    member = undefined
    if (owner != null) await owner.shutdown().catch(() => undefined)
    owner = undefined
  })

  it('member receives a log-entry-sync fanout for a message the owner posts', async () => {
    // ── Setup: owner creates community, member joins ──────────────────
    owner = await bootQssHarness({ username: 'owner', teamName: 'fanout-team' })
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
    }, 30_000)

    const invite = generateOwnerInvite(owner)

    member = await bootMemberHarness({ invite, username: 'member' })
    member.primeCaptcha()
    await member.qssService.connect(member.qssEndpoint, true)
    await expectQssConnectedWithin(member, 15_000)
    await waitForExpect(() => {
      const conn = member!.qssAuthConnManager.getConnection(invite.teamId)
      expect(conn?.connStatus).toBe(QSSAuthConnStatus.CONNECTED)
      expect(conn?.joinStatus).toBe(JoinStatus.JOINED)
    }, 60_000)

    // ── Member starts listening for fanout ────────────────────────────
    const received: LogEntrySyncMessage[] = []
    member.qssClient.on(WebsocketEvents.LOG_ENTRY_SYNC, (msg: LogEntrySyncMessage) => {
      received.push(msg)
    })

    // ── Owner posts a synthetic log entry ─────────────────────────────
    // We bypass orbitdb here — the QSSService accepts any LogUpdate-shaped
    // input, encrypts it with the team's MEMBER role keys, and ships it.
    const syntheticHash = 'zb2rh-stress-' + Date.now()
    const syntheticAddr = '/orbitdb/test/channels.fanout-team'
    const result = await owner.qssService.sendLogEntrySyncMessage({
      teamId: ownerTeamId,
      hash: syntheticHash,
      id: syntheticAddr, // becomes hashedDbId on the wire
      addr: syntheticAddr,
      entry: { greeting: 'hello from owner', ts: Date.now() } as unknown as never,
    })
    expect(result).toBe(true)

    // ── Member should see the fanout ──────────────────────────────────
    await waitForExpect(() => {
      expect(received.some(m => m.payload.hash === syntheticHash)).toBe(true)
    }, 15_000)

    // Sanity: the encrypted payload was for the right team.
    const ours = received.find(m => m.payload.hash === syntheticHash)!
    expect(ours.payload.teamId).toBe(ownerTeamId)
    expect(ours.payload.encEntry).toBeDefined()
  })
})
