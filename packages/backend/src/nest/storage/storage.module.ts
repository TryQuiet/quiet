import { Module } from '@nestjs/common'
import { COMMUNITY_PROVIDER, ORBIT_DB, ORBIT_DB_DIR, ORBIT_DB_PROVIDER, QUIET_DIR } from '../const'
import { IpfsFileManagerModule } from '../ipfs-file-manager/ipfs-file-manager.module'
import { StorageService } from './storage.service'
import path from 'path'
import OrbitDB from 'orbit-db'
import { LocalDbService } from '../local-db/local-db.service'
import { LocalDBKeys } from '../local-db/local-db.types'

const orbitDbProvider = {
  provide: ORBIT_DB_PROVIDER,
  useFactory: async (ipfs: any, peerId: any, orbitDbDir: any, accessControllers: any) => await OrbitDB.createInstance(ipfs, {
    id: peerId.toString(),
    directory: orbitDbDir,
    AccessControllers: accessControllers
  }),
  inject: ['ipfs', 'peerId', 'orbitDbDir', 'accessControllers'],

}

const communityProvider = {
  provide: COMMUNITY_PROVIDER,
  useFactory: async (localDbService: LocalDbService) => await localDbService.get(LocalDBKeys.COMMUNITY),
  inject: [LocalDbService]
}

@Module({
    imports: [IpfsFileManagerModule],
    providers: [StorageService,
      orbitDbProvider, communityProvider
    ],
    exports: [StorageService, orbitDbProvider, communityProvider],
  })
export class StorageModule {}
