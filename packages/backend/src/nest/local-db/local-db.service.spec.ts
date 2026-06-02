import { CID } from 'multiformats/cid'
import * as raw from 'multiformats/codecs/raw'
import { sha256 } from 'multiformats/hashes/sha2'
import { Test, TestingModule } from '@nestjs/testing'
import { jest } from '@jest/globals'
import { hash } from '@localfirst/crypto'

import { createLibp2pAddress } from '@quiet/common'
import { NetworkStats, Community } from '@quiet/types'

import { LocalDbModule } from './local-db.module'
import { LocalDbService } from './local-db.service'
import { LocalDBKeys, DLQ_TTL_MS } from './local-db.types'
import { TestModule } from '../common/test.module'
import { SigChain } from '../auth/sigchain'
import { createLogger } from '../common/logger'
import { EncryptedAndSignedPayload, EncryptionScopeType } from '../auth/services/crypto/types'
import { Base58 } from '@localfirst/auth'

// Simple mock serializer for testing that mirrors Serializer interface
class MockSerializer {
  serialize(payload: unknown): Buffer {
    return Buffer.from(
      JSON.stringify(payload, (_key, value) => {
        if (value instanceof Uint8Array) {
          return { __type: 'Uint8Array', data: Array.from(value) }
        }
        return value
      })
    )
  }

  deserialize(buffer: Buffer): unknown {
    return JSON.parse(buffer.toString(), (_key, value) => {
      if (value && value.__type === 'Uint8Array') {
        return new Uint8Array(value.data)
      }
      return value
    })
  }
}

const logger = createLogger('LocalDbService:test')

