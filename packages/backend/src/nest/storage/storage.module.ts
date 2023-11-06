import { Module } from '@nestjs/common'
import { StorageService } from './storage.service'
import { UserProfileStore } from './UserProfileStore'
import { LocalDbModule } from '../local-db/local-db.module'
import { IpfsFileManagerModule } from '../ipfs-file-manager/ipfs-file-manager.module'

@Module({
  imports: [LocalDbModule, IpfsFileManagerModule],
  providers: [StorageService, UserProfileStore],
  exports: [StorageService, UserProfileStore],
})
export class StorageModule {}
