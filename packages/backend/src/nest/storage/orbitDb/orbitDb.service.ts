import { CID } from 'multiformats/cid'
import { base58btc } from 'multiformats/bases/base58'
import { Inject, Injectable } from '@nestjs/common'
import EventEmitter from 'events'

import { ORBIT_DB_DIR } from '../../const'
import { createLogger } from '../../common/logger'
import { logEntryToLogUpdate, posixJoin } from './util'
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
  Entry,
  DatabaseType,
} from '@orbitdb/core'
import { HeliaLibp2p } from 'helia'
import { OrbitDbStorage } from '../../types'
import { IdentitiesWithStorage } from './identitiesWithStorage'
import drain from 'it-drain'
import IPFSBlockStorage from './ipfsBlockStorage'
import { LocalDbService } from '../../local-db/local-db.service'
import { SigChainService } from '../../auth/sigchain.service'
import { QSSLogEntrySyncMessage } from '../../qss/qss.types'
import { LogUpdate } from './orbitdb.types'

@Injectable()
export class OrbitDbService {
  private orbitDbInstance: OrbitDBType | undefined = undefined
  private stores: Record<string, any> = {}
  public identities: IdentitiesType | undefined = undefined
  public static readonly events = new EventEmitter()

  private readonly logger = createLogger(OrbitDbService.name)

  constructor(
    @Inject(ORBIT_DB_DIR) public readonly orbitDbDir: string,
    private readonly localDbService: LocalDbService,
    private readonly sigChainService: SigChainService
  ) {}

  get orbitDb() {
    if (this.orbitDbInstance == undefined) {
      this.logger.error('[get orbitDb]:no orbitDbInstance')
      throw new Error('[get orbitDb]:no orbitDbInstance')
    }
    return this.orbitDbInstance
  }

  public async create(ipfs: HeliaLibp2p) {
    this.logger.info('Creating OrbitDB')
    if (this.orbitDbInstance != undefined) {
      this.logger.warn(`Already had an instance of OrbitDB, returning...`)
      return
    }

    orbitDbUseAccessController(MessagesAccessController)

    this.identities = await IdentitiesWithStorage(this.orbitDbDir, ipfs)

    const peerId = ipfs.libp2p.peerId
    const orbitDb = await createOrbitDB({
      ipfs,
      id: peerId.toString(),
      directory: this.orbitDbDir,
      identities: this.identities,
    })

    this.orbitDbInstance = orbitDb

    ipfs.libp2p.addEventListener('peer:connect', async event => {
      this.logger.info('Peer connected. Attempting to join heads they may have ancestors of')
      await this.joinPendingHeads()
    })
  }

  public async startSync(address?: string) {
    if (this.orbitDbInstance == undefined) {
      throw new Error('OrbitDB instance is not initialized. Call create() first.')
    }
    if (address && !this.stores[address]) {
      throw new Error(`No store found for address ${address}. Cannot start sync.`)
    }
    for (const store of Object.values(this.stores)) {
      if (address && store.address !== address) {
        continue
      }
      await store.sync?.start?.()
      this.logger.info(`Started sync for store ${store.address}`)
    }
  }

  public async stopSync(address?: string) {
    if (this.orbitDbInstance == undefined) {
      throw new Error('OrbitDB instance is not initialized. Call create() first.')
    }
    if (address && !this.stores[address]) {
      throw new Error(`No store found for address ${address}. Cannot stop sync.`)
    }
    for (const store of Object.values(this.stores)) {
      if (address && store.address !== address) {
        continue
      }
      await store.sync?.stop?.()
      this.logger.info(`Stopped sync for store ${store.address}`)
    }
  }

  public async stop() {
    if (this.orbitDbInstance != undefined) {
      this.logger.info('Stopping OrbitDB')
      try {
        await this.orbitDbInstance.stop()
      } catch (err) {
        this.logger.error(`Error during closing orbitdb database`, err)
      }
    }
    this.stores = {}
    this.orbitDbInstance = undefined
    this.identities = undefined
  }

