import { Buffer } from 'buffer'
import { Inject, Injectable } from '@nestjs/common'
import { CID } from 'multiformats/cid'
import { base58btc } from 'multiformats/bases/base58'
import { Level } from 'level'

import { type Community, type NetworkInfo, NetworkStats, Identity, IdentityUpdatePayload } from '@quiet/types'
import { createLibp2pAddress, filterAndSortPeers } from '@quiet/common'
import { LEVEL_DB } from '../const'
import { LocalDBKeys, LocalDbStatus } from './local-db.types'
import { createLogger } from '../common/logger'
import { SerializedSigChain, SigChainSaveData } from '../auth/types'
import { SigChain } from '../auth/sigchain'
import { Keyring } from '@localfirst/crdx'

@Injectable()
export class LocalDbService {
  peers: any
  private readonly logger = createLogger(LocalDbService.name)
  constructor(@Inject(LEVEL_DB) private readonly db: Level) {}

  public async close() {
    this.logger.info('Closing leveldb')
    await this.db.close()
  }

  public async open() {
    this.logger.info('Opening leveldb')
    await this.db.open()
  }

  public getStatus(): LocalDbStatus {
    return this.db.status
  }

  public async purge() {
    this.logger.info(`Purging db`)
    await this.db.clear()
  }

