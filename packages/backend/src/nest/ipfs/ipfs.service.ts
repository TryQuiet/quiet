import { Inject, Injectable } from '@nestjs/common'
import { createHelia, HeliaLibp2p, type Helia } from 'helia'
import { bitswap } from '@helia/block-brokers'
import { IPFS_REPO_PATCH } from '../const'
import { createLogger } from '../common/logger'
import { LevelDatastore } from 'datastore-level'
import { LevelBlockstore, LevelBlockstoreInit } from 'blockstore-level'
import { Libp2pService } from '../libp2p/libp2p.service'
import { DatabaseOptions, Level } from 'level'
import { BITSWAP_PROTOCOL } from '../libp2p/libp2p.const'
import * as fs from 'fs/promises'
import * as path from 'path'
import { SigChainService } from '../auth/sigchain.service'

type StoreInit = {
  blockstore?: Omit<LevelBlockstoreInit, 'valueEncoding' | 'keyEncoding'>
  datastore?: Omit<DatabaseOptions<string, Uint8Array>, 'valueEncoding' | 'keyEncoding'>
}

type Blockstore = {
  store: LevelBlockstore
  db: Level<string, Uint8Array>
}

type Datastore = {
  store: LevelDatastore
  db: Level<string, Uint8Array>
}

@Injectable()
export class IpfsService {
  public ipfsInstance: HeliaLibp2p | null
  private blockstore: Blockstore | null
  private datastore: Datastore | null

  private started: boolean
  private readonly logger = createLogger(IpfsService.name)

  constructor(
    @Inject(IPFS_REPO_PATCH) public readonly ipfsRepoPath: string,
    public readonly libp2pService: Libp2pService,
    public readonly auth: SigChainService
  ) {
    this.started = false
  }

  public async createInstance(): Promise<HeliaLibp2p> {
    const libp2pInstance = this.libp2pService?.libp2pInstance

    let ipfs: HeliaLibp2p
    try {
      if (!libp2pInstance) {
        this.logger.error('Libp2p instance required')
        throw new Error('Libp2p instance required')
      }

      this.logger.info(`Initializing Helia datastore and blockstore`)
      await this.initializeStores()

      this.logger.info(`Creating Helia instance`)
      const bitstwapInstance = bitswap({
        incomingStreamTimeout: 60_000,
        sendBlocksTimeout: 30_000,
        sendBlocksDebounce: 10,
        // @ts-expect-error This is part of the config interface but it isn't typed that way
        messageReceiveTimeout: 30_000,
        protocol: BITSWAP_PROTOCOL,
        maxInboundStreams: 512,
        maxOutboundStreams: 512,
        sendBlocksConcurrency: 10,
      })
      ipfs = await createHelia({
        start: false,
        libp2p: libp2pInstance,
        blockstore: this.blockstore!.store,
        datastore: this.datastore!.store,
        blockBrokers: [bitstwapInstance],
      })
      this.ipfsInstance = ipfs
    } catch (error) {
      this.logger.error('IPFS creation failed', error)
      throw new Error('IPFS creation failed')
    }

    return this.ipfsInstance
  }

  private async initializeStores(init?: StoreInit, repoPathOverride?: string): Promise<void> {
    this.datastore = await this.createDatastore(init?.datastore, repoPathOverride)
    this.blockstore = await this.createBlockstore(init?.blockstore, repoPathOverride)
  }

  private async ensureDirExists(dir: string) {
    try {
      await fs.mkdir(dir, { recursive: true })
    } catch (e) {
      // ignore if already exists
    }
  }

  private async createDatastore(
    init?: DatabaseOptions<string, Uint8Array>,
    repoPathOverride?: string
  ): Promise<Datastore> {
    let datastoreInit: DatabaseOptions<string, Uint8Array> = {
      keyEncoding: 'utf8',
      valueEncoding: 'buffer',
    }

    if (init != null) {
      datastoreInit = {
        ...datastoreInit,
        ...init,
      }
    }

    if (datastoreInit.valueEncoding != 'buffer') {
      throw new Error(`Datastore valueEncoding was set to ${datastoreInit.valueEncoding} but MUST be set to 'buffer'!`)
    }

    if (datastoreInit.keyEncoding != 'utf8') {
      throw new Error(`Datastore keyEncoding was set to ${datastoreInit.keyEncoding} but MUST be set to 'utf8'!`)
    }

    const basePath = repoPathOverride || this.ipfsRepoPath
    const dataDir = path.join(basePath, `data_${this.auth.team.id ?? ''}`)
    await this.ensureDirExists(dataDir)
    this.logger.info(`Creating LevelDB at ${dataDir}`)
    const datastoreLevelDb = new Level<string, Uint8Array>(dataDir, datastoreInit)
    this.logger.info(`Created LevelDB at ${dataDir}`)
    const datastore = new LevelDatastore(datastoreLevelDb, datastoreInit)
    this.logger.info(`Datastore created at ${dataDir}`)
    return {
      db: datastoreLevelDb,
      store: datastore,
    }
  }

