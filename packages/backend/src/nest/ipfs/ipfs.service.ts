import { Inject, Injectable } from '@nestjs/common'
import { createHelia, type Helia } from 'helia'
import { bitswap } from '@helia/block-brokers'
import { IPFS_REPO_PATCH } from '../const'
import { createLogger } from '../common/logger'
import { LevelDatastore } from 'datastore-level'
import { FsBlockstore, FsBlockstoreInit } from 'blockstore-fs'
import { Libp2pService } from '../libp2p/libp2p.service'
import { DatabaseOptions, Level } from 'level'

type StoreInit = {
  blockstore?: FsBlockstoreInit
  datastore?: Omit<DatabaseOptions<string, Uint8Array>, 'valueEncoding' | 'keyEncoding'>
}

@Injectable()
export class IpfsService {
  public ipfsInstance: Helia | null
  private blockstore: FsBlockstore | null
  private datastore: LevelDatastore | null

  private started: boolean
  private readonly logger = createLogger(IpfsService.name)

  constructor(
    @Inject(IPFS_REPO_PATCH) public readonly ipfsRepoPath: string,
    private readonly libp2pService: Libp2pService
  ) {
    this.started = false
  }

  public async createInstance(): Promise<Helia> {
    const libp2pInstance = this.libp2pService?.libp2pInstance

    let ipfs: Helia
    try {
      if (!libp2pInstance) {
        this.logger.error('Libp2p instance required')
        throw new Error('Libp2p instance required')
      }

      this.logger.info(`Initializing Helia datastore and blockstore`)
      await this.initializeStores()

      this.logger.info(`Creating Helia instance`)
      ipfs = await createHelia({
        start: false,
        libp2p: libp2pInstance,
        blockstore: this.blockstore!,
        datastore: this.datastore!,
        blockBrokers: [bitswap()],
      })
      this.ipfsInstance = ipfs
    } catch (error) {
      this.logger.error('IPFS creation failed', error)
      throw new Error('IPFS creation failed')
    }

    return this.ipfsInstance
  }

  private async initializeStores(init?: StoreInit): Promise<void> {
    let datastoreInit: DatabaseOptions<string, Uint8Array> = {
      keyEncoding: 'utf8',
      valueEncoding: 'buffer',
    }

    if (init?.datastore != null) {
      datastoreInit = {
        ...datastoreInit,
        ...init.datastore,
      }
    }

    if (datastoreInit.valueEncoding != 'buffer') {
      throw new Error(`valueEncoding was set to ${datastoreInit.valueEncoding} but MUST be set to 'buffer'!`)
    }

    if (datastoreInit.valueEncoding != 'buffer') {
      throw new Error(`keyEncoding was set to ${datastoreInit.keyEncoding} but MUST be set to 'utf8'!`)
    }

    let blockstoreInit: FsBlockstoreInit = {}

    if (init?.blockstore != null) {
      blockstoreInit = {
        ...blockstoreInit,
        ...init.blockstore,
      }
    }

    this.blockstore = new FsBlockstore(this.ipfsRepoPath + '/blocks', blockstoreInit)

    const levelDb = new Level<string, Uint8Array>(this.ipfsRepoPath + '/data', datastoreInit)
    this.datastore = new LevelDatastore(levelDb)
  }

  public async start() {
    this.logger.info(`Starting IPFS Service`)
    if (!this.ipfsInstance) {
      throw new Error('IPFS instance does not exist')
    }

    this.logger.info(`Opening Helia blockstore`)
    await this.blockstore!.open()

    this.logger.info(`Opening Helia datastore`)
    await this.datastore!.open()

    this.logger.info(`Starting Helia`)
    await this.ipfsInstance.start()

    this.started = true
    this.logger.info(`IPFS Service has started`)
  }

  public async isStarted() {
    return this.started
  }

  public async stop() {
    this.logger.info('Stopping IPFS')
    if (!this.ipfsInstance) {
      throw new Error('IPFS instance does not exist')
    }
    await this.ipfsInstance.stop()
    await this.blockstore?.close()
    await this.datastore?.close()
    this.started = false
  }

  public async destoryInstance() {
    try {
      await this.stop()
    } catch (error) {
      this.logger.error('Error while destroying IPFS instance', error)
    }
    this.ipfsInstance = null
    this.blockstore = null
    this.datastore = null
  }
}
