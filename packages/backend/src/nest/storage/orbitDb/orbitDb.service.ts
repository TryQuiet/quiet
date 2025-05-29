import { CID } from 'multiformats/cid'
import { Inject, Injectable } from '@nestjs/common'
import { type PeerId } from '@libp2p/interface'
import EventEmitter from 'events'

import { ORBIT_DB_DIR } from '../../const'
import { createLogger } from '../../common/logger'
import { posixJoin } from './util'
import { MessagesAccessController } from '../channels/messages/orbitdb/MessagesAccessController'
import {
  createOrbitDB,
  type OrbitDBType,
  type IdentitiesType,
  useAccessController as orbitDbUseAccessController, // this is to fix a linting issue about react hooks
  ComposedStorage,
  LRUStorage,
  LevelStorage,
  OrbitDBOpenOptions,
  LogEntry,
} from '@orbitdb/core'
import { HeliaLibp2p, type Helia } from 'helia'
import { OrbitDbStorage } from '../../types'
import { IdentitiesWithStorage } from './identitiesWithStorage'
import { base58btc } from 'multiformats/bases/base58'
import drain from 'it-drain'
import IPFSBlockStorage from './ipfsBlockStorage'

@Injectable()
export class OrbitDbService {
  private orbitDbInstance: OrbitDBType | null = null
  private stores: Record<string, any> = {}
  private pendingHeads: Map<string, LogEntry[]> = new Map()
  public identities: IdentitiesType
  public static readonly events = new EventEmitter()

  private readonly logger = createLogger(OrbitDbService.name)

  constructor(@Inject(ORBIT_DB_DIR) public readonly orbitDbDir: string) {}

  get orbitDb() {
    if (this.orbitDbInstance == null) {
      this.logger.error('[get orbitDb]:no orbitDbInstance')
      throw new Error('[get orbitDb]:no orbitDbInstance')
    }
    return this.orbitDbInstance
  }

  public async create(peerId: PeerId, ipfs: Helia) {
    this.logger.info('Creating OrbitDB')
    if (this.orbitDbInstance != null) {
      this.logger.warn(`Already had an instance of OrbitDB, returning...`)
      return
    }

    orbitDbUseAccessController(MessagesAccessController)

    this.identities = await IdentitiesWithStorage(this.orbitDbDir, ipfs)

    const orbitDb = await createOrbitDB({
      ipfs,
      id: peerId.toString(),
      directory: this.orbitDbDir,
      identities: this.identities,
    })

    this.orbitDbInstance = orbitDb
  }

  public async stop() {
    if (this.orbitDbInstance != null) {
      this.logger.info('Stopping OrbitDB')
      try {
        await this.orbitDbInstance.stop()
      } catch (err) {
        this.logger.error(`Following error occured during closing orbitdb database`, err)
      }
    }

    this.orbitDbInstance = null
  }

  public async open<T>(address: string, options?: OrbitDBOpenOptions): Promise<T> {
    if (this.orbitDbInstance == null) {
      throw new Error('OrbitDB instance is not initialized. Call create() first.')
    }
    const store = await this.orbitDbInstance.open<T>(address, options)
    this.stores[address] = store
    this.logger.info(`Opened OrbitDB store at address: ${address}`)

    if (this.pendingHeads.has(address)) {
      const heads = this.pendingHeads.get(address) || []
      await this.joinHeads(address, heads)
    }
    return store
  }

  private async joinHeads(address: string, heads: LogEntry[]): Promise<void> {
    if (this.orbitDbInstance == null) {
      throw new Error('OrbitDB instance is not initialized. Call create() first.')
    }
    const store = this.stores[address]
    if (!store) {
      this.logger.warn(`No store found for address ${address}, skipping join`)
      // Keep heads in pendingHeads for later
      this.pendingHeads.set(address, heads)
      return
    }
    // Map each joinEntry to its promise
    const joinPromises = heads.map(head =>
      store
        .joinEntry(head)
        .then(() => {
          this.logger.info(`Successfully joined entry ${head.hash} to store ${address}`)
          // Remove from pendingHeads if all heads joined
          const pending = this.pendingHeads.get(address) || []
          this.pendingHeads.set(
            address,
            pending.filter(h => h.hash !== head.hash)
          )
          if ((this.pendingHeads.get(address)?.length ?? 0) === 0) {
            this.pendingHeads.delete(address)
          }
        })
        .catch((err: unknown) => {
          this.logger.warn(`Failed to join entry ${head.hash} to store ${address}`, err)
        })
    )
    await Promise.all(joinPromises)
  }

  public async ingestEntries(entries: LogEntry[]): Promise<void> {
    if (this.orbitDbInstance == null) {
      throw new Error('OrbitDB instance is not initialized. Call create() first.')
    }
    const newHeads: Map<string, LogEntry[]> = new Map()
    for (const entry of entries) {
      const cid = CID.parse(entry.hash, base58btc)
      await this.orbitDbInstance.ipfs.blockstore.put(cid, entry.bytes)
      await drain(this.orbitDbInstance.ipfs.pins.add(cid))

      if (!newHeads.has(entry.id)) {
        newHeads.set(entry.id, [entry])
        continue
      }
      const currentMaxHead = newHeads.get(entry.id)?.[0]
      if (currentMaxHead?.clock && currentMaxHead.clock.time < entry.clock.time) {
        newHeads.set(entry.id, [entry])
      } else if (currentMaxHead?.clock && currentMaxHead.clock.time === entry.clock.time) {
        newHeads.get(entry.id)?.push(entry)
      }
    }

    // For each id, try to join heads (async, using joinQueue)
    const joinAll = Array.from(newHeads.entries()).map(([id, heads]) => this.joinHeads(id, heads))
    await Promise.all(joinAll)
  }

  public static async createDefaultStorage(
    baseDirectory: string,
    address: string,
    ipfs: HeliaLibp2p,
    pinIpfs: boolean = true
  ): Promise<OrbitDbStorage> {
    const entryStorage = await ComposedStorage(
      await LRUStorage({ size: 1000 }),
      await IPFSBlockStorage({ ipfs, pin: pinIpfs }),
      OrbitDbService.events
    )

    const headsStorage = await ComposedStorage(
      await LRUStorage({ size: 1000 }),
      await LevelStorage({
        path: posixJoin(baseDirectory || './orbitdb', `./${address}/log/_heads/`),
        valueEncoding: 'buffer',
      }),
      OrbitDbService.events
    )

    const indexStorage = await ComposedStorage(
      await LRUStorage({ size: 1000 }),
      await LevelStorage({
        path: posixJoin(baseDirectory || './orbitdb', `./${address}/log/_index/`),
        valueEncoding: 'buffer',
      }),
      OrbitDbService.events
    )

    return {
      entryStorage,
      headsStorage,
      indexStorage,
    }
  }
}
