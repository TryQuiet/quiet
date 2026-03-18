import { Module } from '@nestjs/common'
import { SocketModule } from '../socket/socket.module'
import { QSSModule } from '../qss/qss.module'
import { SigChainModule } from '../auth/sigchain.service.module'
import { OrbitDbModule } from '../storage/orbitDb/orbitdb.module'
import { QPSService } from './qps.service'

@Module({
  imports: [SocketModule, QSSModule, SigChainModule, OrbitDbModule],
  providers: [QPSService],
  exports: [QPSService],
})
export class QPSModule {}
