import { Module } from '@nestjs/common'
import { COMMUNITY_PROVIDER, IPFS_PROVIDER, ORBIT_DB_DIR, ORBIT_DB_PROVIDER, PEER_ID_PROVIDER, QUIET_DIR } from '../const'
import { IpfsFileManagerModule } from '../ipfs-file-manager/ipfs-file-manager.module'
import { StorageService } from './storage.service'
import OrbitDB from 'orbit-db'
import { LocalDbService } from '../local-db/local-db.service'
import { LocalDBKeys } from '../local-db/local-db.types'
import type { IPFS } from 'ipfs-core'
import AccessControllers from 'orbit-db-access-controllers'
import { MessagesAccessController } from './MessagesAccessController'
import { createChannelAccessController } from './ChannelsAccessController'
import PeerId from 'peer-id'

const peerIdProvider = {
  provide: PEER_ID_PROVIDER,
 useFactory: async (localDbService: LocalDbService) => {
  const isPeerId = await localDbService.get(LocalDBKeys.PEER_ID)
  if (isPeerId) {
    return isPeerId
  } else {
    const newPeerId: PeerId = await PeerId.create()
    await localDbService.put(LocalDBKeys.PEER_ID, newPeerId)
    return newPeerId
  }
 },
 inject: [LocalDbService]
}

// KACPER - peerID
const orbitDbProvider = {
  provide: ORBIT_DB_PROVIDER,
  useFactory: async (ipfs: IPFS, peerId: PeerId, orbitDbDir: string) => {
    const channelsAccessController = createChannelAccessController(peerId, orbitDbDir)
    AccessControllers.addAccessController({ AccessController: MessagesAccessController })
    AccessControllers.addAccessController({ AccessController: channelsAccessController })

    const orbitDb = await OrbitDB.createInstance(ipfs, {
      // @ts-ignore
      id: peerId.toString(),
      directory: orbitDbDir,
      AccessControllers
  })

    return orbitDb
  },

  inject: [IPFS_PROVIDER, PEER_ID_PROVIDER, ORBIT_DB_DIR],

}

const communityProvider = {
  provide: COMMUNITY_PROVIDER,
  useFactory: async (localDbService: LocalDbService) => await localDbService.get(LocalDBKeys.COMMUNITY),
  inject: [LocalDbService]
}

@Module({
    imports: [IpfsFileManagerModule, IpfsFileManagerModule], // KACPER
    providers: [StorageService,
      orbitDbProvider, communityProvider, peerIdProvider
    ],
    exports: [StorageService, orbitDbProvider, communityProvider, peerIdProvider],
  })
export class StorageModule {}
