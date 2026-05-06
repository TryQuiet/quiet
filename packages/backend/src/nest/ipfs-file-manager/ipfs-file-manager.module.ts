import { forwardRef, Module } from '@nestjs/common'
import { IpfsFileManagerService } from './ipfs-file-manager.service'
import { IpfsModule } from '../ipfs/ipfs.module'
import { SigChainModule } from '../auth/sigchain.service.module'
import { ImageCompressionModule } from '../image-compression/image-compression.module'

@Module({
  imports: [forwardRef(() => IpfsModule), SigChainModule, ImageCompressionModule],
  providers: [IpfsFileManagerService],
  exports: [IpfsFileManagerService],
})
export class IpfsFileManagerModule {}
