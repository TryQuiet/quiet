import { Module } from '@nestjs/common'
import { IpfsFileManagerService } from './ipfs-file-manager.service'
import { IpfsModule } from '../ipfs/ipfs.module'
import { SigChainModule } from '../auth/sigchain.service.module'
import { ImageCompressionService } from './image-compression.service'

@Module({
  imports: [IpfsModule, SigChainModule],
  providers: [IpfsFileManagerService, ImageCompressionService],
  exports: [IpfsFileManagerService, ImageCompressionService],
})
export class IpfsFileManagerModule {}
