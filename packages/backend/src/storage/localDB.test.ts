import { NetworkStats } from '@quiet/state-manager'
import { LocalDB, LocalDBKeys } from './localDB'
import { createTmpDir } from '../common/testUtils'
import path from 'path'
import { beforeEach, describe, it, expect, afterEach, beforeAll } from '@jest/globals'

describe('LocalDB', () => {
  let db: LocalDB = null
  let dbPath: string
  let peer1Address: string
  let peer1Stats: {[peerAddress: string]: NetworkStats} = {}
  let peer2Address: string
  let peer2Stats: {[peerAddress: string]: NetworkStats} = {}

  beforeAll(() => {
    dbPath = path.join(createTmpDir().name, 'testDB')
    peer1Address = '/dns4/mxtsfs4kzxzuisrw4tumdmycbyerqwakx37kj6om6azcjdaasifxmoqd.onion/tcp/443/wss/p2p/QmaEvCkpUG7GxhgvMkk8wxurfi1ehjHhSUNRksWTmXN2ix'
    peer1Stats = {
      [peer1Address]: {
          peerId: 'QmaEvCkpUG7GxhgvMkk8wxurfi1ehjHhSUNRksWTmXN2ix',
          connectionTime: 50,
          lastSeen: 1000
      }
    }
    peer2Address = '/dns4/hxr74a76b4lerhov75a6ha6yprruvow3wfu4qmmeoc6ajs7m7323lyid.onion/tcp/443/wss/p2p/QmZB6pVafcvAQfy5R5LxvDXvB8xcDifD39Lp3XGDM9XDuQ'
    peer2Stats = {
      [peer2Address]: {
          peerId: 'QmZB6pVafcvAQfy5R5LxvDXvB8xcDifD39Lp3XGDM9XDuQ',
          connectionTime: 500,
          lastSeen: 500
      }
    }
  })

  beforeEach(() => {
    db = new LocalDB(dbPath)
  })

  afterEach(async () => {
    await db.close()
  })

  it('return null if no key found', async () => {
    expect(await db.get('somekey')).toBeNull()
  })

  it('return data if exists in db', async () => {
    await db.db.put('somekey', 'value')
    expect(await db.get('somekey')).toEqual('value')
  })

  it('puts data to db', async () => {
    await db.put('somekey', 'value')
    expect(await db.db.get('somekey')).toEqual('value')
  })

  it('close db', async () => {
    await db.close()
    expect(db.db.status).toEqual('closed')
  })

  it('get sorted peers', async () => {
    const extraPeers = ['/dns4/zl37gnntp64dhnisddftypxbt5cqx6cum65vdv6oeaffrbqmemwc52ad.onion/tcp/443/wss/p2p/QmPGdGDUV1PXaJky4V53KSvFszdqEcM7KCoDpF2uFPf5w6']
    await db.put(LocalDBKeys.PEERS, {
      ...peer1Stats,
      ...peer2Stats
    })
    const sortedPeers = await db.getSortedPeers(extraPeers)
    expect(sortedPeers).toEqual([
      peer1Address,
      peer2Address,
      extraPeers[0]
    ])
  })

  it('updates nested object', async () => {
    await db.update(LocalDBKeys.PEERS, peer1Stats)
    await db.update(LocalDBKeys.PEERS, peer2Stats)

    const peersDBdata = await db.get(LocalDBKeys.PEERS)
    expect(peersDBdata).toEqual({
      ...peer1Stats,
      ...peer2Stats
    })

    const peer2StatsUpdated: NetworkStats = {
      peerId: 'QmR7Qgd4tg2XrGD3kW647ZnYyazTwHQF3cqRBmSduhhusA',
      connectionTime: 777,
      lastSeen: 678
    }

    await db.update(LocalDBKeys.PEERS, {
      [peer2Address]: peer2StatsUpdated
    })

    const updatedPeersDBdata = await db.get(LocalDBKeys.PEERS)
    expect(updatedPeersDBdata).toEqual({
      ...peer1Stats,
      [peer2Address]: peer2StatsUpdated
    })
  })
})
