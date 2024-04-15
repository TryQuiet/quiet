import { Inject, Injectable } from '@nestjs/common'
import { Level } from 'level'
import { type Community, type Identity, InitCommunityPayload, type NetworkInfo, NetworkStats } from '@quiet/types'
import { createLibp2pAddress, filterAndSortPeers } from '@quiet/common'
import { LEVEL_DB } from '../const'
import { LocalDBKeys, LocalDbStatus } from './local-db.types'
import Logger from '../common/logger'
import { create } from 'mock-fs/lib/filesystem'

@Injectable()
export class LocalDbService {
  peers: any
  private readonly logger = Logger(LocalDbService.name)
  constructor(@Inject(LEVEL_DB) private readonly db: Level) {}

  public async close() {
    this.logger('Closing leveldb')
    await this.db.close()
  }

  public async open() {
    this.logger('Opening leveldb')
    await this.db.open()
  }

  public getStatus(): LocalDbStatus {
    return this.db.status
  }

  public async purge() {
    await this.db.clear()
  }

  public async get(key: string) {
    let data: any
    try {
      data = await this.db.get(key)
    } catch (e) {
      this.logger(`Getting '${key}'`, e)
      return null
    }
    return data
  }

  public async exists(key: string): Promise<boolean> {
    return Boolean(await this.get(key))
  }

  public async put(key: string, value: any) {
    await this.db.put(key, value)
  }

  public async update(key: string, value: object) {
    /**
     * Update data instead of replacing it
     */
    const data = await this.get(key)
    if (!data) {
      await this.put(key, value)
      return null
    }
    const updatedObj = Object.assign(data, value)
    await this.put(key, updatedObj)
  }

  public async find(key: string, value: string) {
    /**
     * Find and return nested key
     */
    const obj = await this.get(key)
    try {
      return obj[value]
    } catch (e) {
      this.logger(`${value} not found in ${key}`)
      return null
    }
  }

  public async delete(key: string) {
    await this.db.del(key)
  }

  public async load(data: any) {
    for (const key in data) {
      if (typeof data[key] === 'object' && Object.keys(data[key]).length === 0) {
        continue
      }
      if (typeof data[key] === 'string' && data[key].length === 0) {
        continue
      }
      if (Array.isArray(data[key]) && data[key].length === 0) {
        continue
      }
      await this.put(key, data[key])
    }
  }

  public async getSortedPeers(
    peers?: string[] | undefined,
    includeLocalPeerAddress: boolean = true
  ): Promise<string[]> {
    if (!peers) {
      const currentCommunity = await this.getCurrentCommunity()
      if (!currentCommunity) {
        throw new Error('No peers were provided and no community was found to extract peers from')
      }
      peers = currentCommunity.peerList
      if (!peers) {
        throw new Error('No peers provided and no peers found on current stored community')
      }
    }

    const peersStats = (await this.get(LocalDBKeys.PEERS)) || {}
    const stats: NetworkStats[] = Object.values(peersStats)
    const network = await this.getNetworkInfo()

    if (network) {
      const localPeerAddress = createLibp2pAddress(network.hiddenService.onionAddress, network.peerId.id)
      this.logger('Local peer', localPeerAddress)
      return filterAndSortPeers(peers, stats, localPeerAddress, includeLocalPeerAddress)
    } else {
      return filterAndSortPeers(peers, stats, undefined, includeLocalPeerAddress)
    }
  }

  public async setCommunity(community: Community) {
    let communities = await this.get(LocalDBKeys.COMMUNITIES)
    if (!communities) {
      communities = {}
    }
    communities[community.id] = community
    await this.put(LocalDBKeys.COMMUNITIES, communities)
  }

  public async setCurrentCommunityId(communityId: string) {
    await this.put(LocalDBKeys.CURRENT_COMMUNITY_ID, communityId)
  }

  public async getCommunities(): Promise<Record<string, Community>> {
    return await this.get(LocalDBKeys.COMMUNITIES)
  }

  public async getCurrentCommunity(): Promise<Community | undefined> {
    const currentCommunityId = await this.get(LocalDBKeys.CURRENT_COMMUNITY_ID)
    const communities = await this.get(LocalDBKeys.COMMUNITIES)

    return communities?.[currentCommunityId]
  }

  public async communityExists(communityId: string): Promise<boolean> {
    return communityId in ((await this.getCommunities()) ?? {})
  }

  // These are potentially temporary functions to help us migrate data to the
  // backend. Currently this information lives under the COMMUNITY key in
  // LevelDB, but on the frontend this data lives in the Identity model. So we
  // may want to keep this data in the Identity model in LevelDB (when we
  // migrate it from the frontend) and have getIdentity/setIdentity functions.
  public async setNetworkInfo(network: NetworkInfo) {
    await this.put(LocalDBKeys.COMMUNITY, network)
  }

  // These are potentially temporary functions to help us migrate data to the
  // backend. Currently this information lives under the COMMUNITY key in
  // LevelDB, but on the frontend this data lives in the Identity model. So we
  // may want to keep this data in the Identity model in LevelDB (when we
  // migrate it from the frontend) and have getIdentity/setIdentity functions.
  public async getNetworkInfo(): Promise<NetworkInfo | undefined> {
    const initCommunityPayload = await this.get(LocalDBKeys.COMMUNITY)

    return initCommunityPayload
      ? { peerId: initCommunityPayload.peerId, hiddenService: initCommunityPayload.hiddenService }
      : undefined
  }
}
