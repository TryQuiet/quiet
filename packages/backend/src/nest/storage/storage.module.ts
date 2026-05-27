import { Module } from '@nestjs/common'
import { StorageService } from './storage.service'
import { LocalDbModule } from '../local-db/local-db.module'
import { IpfsFileManagerModule } from '../ipfs-file-manager/ipfs-file-manager.module'
import { IpfsModule } from '../ipfs/ipfs.module'
import { SigChainModule } from '../auth/sigchain.service.module'
import { OrbitDbModule } from './orbitDb/orbitdb.module'
import { CommonModule } from '../common/common.module'

@Module({
  imports: [CommonModule, LocalDbModule, IpfsModule, IpfsFileManagerModule, SigChainModule, OrbitDbModule],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
