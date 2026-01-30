import { Module } from '@nestjs/common'
import { SocketModule } from '../socket/socket.module'
import { QSSModule } from '../qss/qss.module'
import { SigChainModule } from '../auth/sigchain.service.module'
import { QPSService } from './qps.service'

@Module({
  imports: [SocketModule, QSSModule, SigChainModule],
  providers: [QPSService],
  exports: [QPSService],
})
export class QPSModule {}
