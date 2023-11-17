import { Test, TestingModule } from '@nestjs/testing'
import { NetworkStats } from '@quiet/types'
import { TestModule } from '../common/test.module'
import { LocalDbModule } from './local-db.module'
import { LocalDbService } from './local-db.service'
import { LocalDBKeys } from './local-db.types'
import { createLibp2pAddress } from '@quiet/common'

describe('LocalDbService', () => {
  let module: TestingModule
  let localDbService: LocalDbService
  let peer1Stats: Record<string, NetworkStats> = {}
  let peer2Stats: Record<string, NetworkStats> = {}

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [TestModule, LocalDbModule],
    }).compile()

    localDbService = await module.resolve(LocalDbService)

    peer1Stats = {
      ['QmaEvCkpUG7GxhgvMkk8wxurfi1ehjHhSUNRksWTmXN2ix']: {
        peerId: 'QmaEvCkpUG7GxhgvMkk8wxurfi1ehjHhSUNRksWTmXN2ix',
        connectionTime: 50,
        lastSeen: 1000,
      },
    }
    peer2Stats = {
      ['QmZB6pVafcvAQfy5R5LxvDXvB8xcDifD39Lp3XGDM9XDuQ']: {
        peerId: 'QmZB6pVafcvAQfy5R5LxvDXvB8xcDifD39Lp3XGDM9XDuQ',
        connectionTime: 500,
        lastSeen: 500,
      },
    }
  })

  beforeEach(async () => {
    if (localDbService.getStatus() === 'closed') {
      await localDbService.open()
    }
  })

  afterAll(async () => {
    await localDbService.close()
    await module.close()
  })

  it('return null if no key found', async () => {
    expect(await localDbService.get('somekey')).toBeNull()
  })

  it('return data if exists in db', async () => {
    await localDbService.put('somekey', 'value')
    expect(await localDbService.get('somekey')).toEqual('value')
  })

  it('puts data to db', async () => {
    await localDbService.put('somekey', 'value')
    expect(await localDbService.get('somekey')).toEqual('value')
  })

  it('close db', async () => {
    await localDbService.close()
    expect(localDbService.getStatus()).toEqual('closed')
  })

  it('get sorted peers returns peers list if no stats in db', async () => {
    const peers = [
      createLibp2pAddress(
        'zl37gnntp64dhnisddftypxbt5cqx6cum65vdv6oeaffrbqmemwc52ad.onion',
        'QmPGdGDUV1PXaJky4V53KSvFszdqEcM7KCoDpF2uFPf5w6'
      ),
    ]
    const sortedPeers = await localDbService.getSortedPeers(peers)
    expect(sortedPeers).toEqual(peers)
  })

  it('get sorted peers', async () => {
    const peers = [
      createLibp2pAddress('nqnw4kc4c77fb47lk52m5l57h4tcxceo7ymxekfn7yh5m66t4jv2olad.onion', Object.keys(peer2Stats)[0]),
      createLibp2pAddress('zl37gnntp64dhnisddftypxbt5cqx6cum65vdv6oeaffrbqmemwc52ad.onion', Object.keys(peer1Stats)[0]),
    ]
    await localDbService.put(LocalDBKeys.PEERS, {
      ...peer1Stats,
      ...peer2Stats,
    })
    const sortedPeers = await localDbService.getSortedPeers(peers.reverse())
    expect(sortedPeers).toEqual(peers)
  })

  it('updates nested object', async () => {
    await localDbService.update(LocalDBKeys.PEERS, peer1Stats)
    await localDbService.update(LocalDBKeys.PEERS, peer2Stats)

    const peersDBdata = await localDbService.get(LocalDBKeys.PEERS)
    expect(peersDBdata).toEqual({
      ...peer1Stats,
      ...peer2Stats,
    })

    const peer2StatsUpdated: NetworkStats = {
      peerId: 'QmR7Qgd4tg2XrGD3kW647ZnYyazTwHQF3cqRBmSduhhusA',
      connectionTime: 777,
      lastSeen: 678,
    }

    await localDbService.update(LocalDBKeys.PEERS, {
      [peer2StatsUpdated.peerId]: peer2StatsUpdated,
    })

    const updatedPeersDBdata = await localDbService.get(LocalDBKeys.PEERS)
    expect(updatedPeersDBdata).toEqual({
      ...peer1Stats,
      [peer2StatsUpdated.peerId]: peer2StatsUpdated,
    })
  })
})
