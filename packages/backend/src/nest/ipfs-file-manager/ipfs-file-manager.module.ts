import { Module } from '@nestjs/common'
import { IpfsFileManagerService } from './ipfs-file-manager.service'

@Module({
  providers: [IpfsFileManagerService],
  exports: [IpfsFileManagerService],
})
export class IpfsFileManagerModule {}
