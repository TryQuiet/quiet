import { Inject, Injectable } from '@nestjs/common'
import { LazyModuleLoader } from '@nestjs/core'
import { createHelia, type Helia } from "helia"
import { IPFS_REPO_PATCH } from '../const'
import { createLogger } from '../common/logger'
import { LevelDatastore } from 'datastore-level'
import { FsBlockstore } from 'blockstore-fs'

@Injectable()
export class IpfsService {
  public ipfsInstance: Helia | null
  private started: boolean
  private readonly logger = createLogger(IpfsService.name)

  constructor(
    @Inject(IPFS_REPO_PATCH) public readonly ipfsRepoPath: string,
    private readonly lazyModuleLoader: LazyModuleLoader
  ) {
    this.started = false
  }

  public async createInstance(): Promise<Helia> {
    const { Libp2pModule } = await import('../libp2p/libp2p.module')
    const moduleRef = await this.lazyModuleLoader.load(() => Libp2pModule)
    const { Libp2pService } = await import('../libp2p/libp2p.service')
    const libp2pService = moduleRef.get(Libp2pService)
    const libp2pInstance = libp2pService?.libp2pInstance

    let ipfs: Helia
    try {
      if (!libp2pInstance) {
        this.logger.error('Libp2p instance required')
        throw new Error('Libp2p instance required')
      }
      ipfs = await createHelia({
        start: false,
        libp2p: libp2pInstance,
        blockstore: new FsBlockstore(this.ipfsRepoPath + '/blocks'),
        datastore: new LevelDatastore(this.ipfsRepoPath + '/data')
      })
      this.ipfsInstance = ipfs
    } catch (error) {
      this.logger.error('IPFS creation failed', error)
      throw new Error('IPFS creation failed')
    }

    return this.ipfsInstance
  }

  public async start() {
    await this.ipfsInstance?.start()
    this.started = true
  }

  public async isStarted() {
    return this.started
  }

  public async stop() {
    await this.ipfsInstance?.stop()
    this.started = false
  }

  public async destoryInstance() {
    try {
      await this.stop()
    } catch (error) {
      this.logger.error('Error while destroying IPFS instance', error)
    }
    this.ipfsInstance = null
  }
}
