import { Module } from '@nestjs/common'
import { IpfsService } from './ipfs.service'
import { Libp2pModule } from '../libp2p/libp2p.module'
import { SigChainModule } from '../auth/sigchain.service.module'

@Module({
  imports: [Libp2pModule, SigChainModule],
  providers: [IpfsService],
  exports: [IpfsService],
})
export class IpfsModule {}
