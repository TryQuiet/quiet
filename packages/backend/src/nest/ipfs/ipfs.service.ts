import { Inject, Injectable } from '@nestjs/common'
import { LazyModuleLoader } from '@nestjs/core'
import { create, IPFS, Options as IPFSOptions } from 'ipfs-core'
import { IPFS_REPO_PATCH } from '../const'
import Logger from '../common/logger'
import { Libp2p } from 'libp2p'

@Injectable()
export class IpfsService {
  public ipfsInstance: IPFS | null
  private counter = 0
  private readonly logger = Logger(IpfsService.name)
  constructor(
    @Inject(IPFS_REPO_PATCH) public readonly ipfsRepoPath: string,
    private readonly lazyModuleLoader: LazyModuleLoader
  ) {}

  public async createInstance(peerId: any) {
    this.counter++
    console.log('counter ipfs', this.counter)
    const { Libp2pModule } = await import('../libp2p/libp2p.module')
    const moduleRef = await this.lazyModuleLoader.load(() => Libp2pModule)
    const { Libp2pService } = await import('../libp2p/libp2p.service')
    const libp2pService = moduleRef.get(Libp2pService)
    const libp2pInstance = libp2pService?.libp2pInstance

    let ipfs: IPFS
    try {
      if (!libp2pInstance) {
        this.logger.error('no libp2p instance')
        throw new Error('no libp2p instance')
      }
      const getLibp2p = async (...args: any[]): Promise<Libp2p> => {
        return libp2pInstance
      }
      const ipfsConfig: IPFSOptions = {
        start: false,
        libp2p: getLibp2p,
        preload: { enabled: false },
        repo: this.ipfsRepoPath,
        EXPERIMENTAL: {
          ipnsPubsub: true,
        },
        init: {
          privateKey: peerId,
        },
      }
      this.logger('Creating new ipfs instance')
      ipfs = await create(ipfsConfig)
      this.ipfsInstance = ipfs
    } catch (error) {
      this.logger.error('ipfs creation failed', error)
    }

    return this.ipfsInstance
  }

  public async destoryInstance() {
    try {
      await this.ipfsInstance?.stop()
    } catch (error) {
      this.logger.error(error)
    }
    this.ipfsInstance = null
  }
}
