import { Module } from '@nestjs/common'
import { StorageService } from './storage.service'
import { LocalDbModule } from '../local-db/local-db.module'
import { IpfsFileManagerModule } from '../ipfs-file-manager/ipfs-file-manager.module'
import { OrbitDb } from './orbitDb.service'

@Module({
  imports: [LocalDbModule, IpfsFileManagerModule],
  providers: [StorageService, OrbitDb],
  exports: [StorageService],
})
export class StorageModule {}
