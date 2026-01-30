import { Module } from '@nestjs/common'
import { SocketModule } from '../socket/socket.module'
import { QPSService } from './qps.service'

@Module({
  imports: [SocketModule],
  providers: [QPSService],
  exports: [QPSService],
})
export class QPSModule {}
