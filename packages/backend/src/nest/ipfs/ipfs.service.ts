import { Inject, Injectable } from '@nestjs/common'
import { createHelia, type Helia } from "helia"
import { bitswap } from '@helia/block-brokers'
import { IPFS_REPO_PATCH } from '../const'
import { createLogger } from '../common/logger'
import { LevelDatastore } from 'datastore-level'
import { FsBlockstore } from 'blockstore-fs'
import { Libp2pService } from '../libp2p/libp2p.service'

@Injectable()
export class IpfsService {
  public ipfsInstance: Helia | null
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
      ipfs = await createHelia({
        start: false,
        libp2p: libp2pInstance,
        blockstore: new FsBlockstore(this.ipfsRepoPath + '/blocks'),
        datastore: new LevelDatastore(this.ipfsRepoPath + '/data'),
        blockBrokers: [ bitswap() ],
      })
      this.ipfsInstance = ipfs
    } catch (error) {
      this.logger.error('IPFS creation failed', error)
      throw new Error('IPFS creation failed')
    }

    return this.ipfsInstance
  }

  public async start() {
    if (!this.ipfsInstance) {
      throw new Error('IPFS instance does not exist')
    }
    await this.ipfsInstance.start()
    this.started = true
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
