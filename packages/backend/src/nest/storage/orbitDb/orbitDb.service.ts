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
import { base58btc } from 'multiformats/dist/src/bases/base58'
import drain from 'it-drain'
import IPFSBlockStorage from './ipfsBlockStorage'

@Injectable()
export class OrbitDbService {
  private orbitDbInstance: OrbitDBType | null = null
  private stores: Record<string, any> = {}
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
    return store
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
    // join heads to populate indexes and heads storage
    for (const [id, heads] of newHeads.entries()) {
      const store = this.stores[id]
      if (store) {
        for (const head of heads) {
          try {
            await store.joinEntry(head)
          } catch (err) {
            this.logger.error(`Failed to join entry ${head.hash} to store ${id}`, err)
          }
        }
      } else {
        this.logger.warn(`No store found for address ${id}, skipping join`)
      }
    }
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