describe('LocalDbService', () => {
  let moduleRef: TestingModule
  let service: LocalDbService

  // ---------------------------------------------------------------------------
  // Utility constants
  // ---------------------------------------------------------------------------

  const peer1Id = '12D3KooWEHzmff5kZAvyU6Diq5uJG8QkWJxFNUcBLuWjxUGvxaqw'
  const peer2Id = '12D3KooWKCWstmqi5gaQvipT7xVneVGfWV7HYpCbmUu626R92hXx'

  const addr1 = createLibp2pAddress('nqnw4kc4c77fb47lk52m5l57h4tcxceo7ymxekfn7yh5m66t4jv2olad.onion', peer1Id)

  const addr2 = createLibp2pAddress('zl37gnntp64dhnisddftypxbt5cqx6cum65vdv6oeaffrbqmemwc52ad.onion', peer2Id)

  const stats1: Record<string, NetworkStats> = {
    [peer1Id]: {
      peerId: peer1Id,
      address: addr1,
      connectionTime: 50,
      lastSeen: 1_000,
    },
  }

  const stats2: Record<string, NetworkStats> = {
    [peer2Id]: {
      peerId: peer2Id,
      address: addr2,
      connectionTime: 500,
      lastSeen: 500,
    },
  }

  // ---------------------------------------------------------------------------
  // Setup / Teardown
  // ---------------------------------------------------------------------------

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [TestModule, LocalDbModule],
    }).compile()

    service = await moduleRef.resolve(LocalDbService)
  })

  beforeEach(async () => {
    jest.restoreAllMocks()
    if (service.getStatus() === 'closed') {
      await service.open()
    }
    await service.purge()
  })

  afterAll(async () => {
    await service.close()
    await moduleRef.close()
  })

  // ---------------------------------------------------------------------------
  // Basic DB operations
  // ---------------------------------------------------------------------------

  it('opens and closes the DB', async () => {
    await service.close()
    expect(service.getStatus()).toBe('closed')

    await service.open()
    expect(service.getStatus()).not.toBe('closed')
  })

  it('put / get / delete / exists cycle', async () => {
    expect(await service.exists('k')).toBe(false)

    await service.put('k', 'v')
    expect(await service.exists('k')).toBe(true)
    expect(await service.get('k')).toBe('v')

    await service.delete('k')
    expect(await service.get('k')).toBeNull()
  })

  it('update merges objects and creates new keys', async () => {
    await service.update('obj', { a: 1 })
    expect(await service.get('obj')).toEqual({ a: 1 })

    await service.update('obj', { b: 2, a: 3 })
    expect(await service.get('obj')).toEqual({ a: 3, b: 2 })
  })

  it('find returns nested value and null when missing', async () => {
    await service.put('data', { nested: 42 })
    expect(await service.find('data', 'nested')).toBe(42)
    expect(await service.find('data', 'missing')).toBeNull()
  })

  it('purge clears all keys', async () => {
    await service.put('a', 1)
    await service.put('b', 2)
    await service.purge()

    expect(await service.get('a')).toBeNull()
    expect(await service.get('b')).toBeNull()
  })

  it('load ignores empty primitives / objects', async () => {
    await service.load({
      a: 1,
      b: '',
      c: {},
      d: [],
      e: 'value',
    })

    expect(await service.get('a')).toBe(1)
    expect(await service.get('e')).toBe('value')
    expect(await service.get('b')).toBeNull()
    expect(await service.get('c')).toBeNull()
    expect(await service.get('d')).toBeNull()
  })

  // ---------------------------------------------------------------------------
  // Peer‑stats helpers
  // ---------------------------------------------------------------------------

  describe('peer stats helpers', () => {
    it('setPeerStats stores stats keyed by address', async () => {
      await service.setPeerStats(stats1)
      expect(await service.get(LocalDBKeys.PEERS)).toEqual(stats1)
    })

    it('updatePeerStats merges with existing and adds new entry', async () => {
      await service.setPeerStats(stats1)
      await service.updatePeerStats(stats2)

      const merged = await service.get(LocalDBKeys.PEERS)
      expect(merged).toEqual({ ...stats1, ...stats2 })
    })

    it('getPeerStats returns all or a single peer entry', async () => {
      await service.setPeerStats({ ...stats1, ...stats2 })

      // all peers
      expect(await service.getPeerStats()).toEqual({
        ...stats1,
        ...stats2,
      })

      // single peer – key by peerId
      expect(await service.getPeerStats(peer1Id)).toEqual(stats1[peer1Id])
      expect(await service.getPeerStats(peer2Id)).toEqual(stats2[peer2Id])
    })

    it('getSortedPeers returns addresses sorted alphabetically', async () => {
      await service.setPeerStats({ ...stats1, ...stats2 })
      const sorted = await service.getSortedPeers(false)
      expect(sorted).toEqual([addr1, addr2].sort())
    })

    it('getSortedPeers does not include local address when includeLocalPeerAddress = false', async () => {
      logger.info('exclude local address')

      // stub getIdentity so that local address === addr1
      const identityMock = jest.spyOn(service, 'getIdentity').mockResolvedValue({
        networkInfo: {
          hiddenService: {
            onionAddress: 'nqnw4kc4c77fb47lk52m5l57h4tcxceo7ymxekfn7yh5m66t4jv2olad.onion',
          },
          peerId: { id: peer1Id },
        },
      } as any)

      await service.setCurrentCommunityId('c1')

      const peers = await service.getSortedPeers(false)
      expect(peers).toEqual([])

      identityMock.mockRestore()
    })

    it('getSortedPeers includes local address when includeLocalPeerAddress = true', async () => {
      logger.info('include local address')

      // stub getIdentity so that local address === addr1
      const identityMock = jest.spyOn(service, 'getIdentity').mockResolvedValue({
        networkInfo: {
          hiddenService: {
            onionAddress: 'nqnw4kc4c77fb47lk52m5l57h4tcxceo7ymxekfn7yh5m66t4jv2olad.onion',
          },
          peerId: { id: peer1Id },
        },
      } as any)

      await service.setCurrentCommunityId('c1')

      const peers = await service.getSortedPeers(true)
      expect(peers).toEqual([addr1])

      identityMock.mockRestore()
    })
  })

  // ---------------------------------------------------------------------------
  // Community helpers
  // ---------------------------------------------------------------------------

  describe('community helpers', () => {
    const community: Community = {
      id: 'c1',
      name: 'Test Community',
    } as any

    it('set / get communities', async () => {
      await service.setCommunity(community)
      const communities = await service.getCommunities()

      expect(communities[community.id]).toEqual(community)
    })

    it('getCurrentCommunity returns correct community', async () => {
      await service.setCommunity(community)
      await service.setCurrentCommunityId('c1')

      expect(await service.getCurrentCommunity()).toEqual(community)
    })

    it('communityExists detects presence', async () => {
      await service.setCommunity(community)
      expect(await service.communityExists('c1')).toBe(true)
      expect(await service.communityExists('missing')).toBe(false)
    })
  })

  // ---------------------------------------------------------------------------
  // Identity helpers
  // ---------------------------------------------------------------------------

  describe('identity helpers', () => {
    const identity = {
      communityId: 'c1',
      userId: 'user1',
      networkInfo: {
        hiddenService: { onionAddress: 'abc.onion' },
        peerId: { id: peer1Id },
      },
    } as any

    it('set / get identity', async () => {
      await service.setIdentity(identity)

      expect(await service.getIdentity('c1')).toEqual(identity)

      const all = await service.getIdentities()
      expect(all['c1']).toEqual(identity)
    })
  })

  // ---------------------------------------------------------------------------
  // Sigchain helpers
  // ---------------------------------------------------------------------------

  describe('sigchain helpers', () => {
    const teamName = 'team1'
    const dummySigChain = {
      user: { id: 'u' },
      device: { id: 'd' },
      save: () => Uint8Array.from([1, 2, 3]),
      team: {
        save: () => Uint8Array.from([4, 5, 6]),
        teamKeyring: () => ({ dummy: true }),
      },
    } as unknown as SigChain

    it('set / get / delete sigchain round‑trip', async () => {
      await service.setSigChain(dummySigChain, teamName)

      const stored = await service.getSigChain(teamName)
      expect(stored).toBeDefined()
      expect(stored!.localUserContext.user).toEqual(dummySigChain.user)

      await service.deleteSigChain(teamName)
      const afterDelete = await service.getSigChain(teamName)
      expect(afterDelete).toBeUndefined()
    })
  })

  describe('pending heads', () => {
    // Helper to create a valid CID from data
    async function createTestCid(data: Uint8Array | string): Promise<CID> {
      const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data
      const hash = await sha256.digest(bytes)
      return CID.create(1, raw.code, hash)
    }

    afterEach(async () => {
      await service.purge()
    })

    it('add / get / remove pending heads', async () => {
      const address = '/orbitdb/addr1'
      const cid1 = await createTestCid('test-data-1')
      const cid2 = await createTestCid('test-data-2')

      // Add one, then another, then check both
      await service.addPendingHead(address, [cid1])
      expect(await service.getPendingHeads()).toEqual({ [address]: [cid1] })
      await service.addPendingHead(address, [cid2])
      expect(await service.getPendingHeads()).toEqual({ [address]: [cid1, cid2] })

      // Remove one, should leave the other
      await service.removePendingHead(address, [cid1])
      expect(await service.getPendingHeads()).toEqual({ [address]: [cid2] })

      // Remove the last, should be empty
      await service.removePendingHead(address, [cid2])
      expect(await service.getPendingHeads()).toEqual({})
    })

    it('handles multiple addresses independently', async () => {
      const address1 = '/orbitdb/addr1'
      const address2 = '/orbitdb/addr2'
      const cid1 = await createTestCid('test-data-1')
      const cid2 = await createTestCid('test-data-2')
      await service.addPendingHead(address1, [cid1])
      await service.addPendingHead(address2, [cid2])
      expect(await service.getPendingHeads()).toEqual({ [address1]: [cid1], [address2]: [cid2] })
      // Remove from one address only
      await service.removePendingHead(address1, [cid1])
      expect(await service.getPendingHeads()).toEqual({ [address2]: [cid2] })
    })

    it('does not add duplicate CIDs', async () => {
      const address = '/orbitdb/addr1'
      const cid = await createTestCid('test-data-1')
      await service.addPendingHead(address, [cid, cid])
      expect(await service.getPendingHeads()).toEqual({ [address]: [cid] })
      // Add again, still only one
      await service.addPendingHead(address, [cid])
      expect(await service.getPendingHeads()).toEqual({ [address]: [cid] })
    })

    it('getPendingHeads(address) returns only for that address', async () => {
      const address1 = '/orbitdb/addr1'
      const address2 = '/orbitdb/addr2'
      const cid1 = await createTestCid('test-data-1')
      const cid2 = await createTestCid('test-data-2')
      await service.addPendingHead(address1, [cid1])
      await service.addPendingHead(address2, [cid2])
      expect(await service.getPendingHeads(address1)).toEqual([cid1])
      expect(await service.getPendingHeads(address2)).toEqual([cid2])
    })

    it('getPendingHeads returns {} if no pending heads', async () => {
      expect(await service.getPendingHeads()).toEqual({})
    })

    it('removePendingHead is idempotent and safe for missing CIDs', async () => {
      const address = '/orbitdb/addr1'
      const cid1 = await createTestCid('test-data-1')
      const cid2 = await createTestCid('test-data-2')
      await service.addPendingHead(address, [cid1])
      // Remove a CID that isn't present
      await service.removePendingHead(address, [cid2])
      expect(await service.getPendingHeads()).toEqual({ [address]: [cid1] })
      // Remove the real one
      await service.removePendingHead(address, [cid1])
      expect(await service.getPendingHeads()).toEqual({})
    })
  })

  describe('pending qss sync messages', () => {
    const ADDRESS = 'foobar'
    const ADDRESS2 = 'barbaz'

    afterEach(async () => {
      await service.purge()
    })

    it('add / get / remove pending qss sync messages', async () => {
      const hash1 = hash('', 'first hash')
      const hash2 = hash('', 'second hash')

      // Add one, then another, then check both
      const added = await service.addPendingQssLogSyncMessage(ADDRESS, hash1)
      expect(added).toBeTruthy()
      let pendingMessages = await service.getPendingQssLogSyncMessages()
      expect(pendingMessages).toEqual({ [ADDRESS]: [hash1] })

      await service.addPendingQssLogSyncMessage(ADDRESS, hash2)
      pendingMessages = await service.getPendingQssLogSyncMessages()
      expect(pendingMessages).toEqual({ [ADDRESS]: [hash1, hash2] })

      // Remove one, should leave the other
      await service.removePendingQssLogSyncMessages({ [ADDRESS]: [hash1] })
      pendingMessages = await service.getPendingQssLogSyncMessages()
      expect(pendingMessages).toEqual({ [ADDRESS]: [hash2] })

      // Remove the last, should be empty
      await service.removePendingQssLogSyncMessages({ [ADDRESS]: [hash2] })
      pendingMessages = await service.getPendingQssLogSyncMessages()
      expect(pendingMessages).toEqual({})
    })

    it('add / get / remove pending qss sync messages on different addresses', async () => {
      const hash1 = hash('', 'first hash')
      const hash2 = hash('', 'second hash')

      // Add one, then another, then check both
      const added = await service.addPendingQssLogSyncMessage(ADDRESS, hash1)
      expect(added).toBeTruthy()
      let pendingMessages = await service.getPendingQssLogSyncMessages()
      expect(pendingMessages).toEqual({ [ADDRESS]: [hash1] })

      await service.addPendingQssLogSyncMessage(ADDRESS2, hash2)
      pendingMessages = await service.getPendingQssLogSyncMessages()
      expect(pendingMessages).toEqual({ [ADDRESS]: [hash1], [ADDRESS2]: [hash2] })

      // Remove one, should leave the other
      await service.removePendingQssLogSyncMessages({ [ADDRESS]: [hash1] })
      pendingMessages = await service.getPendingQssLogSyncMessages()
      expect(pendingMessages).toEqual({ [ADDRESS2]: [hash2] })

      // Remove the last, should be empty
      await service.removePendingQssLogSyncMessages({ [ADDRESS2]: [hash2] })
      pendingMessages = await service.getPendingQssLogSyncMessages()
      expect(pendingMessages).toEqual({})
    })

    it('remove is a no op when incorrect address is passed in', async () => {
      const hash1 = hash('', 'first hash')
      const hash2 = hash('', 'second hash')

      // Add one, then another, then check both
      const added = await service.addPendingQssLogSyncMessage(ADDRESS, hash1)
      expect(added).toBeTruthy()
      let pendingMessages = await service.getPendingQssLogSyncMessages()
      expect(pendingMessages).toEqual({ [ADDRESS]: [hash1] })

      await service.addPendingQssLogSyncMessage(ADDRESS2, hash2)
      pendingMessages = await service.getPendingQssLogSyncMessages()
      expect(pendingMessages).toEqual({ [ADDRESS]: [hash1], [ADDRESS2]: [hash2] })

      // Remove one, should leave the other
      await service.removePendingQssLogSyncMessages({ [ADDRESS2]: [hash1] })
      pendingMessages = await service.getPendingQssLogSyncMessages()
      expect(pendingMessages).toEqual({ [ADDRESS]: [hash1], [ADDRESS2]: [hash2] })
    })

    it('does not add duplicate messages', async () => {
      const hash1 = hash('', 'first hash')

      await service.addPendingQssLogSyncMessage(ADDRESS, hash1)
      let pendingMessages = await service.getPendingQssLogSyncMessages()
      expect(pendingMessages).toEqual({ [ADDRESS]: [hash1] })

      // Add again, still only one
      await service.addPendingQssLogSyncMessage(ADDRESS, hash1)
      pendingMessages = await service.getPendingQssLogSyncMessages()
      expect(pendingMessages).toEqual({ [ADDRESS]: [hash1] })
    })

    it('getPendingQssSyncMessages returns empty array if no pending messages', async () => {
      const pendingMessages = await service.getPendingQssLogSyncMessages()
      expect(pendingMessages).toEqual({})
    })

    it('removePendingQssSyncMessages is idempotent and safe for missing messages', async () => {
      const hash1 = hash('', 'first hash')
      const hash2 = hash('', 'second hash')

      await service.addPendingQssLogSyncMessage(ADDRESS, hash1)
      let pendingMessages = await service.getPendingQssLogSyncMessages()
      expect(pendingMessages).toEqual({ [ADDRESS]: [hash1] })

      // Remove a message that isn't present
      await service.removePendingQssLogSyncMessages({ [ADDRESS]: [hash2] })
      pendingMessages = await service.getPendingQssLogSyncMessages()
      expect(pendingMessages).toEqual({ [ADDRESS]: [hash1] })

      // Remove the real one
      await service.removePendingQssLogSyncMessages({ [ADDRESS]: [hash1] })
      pendingMessages = await service.getPendingQssLogSyncMessages()
      expect(pendingMessages).toEqual({})
    })
  })

  describe('last sync seq', () => {
    const TEAM_ID = 'team-abc'

    afterEach(async () => {
      await service.purge()
    })

    it('set / get last sync seq', async () => {
      const syncSeq = 42
      await service.setLastSyncSeq(TEAM_ID, syncSeq)
      const retrieved = await service.getLastSyncSeq(TEAM_ID)
      expect(retrieved).toBe(syncSeq)
    })

    it('returns null when no sync seq exists', async () => {
      const result = await service.getLastSyncSeq('nonexistent-team')
      expect(result).toBeNull()
    })

    it('returns null for invalid (NaN) stored value', async () => {
      // Manually store invalid value
      await service.put(`${LocalDBKeys.LAST_QSS_LOG_SYNC_SEQ}:${TEAM_ID}`, 'not-a-number')
      const result = await service.getLastSyncSeq(TEAM_ID)
      expect(result).toBeNull()
    })

    it('handles multiple teams independently', async () => {
      const team1 = 'team-1'
      const team2 = 'team-2'
      const seq1 = 1000
      const seq2 = 2000

      await service.setLastSyncSeq(team1, seq1)
      await service.setLastSyncSeq(team2, seq2)

      expect(await service.getLastSyncSeq(team1)).toBe(seq1)
      expect(await service.getLastSyncSeq(team2)).toBe(seq2)
    })

    it('overwrites existing sync seq', async () => {
      const seq1 = 1000
      const seq2 = 2000

      await service.setLastSyncSeq(TEAM_ID, seq1)
      expect(await service.getLastSyncSeq(TEAM_ID)).toBe(seq1)

      await service.setLastSyncSeq(TEAM_ID, seq2)
      expect(await service.getLastSyncSeq(TEAM_ID)).toBe(seq2)
    })
  })

  describe('DLQ decrypt entries', () => {
    const TEAM_ID = 'team-123'
    let serializer: MockSerializer

    const createMockPayload = (uniqueData: string): EncryptedAndSignedPayload => ({
      encrypted: {
        contents: new Uint8Array([1, 2, 3]),
        scope: {
          type: EncryptionScopeType.ROLE,
          name: 'MEMBER',
          generation: 1,
        },
      },
      signature: {
        signature: `sig-${uniqueData}` as Base58,
        author: { type: 'USER', name: 'user1' } as any,
      },
      ts: Date.now(),
      userId: 'user-1',
      teamId: TEAM_ID,
    })

    beforeEach(() => {
      serializer = new MockSerializer()
    })

    afterEach(async () => {
      await service.purge()
    })

    it('add / get / remove DLQ decrypt entries', async () => {
      const payload1 = createMockPayload('entry1')
      const payload2 = createMockPayload('entry2')

      // Add entries
      await service.addDLQDecryptEntry(TEAM_ID, payload1, serializer)
      await service.addDLQDecryptEntry(TEAM_ID, payload2, serializer)

      // Get entries (order not guaranteed when timestamps collide)
      const entries = await service.getDLQDecryptEntries(TEAM_ID, serializer)
      expect(entries.length).toBe(2)
      const sigs = entries.map(e => e.entry.payload.signature.signature)
      expect(sigs).toContain(payload1.signature.signature)
      expect(sigs).toContain(payload2.signature.signature)

      // Remove first entry
      await service.removeDLQDecryptEntries(TEAM_ID, [entries[0]])
      const remaining = await service.getDLQDecryptEntries(TEAM_ID, serializer)
      expect(remaining.length).toBe(1)

      // Remove last entry
      await service.removeDLQDecryptEntries(TEAM_ID, remaining)
      const empty = await service.getDLQDecryptEntries(TEAM_ID, serializer)
      expect(empty.length).toBe(0)
    })

    it('does not add duplicate entries', async () => {
      const payload = createMockPayload('same')

      await service.addDLQDecryptEntry(TEAM_ID, payload, serializer)
      await service.addDLQDecryptEntry(TEAM_ID, payload, serializer)

      const entries = await service.getDLQDecryptEntries(TEAM_ID, serializer)
      expect(entries.length).toBe(1)
    })

    it('getDLQDecryptCount returns correct count', async () => {
      expect(await service.getDLQDecryptCount(TEAM_ID)).toBe(0)

      await service.addDLQDecryptEntry(TEAM_ID, createMockPayload('a'), serializer)
      expect(await service.getDLQDecryptCount(TEAM_ID)).toBe(1)

      await service.addDLQDecryptEntry(TEAM_ID, createMockPayload('b'), serializer)
      expect(await service.getDLQDecryptCount(TEAM_ID)).toBe(2)
    })

    it('respects limit option in getDLQDecryptEntries', async () => {
      await service.addDLQDecryptEntry(TEAM_ID, createMockPayload('a'), serializer)
      await service.addDLQDecryptEntry(TEAM_ID, createMockPayload('b'), serializer)
      await service.addDLQDecryptEntry(TEAM_ID, createMockPayload('c'), serializer)

      const limited = await service.getDLQDecryptEntries(TEAM_ID, serializer, { limit: 2 })
      expect(limited.length).toBe(2)
    })

    it('filters by scope when using scope options', async () => {
      const payload1 = createMockPayload('gen1')
      payload1.encrypted.scope.generation = 1

      const payload2 = createMockPayload('gen2')
      payload2.encrypted.scope.generation = 2

      await service.addDLQDecryptEntry(TEAM_ID, payload1, serializer)
      await service.addDLQDecryptEntry(TEAM_ID, payload2, serializer)

      const gen1Only = await service.getDLQDecryptEntries(TEAM_ID, serializer, {
        scopeType: EncryptionScopeType.ROLE,
        scopeGen: 1,
      })
      expect(gen1Only.length).toBe(1)
      expect(gen1Only[0].entry.payload.encrypted.scope.generation).toBe(1)
    })

    it('handles entries with different team IDs independently', async () => {
      const otherTeamId = 'team-456'

      await service.addDLQDecryptEntry(TEAM_ID, createMockPayload('team1'), serializer)
      await service.addDLQDecryptEntry(otherTeamId, createMockPayload('team2'), serializer)

      const team1Entries = await service.getDLQDecryptEntries(TEAM_ID, serializer)
      const team2Entries = await service.getDLQDecryptEntries(otherTeamId, serializer)

      expect(team1Entries.length).toBe(1)
      expect(team2Entries.length).toBe(1)
      expect(team1Entries[0].entry.payload.signature.signature).toContain('team1')
      expect(team2Entries[0].entry.payload.signature.signature).toContain('team2')
    })

    it('removes expired entries during get (full scan)', async () => {
      const payload = createMockPayload('expired')
      await service.addDLQDecryptEntry(TEAM_ID, payload, serializer)

      // Verify entry exists
      expect(await service.getDLQDecryptCount(TEAM_ID)).toBe(1)

      // Mock Date.now to be past TTL
      const originalNow = Date.now
      Date.now = jest.fn(() => originalNow() + DLQ_TTL_MS + 1000)

      try {
        const entries = await service.getDLQDecryptEntries(TEAM_ID, serializer)
        expect(entries.length).toBe(0)

        // Entry should be deleted
        Date.now = originalNow
        expect(await service.getDLQDecryptCount(TEAM_ID)).toBe(0)
      } finally {
        Date.now = originalNow
      }
    })

    it('removes expired entries during get (scoped query)', async () => {
      const payload = createMockPayload('expired-scoped')
      await service.addDLQDecryptEntry(TEAM_ID, payload, serializer)

      expect(await service.getDLQDecryptCount(TEAM_ID)).toBe(1)

      const originalNow = Date.now
      Date.now = jest.fn(() => originalNow() + DLQ_TTL_MS + 1000)

      try {
        const entries = await service.getDLQDecryptEntries(TEAM_ID, serializer, {
          scopeType: EncryptionScopeType.ROLE,
          scopeGen: 1,
        })
        expect(entries.length).toBe(0)

        Date.now = originalNow
        expect(await service.getDLQDecryptCount(TEAM_ID)).toBe(0)
      } finally {
        Date.now = originalNow
      }
    })

    it('preserves fresh entries during get', async () => {
      const payload = createMockPayload('fresh')
      await service.addDLQDecryptEntry(TEAM_ID, payload, serializer)

      // Entry is fresh, should be returned
      const entries = await service.getDLQDecryptEntries(TEAM_ID, serializer)
      expect(entries.length).toBe(1)
      expect(entries[0].entry.payload.signature.signature).toBe(payload.signature.signature)
    })
  })
})
