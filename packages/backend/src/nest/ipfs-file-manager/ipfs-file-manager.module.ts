import { Module } from '@nestjs/common'
import { IpfsFileManagerService } from './ipfs-file-manager.service'
import { create } from 'ipfs-core'
import { IPFS_PROVIDER, IPFS_REPO_PATCH } from '../const'
import { Libp2p } from 'libp2p'
import type { IPFS } from 'ipfs-core'

// KACPER
const ipfsProvider = {
  provide: IPFS_PROVIDER,
  useFactory: async (libp2p: Libp2p | PromiseLike<Libp2p>, ipfsRepoPath: string, peerID: any) => {
  return await create({
    libp2p: async () => await libp2p,
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
  inject: ['libp2p', IPFS_REPO_PATCH, 'peerID'],

}

@Module({
  providers: [IpfsFileManagerService, ipfsProvider],
  exports: [IpfsFileManagerService, ipfsProvider]
})
export class IpfsFileManagerModule {}
