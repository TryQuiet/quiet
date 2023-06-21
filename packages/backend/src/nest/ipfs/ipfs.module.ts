import { Module } from '@nestjs/common'
import { IpfsService } from './ipfs.service'

@Module({
  providers: [IpfsService],
  exports: [IpfsService]
})
export class IpfsModule {}
