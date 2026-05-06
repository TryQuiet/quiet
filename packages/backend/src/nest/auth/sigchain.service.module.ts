import { Module } from '@nestjs/common'
import { SigChainService } from './sigchain.service'
import { LocalDbModule } from '../local-db/local-db.module'
import { SocketModule } from '../socket/socket.module'

@Module({
  providers: [SigChainService],
  exports: [SigChainService],
  imports: [LocalDbModule, SocketModule],
})
export class SigChainModule {}