  public async open<T extends DatabaseType>(address: string, options?: OrbitDBOpenOptions): Promise<T> {
    if (this.orbitDbInstance == undefined) {
      throw new Error('OrbitDB instance is not initialized. Call create() first.')
    }
    const store = await this.orbitDbInstance.open<T>(address, options)
    const storeAddress = (store as { address: string }).address
    this.stores[storeAddress] = store
    this.logger.info(`Opened OrbitDB store ${address} at address: ${storeAddress}`)

    // FIXME: this still creates multiple listeners for the same event emitter because we reuse the class event emitter for all stores
    store.events.on('update', (entry: LogEntry) => {
      if (entry.identity == this.orbitDbInstance?.identity.hash && entry.id === store.address) {
        this.logger.debug(`Store ${store.address} updated with entry ${entry.hash}`)
        OrbitDbService.events.emit('put', logEntryToLogUpdate(entry, store.address, store.meta['teamId']))
      }
    })

    await this.joinPendingHeads(storeAddress)
    return store
  }

  private async joinPendingHeads(address?: string): Promise<void> {
    if (this.orbitDbInstance == undefined) return

    const pendingHeads = await this.localDbService.getPendingHeads()
    if (!pendingHeads) return
    for (const [addr, cids] of Object.entries(pendingHeads as Record<string, CID[]>)) {
      if (address && addr !== address) continue
      const heads: LogEntry[] = []
      for await (const block of this.orbitDbInstance.ipfs.blockstore.getMany(cids)) {
        try {
          const logEntry = await Entry.decode(block.block)
          heads.push(logEntry)
        } catch (err) {
          this.logger.warn(`Failed to get block for pending head ${block.cid}`, err)
        }
      }
      await this.joinHeads(addr, heads)
    }
  }

  private async joinHeads(address: string, heads: LogEntry[]): Promise<void> {
    await this.localDbService.addPendingHead(
      address,
      heads.map(head => CID.parse(head.hash, base58btc))
    )

    if (this.orbitDbInstance == undefined) {
      return
    }

    const store = this.stores[address]
    if (!store) {
      return
    }

    const joinResults = await Promise.all(
      heads.map(async head => {
        try {
          await store.applyOperation(head.bytes)
          return head.hash
        } catch (err) {
          this.logger.warn(`Failed to join entry ${head.hash} to store ${address}`, err)
          return undefined
        }
      })
    )
    // Batch remove all successfully joined heads from pending heads
    const successfullyJoined = joinResults.filter((hash): hash is string => !!hash)
    if (successfullyJoined.length > 0) {
      await this.localDbService.removePendingHead(
        address,
        successfullyJoined.map(hash => CID.parse(hash, base58btc))
      )
    }
  }

  public async ingestEntries(entries: LogEntry[]): Promise<void> {
    if (this.orbitDbInstance == undefined) {
      throw new Error('OrbitDB instance is not initialized. Call create() first.')
    }
    const newHeads: Map<string, LogEntry[]> = new Map()
    for (const entry of entries) {
      const cid = CID.parse(entry.hash, base58btc)
      await this.orbitDbInstance.ipfs.blockstore.put(cid, entry.bytes)
      try {
        await drain(this.orbitDbInstance.ipfs.pins.add(cid))
      } catch (err) {
        if (err instanceof Error && !err.message.includes('Already pinned')) {
          this.logger.error(`Failed to pin entry ${entry.hash} in IPFS`, err)
        }
      }

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

  public async handleFanoutMessage(message: QSSLogEntrySyncMessage): Promise<void> {
    this.logger.debug('Ingesting fanout message, ', message.payload.hash)
    try {
      const logEntry: LogEntry = this.sigChainService.crypto.decryptAndVerify<LogEntry>(
        message.payload.encEntry.encrypted,
        message.payload.encEntry.signature
      ).contents
      await this.ingestEntries([logEntry])
    } catch (err) {
      this.logger.error(`Failed to handle fanout log entry sync message`, err)
    }
  }

  public async getLogEntriesByHashes(address: string, hashes: string[]): Promise<LogEntry[]> {
    if (this.orbitDbInstance == undefined) {
      throw new Error('OrbitDB instance is not initialized. Call create() first.')
    }

    return []
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

  public static updateMetadata(db: DatabaseType, metadata: Record<string, any>): void {
    db.meta = {
      ...(db.meta ?? {}),
      ...metadata,
    }
  }
}
