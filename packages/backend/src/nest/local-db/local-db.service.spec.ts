import { Test, TestingModule } from '@nestjs/testing'
import { NetworkStats } from '@quiet/types'
import { TestModule } from '../common/test.module'
import { LocalDbModule } from './local-db.module'
import { LocalDbService } from './local-db.service'
import { LocalDBKeys } from './local-db.types'

describe('LocalDbService', () => {
  let module: TestingModule
  let localDbService: LocalDbService

  let peer1Address: string
  let peer1Stats: Record<string, NetworkStats> = {}
  let peer2Address: string
  let peer2Stats: Record<string, NetworkStats> = {}

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [TestModule, LocalDbModule],
    }).compile()

    localDbService = await module.resolve(LocalDbService)

    peer1Address =
      '/dns4/mxtsfs4kzxzuisrw4tumdmycbyerqwakx37kj6om6azcjdaasifxmoqd.onion/tcp/443/wss/p2p/QmaEvCkpUG7GxhgvMkk8wxurfi1ehjHhSUNRksWTmXN2ix'
    peer1Stats = {
      [peer1Address]: {
        peerId: 'QmaEvCkpUG7GxhgvMkk8wxurfi1ehjHhSUNRksWTmXN2ix',
        connectionTime: 50,
        lastSeen: 1000,
      },
    }
    peer2Address =
      '/dns4/hxr74a76b4lerhov75a6ha6yprruvow3wfu4qmmeoc6ajs7m7323lyid.onion/tcp/443/wss/p2p/QmZB6pVafcvAQfy5R5LxvDXvB8xcDifD39Lp3XGDM9XDuQ'
    peer2Stats = {
      [peer2Address]: {
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

  it('get sorted peers', async () => {
    const extraPeers = [
      '/dns4/zl37gnntp64dhnisddftypxbt5cqx6cum65vdv6oeaffrbqmemwc52ad.onion/tcp/443/wss/p2p/QmPGdGDUV1PXaJky4V53KSvFszdqEcM7KCoDpF2uFPf5w6',
    ]
    await localDbService.put(LocalDBKeys.PEERS, {
      ...peer1Stats,
      ...peer2Stats,
    })
    const sortedPeers = await localDbService.getSortedPeers(extraPeers)
    expect(sortedPeers).toEqual([peer1Address, peer2Address, extraPeers[0]])
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
      [peer2Address]: peer2StatsUpdated,
    })

    const updatedPeersDBdata = await localDbService.get(LocalDBKeys.PEERS)
    expect(updatedPeersDBdata).toEqual({
      ...peer1Stats,
      [peer2Address]: peer2StatsUpdated,
    })
  })
})
