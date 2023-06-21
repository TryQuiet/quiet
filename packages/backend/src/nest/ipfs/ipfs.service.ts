import { Inject, Injectable, Logger } from '@nestjs/common'
import { LazyModuleLoader } from '@nestjs/core'
import { create, IPFS } from 'ipfs-core'
import { IPFS_REPO_PATCH, PEER_ID_PROVIDER } from '../const'
import { peerIdFromKeys } from '@libp2p/peer-id'
import { PeerId as PeerIdType } from '@quiet/types'
import PeerId from 'peer-id'

@Injectable()
export class IpfsService {
  public ipfsInstance: IPFS | null

  private readonly logger = new Logger(IpfsService.name)
  constructor(
    @Inject(PEER_ID_PROVIDER) public readonly peerId: PeerIdType,
    @Inject(IPFS_REPO_PATCH) public readonly ipfsRepoPath: string,
    private readonly lazyModuleLoader: LazyModuleLoader
  ) {}

  public async create() {
    if (this.ipfsInstance) {
      return this.ipfsInstance
    }

    const { Libp2pModule } = await import('../libp2p/libp2p.module')
    const moduleRef = await this.lazyModuleLoader.load(() => Libp2pModule)
    const { Libp2pService } = await import('../libp2p/libp2p.service')
    const libp2pService = moduleRef.get(Libp2pService)
    const libp2pInstance = libp2pService?.libp2pInstance

    const restoredRsa = await PeerId.createFromJSON(this.peerId)
    const _peerId = await peerIdFromKeys(restoredRsa.marshalPubKey(), restoredRsa.marshalPrivKey())

    let ipfs: IPFS
    try {
      if (!libp2pInstance) {
        this.logger.error('no libp2p instance')
        throw new Error('no libp2p instance')
      }
      ipfs = await create({
        libp2p: async () => libp2pInstance,
        preload: { enabled: false },
        repo: this.ipfsRepoPath,
        EXPERIMENTAL: {
          ipnsPubsub: true
        },
        init: {
          privateKey: _peerId
        }
      })
      this.ipfsInstance = ipfs
    } catch (error) {
      this.logger.error('ipfs creation failed', error)
    }

    return this.ipfsInstance
  }
}
