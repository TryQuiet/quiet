import { Module } from '@nestjs/common'
import { IpfsFileManagerService } from './ipfs-file-manager.service'
import type { IPFS, create as createType } from 'ipfs-core'
import { create } from 'ipfs-core'
import { IPFS_PROVIDER } from '../const'
import { Libp2p } from 'libp2p/dist/src'

const ipfsProvider = {
  provide: IPFS_PROVIDER,
  useFactory: async (libp2p: Libp2p | PromiseLike<Libp2p>, ipfsRepoPath: any, peerID: any) => {
  return await create({
    libp2p: async () => libp2p,
    preload: { enabled: false },
    repo: ipfsRepoPath,
    EXPERIMENTAL: {
      ipnsPubsub: true
    },
    init: {
      privateKey: peerID
    }
  })
  },
  inject: [],

}

@Module({
  providers: [IpfsFileManagerService, ipfsProvider],
  exports: [IpfsFileManagerService, ipfsProvider]
})
export class IpfsFileManagerModule {}