  public async get(key: string) {
    let data: any
    try {
      data = await this.db.get(key)
    } catch (e) {
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

  public async find(key: string, prop: string) {
    const obj = await this.get(key)
    if (!obj || !(prop in obj)) {
      this.logger.error(`${prop} not found in ${key}`)
      return null
    }
    return obj[prop]
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

  /**
   * Overwrite the complete local db entry for peers with the given stats
   * @param stats
   */
  public async setPeerStats(stats: Record<string, NetworkStats>) {
    this.logger.debug('Setting peer stats', stats)
    await this.put(LocalDBKeys.PEERS, stats)
  }

  /**
   * Update the local db entry for the given peers with the given stats
   * @param stats
   */
  public async updatePeerStats(stats: Record<string, NetworkStats>) {
    this.logger.debug('Updating peer stats', JSON.stringify(stats, null, 2))
    const existingStats = await this.get(LocalDBKeys.PEERS)
    if (!existingStats) {
      await this.put(LocalDBKeys.PEERS, stats)
      return
    }
    const updatedStats = { ...existingStats, ...stats }
    await this.put(LocalDBKeys.PEERS, updatedStats)
  }

  /**
   * Get the local db entry for peers
   */
  public async getPeerStats(peerId: string): Promise<NetworkStats | null>
  public async getPeerStats(): Promise<Record<string, NetworkStats>>
  public async getPeerStats(peerId?: string): Promise<NetworkStats | Record<string, NetworkStats> | null> {
    if (peerId) {
      return await this.find(LocalDBKeys.PEERS, peerId)
    }
    const peers = await this.get(LocalDBKeys.PEERS)
    if (!peers) {
      return null
    }
    return peers
  }

  /**
   * Retrieves a sorted list of peer addresses from the local database.
   *
   * @param includeLocalPeerAddress - A boolean flag indicating whether to include the local peer's address
   * in the sorted list. Defaults to `true`.
   * @returns A promise that resolves to an array of sorted peer multiaddr.
   */
  public async getSortedPeers(includeLocalPeerAddress: boolean = true): Promise<string[]> {
    const entries = (await this.get(LocalDBKeys.PEERS)) || {}
    const stats: NetworkStats[] = Object.values(entries)
    const addresses: string[] = stats
      .map((peer: NetworkStats) => peer.address)
      .filter((address): address is string => address !== undefined)

    if (includeLocalPeerAddress) {
      const identity = await this.getIdentity(await this.get(LocalDBKeys.CURRENT_COMMUNITY_ID))

      let localPeerAddress: string | undefined = undefined
      if (identity) {
        localPeerAddress = createLibp2pAddress(
          identity.networkInfo.hiddenService.onionAddress,
          identity.networkInfo.peerId.id
        )
        return filterAndSortPeers(addresses, stats, localPeerAddress, includeLocalPeerAddress)
      }
    }
    const sortedPeers = filterAndSortPeers(addresses, stats, undefined, includeLocalPeerAddress)
    return sortedPeers
  }

  public async setCommunity(community: Community) {
    this.logger.info('Setting community', community.id, community.name, community)
    let communities = await this.get(LocalDBKeys.COMMUNITIES)
    if (!communities) {
      communities = {}
    }
    communities[community.id] = community
    await this.put(LocalDBKeys.COMMUNITIES, communities)
  }

  public async setCurrentCommunityId(communityId: string) {
    this.logger.info('Setting current community id', communityId)
    await this.put(LocalDBKeys.CURRENT_COMMUNITY_ID, communityId)
  }

  public async getCommunities(): Promise<Record<string, Community>> {
    return await this.get(LocalDBKeys.COMMUNITIES)
  }

  public async getCurrentCommunity(): Promise<Community | undefined> {
    this.logger.info('Getting current community')
    const currentCommunityId = await this.get(LocalDBKeys.CURRENT_COMMUNITY_ID)
    const communities = await this.get(LocalDBKeys.COMMUNITIES)

    return communities?.[currentCommunityId]
  }

  public async communityExists(communityId: string): Promise<boolean> {
    return communityId in ((await this.getCommunities()) ?? {})
  }

  // temporarily shoving identity creation here
  public async setIdentity(identity: Identity) {
    let identities = await this.get(LocalDBKeys.IDENTITIES)
    if (!identities) {
      identities = {}
    }
    identities[identity.communityId] = identity
    await this.put(LocalDBKeys.IDENTITIES, identities)
  }

  public async getIdentity(id: string): Promise<Identity | undefined> {
    const identities = await this.get(LocalDBKeys.IDENTITIES)
    return identities?.[id]
  }

  public async getIdentities(): Promise<Record<string, Identity>> {
    return await this.get(LocalDBKeys.IDENTITIES)
  }

  public async setSigChain(sigChain: SigChain, teamName: string) {
    const key = `${LocalDBKeys.SIGCHAINS}${teamName}`
    let serializedTeam: string | undefined = undefined
    let teamKeyring: Keyring | undefined = undefined
    if (sigChain.team) {
      serializedTeam = Buffer.from(sigChain.save()).toString('base64')
      teamKeyring = sigChain.team.teamKeyring()
    }
    const serializedSigChain: SigChainSaveData = {
      serializedTeam: serializedTeam,
      localUserContext: { user: sigChain.user, device: sigChain.device },
      teamKeyRing: teamKeyring,
    }
    this.logger.info('Saving sigchain', teamName)
    await this.put(key, serializedSigChain)
  }

  public async getSigChain(teamName: string): Promise<SerializedSigChain | undefined> {
    const key = `${LocalDBKeys.SIGCHAINS}${teamName}`
    this.logger.info('Getting sigchain', teamName, key)
    const sigChainBlob = await this.get(key)
    if (sigChainBlob == null) {
      this.logger.error(`No sig chain stored in local DB for key`, key)
      return undefined
    }

    try {
      let serializedTeam: Uint8Array | undefined = undefined
      if (sigChainBlob.serializedTeam) {
        try {
          serializedTeam = Buffer.from(sigChainBlob.serializedTeam, 'base64')
        } catch (e) {
          this.logger.error('Failed to load serialized team', e)
        }
        serializedTeam = Buffer.from(sigChainBlob.serializedTeam, 'base64')
      }
      return {
        serializedTeam: serializedTeam,
        localUserContext: sigChainBlob.localUserContext,
        teamKeyRing: sigChainBlob.teamKeyRing ? sigChainBlob.teamKeyRing : undefined,
      } as SerializedSigChain
    } catch (e) {
      this.logger.error('Failed to get sigchain', e)
      return undefined
    }
  }

  public async deleteSigChain(teamName: string) {
    const key = `${LocalDBKeys.SIGCHAINS}${teamName}`
    await this.delete(key)
  }

  /**
   * Pending heads helpers for OrbitDbService (per-address key version)
   */
  public async getPendingHeads(address?: string): Promise<Record<string, CID[]> | CID[]> {
    if (address) {
      let arr = (await this.get(`${LocalDBKeys.PENDING_HEADS}:${address}`)) || []
      if (typeof arr === 'string') {
        try {
          arr = JSON.parse(arr)
        } catch {
          arr = []
        }
      }
      return arr.map((cid: string) => CID.parse(cid, base58btc))
    }
    // Get all keys with the PENDING_HEADS: prefix
    const result: Record<string, CID[]> = {}
    for await (const [key, value] of this.db.iterator({
      gte: `${LocalDBKeys.PENDING_HEADS}:`,
      lte: `${LocalDBKeys.PENDING_HEADS}:~`,
    })) {
      let arr: string[] = []
      if (typeof value === 'string') {
        try {
          arr = JSON.parse(value)
        } catch {
          arr = []
        }
      } else {
        arr = value
      }
      const addr = key.slice(`${LocalDBKeys.PENDING_HEADS}:`.length)
      result[addr] = Array.isArray(arr) ? arr.map((cid: string) => CID.parse(cid, base58btc)) : []
    }
    return result
  }

  public async addPendingHead(address: string, heads: CID[]): Promise<void> {
    const key = `${LocalDBKeys.PENDING_HEADS}:${address}`
    let arr: string[] = (await this.get(key)) || []
    if (typeof arr === 'string') {
      try {
        arr = JSON.parse(arr)
      } catch {
        arr = []
      }
    }
    const newCids = heads.map(cid => cid.toString(base58btc))
    for (const headStr of newCids) {
      if (!arr.includes(headStr)) {
        arr.push(headStr)
      }
    }
    await this.put(key, arr)
  }

  public async removePendingHead(address: string, heads: CID[]): Promise<void> {
    const key = `${LocalDBKeys.PENDING_HEADS}:${address}`
    let arr: string[] = (await this.get(key)) || []
    if (typeof arr === 'string') {
      try {
        arr = JSON.parse(arr)
      } catch {
        arr = []
      }
    }
    for (const head of heads) {
      arr = arr.filter(cidStr => !CID.parse(cidStr, base58btc).equals(head))
    }
    if (arr.length === 0) {
      await this.delete(key)
    } else {
      await this.put(key, arr)
    }
  }
}
