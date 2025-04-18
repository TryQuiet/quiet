import { Test, TestingModule } from '@nestjs/testing'
import { LocalDbModule } from './local-db.module'
import { LocalDbService } from './local-db.service'
import { LocalDBKeys } from './local-db.types'
import { TestModule } from '../common/test.module'
import { createLibp2pAddress } from '@quiet/common'
import { NetworkStats, Community } from '@quiet/types'
import { SigChain } from '../auth/sigchain'
import { jest } from '@jest/globals'
import { createLogger } from '../common/logger'

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
    [addr1]: {
      peerId: peer1Id,
      connectionTime: 50,
      lastSeen: 1_000,
    },
  }

  const stats2: Record<string, NetworkStats> = {
    [addr2]: {
      peerId: peer2Id,
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
      expect(await service.getPeerStats(peer1Id)).toEqual(stats1[addr1])
      expect(await service.getPeerStats(peer2Id)).toEqual(stats2[addr2])
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
})