  private async createBlockstore(init?: LevelBlockstoreInit, repoPathOverride?: string): Promise<Blockstore> {
    let blockstoreInit: LevelBlockstoreInit = {
      keyEncoding: 'utf8',
      valueEncoding: 'buffer',
      createIfMissing: true,
      errorIfExists: false,
      version: 1,
    }

    if (init != null) {
      blockstoreInit = {
        ...blockstoreInit,
        ...init,
      }
    }

    if (blockstoreInit.valueEncoding != 'buffer') {
      throw new Error(
        `Blockstore valueEncoding was set to ${blockstoreInit.valueEncoding} but MUST be set to 'buffer'!`
      )
    }

    if (blockstoreInit.keyEncoding != 'utf8') {
      throw new Error(`Blockstore keyEncoding was set to ${blockstoreInit.keyEncoding} but MUST be set to 'utf8'!`)
    }

    const basePath = repoPathOverride || this.ipfsRepoPath
    const blocksDir = path.join(basePath, `blocks_${this.auth.team.id ?? ''}`)
    await this.ensureDirExists(blocksDir)
    this.logger.info(`Creating LevelDB at ${blocksDir}`)
    const blockstoreLevelDb = new Level<string, Uint8Array>(blocksDir, blockstoreInit)
    this.logger.info(`Created LevelDB at ${blocksDir}`)
    this.logger.info(`Creating LevelBlockstore at ${blocksDir}`)
    const blockstore = new LevelBlockstore(blockstoreLevelDb, blockstoreInit)
    this.logger.info(`LevelDB created at ${blocksDir}`)
    return {
      db: blockstoreLevelDb,
      store: blockstore,
    }
  }

  public async start() {
    this.logger.info(`Starting IPFS Service`)
    if (!this.ipfsInstance) {
      throw new Error('IPFS instance does not exist')
    }

    this.logger.info(`Opening Helia blockstore db`)
    await this.blockstore!.db.open()
    this.logger.info(`Opening Helia blockstore store`)
    await this.blockstore!.store.open()

    this.logger.info(`Opening Helia datastore db`)
    await this.datastore!.db.open()
    this.logger.info(`Opening Helia datastore store`)
    await this.datastore!.store.open()

    this.logger.info(`Starting Helia`)
    await this.ipfsInstance.start()

    this.started = true
    this.logger.info(`IPFS Service has started`)
  }

  public isStarted() {
    return this.started
  }

  public async stop() {
    this.logger.info('Stopping IPFS')

    try {
      await this.ipfsInstance?.stop()
    } catch (e) {
      if (!(e as Error).message.includes('Database is not open')) {
        this.logger.error(`Error while closing IPFS instance`, e)
        throw e
      }
    }

    // gives libp2p a tick to close its services
    await new Promise<void>(r => setImmediate(r))

    try {
      await this.blockstore?.db.close()
      await this.blockstore?.store.close()
    } catch (e) {
      if (!(e as Error).message.includes('Database is not open')) {
        this.logger.error(`Error while closing IPFS blockstore`, e)
        throw e
      }
    }

    try {
      await this.datastore?.db.close()
      await this.datastore?.store.close()
    } catch (e) {
      if (!(e as Error).message.includes('Database is not open')) {
        this.logger.error(`Error while closing IPFS datastore`, e)
        throw e
      }
    }
    this.started = false
  }

  public async destroyInstance() {
    try {
      await this.stop()
    } catch (error) {
      this.logger.error('Error while destroying IPFS instance', error)
    }

    // Remove all event listeners from ipfsInstance if possible
    if (this.ipfsInstance && typeof (this.ipfsInstance as any).removeAllListeners === 'function') {
      ;(this.ipfsInstance as any).removeAllListeners()
    }
    // Remove all event listeners from blockstore and datastore if possible
    if (this.blockstore?.db && typeof (this.blockstore.db as any).removeAllListeners === 'function') {
      ;(this.blockstore.db as any).removeAllListeners()
    }
    if (this.blockstore?.store && typeof (this.blockstore.store as any).removeAllListeners === 'function') {
      ;(this.blockstore.store as any).removeAllListeners()
    }
    if (this.datastore?.db && typeof (this.datastore.db as any).removeAllListeners === 'function') {
      ;(this.datastore.db as any).removeAllListeners()
    }
    if (this.datastore?.store && typeof (this.datastore.store as any).removeAllListeners === 'function') {
      ;(this.datastore.store as any).removeAllListeners()
    }

    this.ipfsInstance = null
    this.blockstore = null
    this.datastore = null
    this.logger.info('IpfsService: all internal references and listeners nulled')
  }
}
