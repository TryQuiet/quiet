import { Module } from '@nestjs/common'
import { create } from 'ipfs-core'
import { IPFS_PROVIDER, IPFS_REPO_PATCH, LIB_P2P_PROVIDER, PEER_ID_PROVIDER } from '../const'
import { Libp2p } from 'libp2p'
import { peerIdFromKeys } from '@libp2p/peer-id'
import { PeerId as PeerIdType } from '@quiet/types'
import PeerId from 'peer-id'
import { Libp2pModule } from '../libp2p/libp2p.module'
import { IpfsFileManagerService } from './ipfs-file-manager.service'

// const ipfsProvider = {
//   provide: IPFS_PROVIDER,
//   useFactory: async (libp2p: Libp2p | PromiseLike<Libp2p>, ipfsRepoPath: string, peerID: PeerIdType) => {
//     console.log('ELLLLLLLLLLLO !!!!!')
//     const restoredRsa = await PeerId.createFromJSON(peerID)
//     const _peerId = await peerIdFromKeys(restoredRsa.marshalPubKey(), restoredRsa.marshalPrivKey())
//     const ipfs = await create({
//       libp2p: async () => await libp2p,
//       preload: { enabled: false },
//       repo: ipfsRepoPath,
//       EXPERIMENTAL: {
//         ipnsPubsub: true
//       },
//       init: {
//         privateKey: _peerId
//       }
//     })
//   return ipfs
//   },
//   inject: [LIB_P2P_PROVIDER, IPFS_REPO_PATCH, PEER_ID_PROVIDER],

// }

@Module({
  providers: [IpfsFileManagerService],
  exports: [IpfsFileManagerService]
})
export class IpfsFileManagerModule {}
