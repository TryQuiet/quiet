import { Module } from '@nestjs/common'
import { SocketModule } from '../socket/socket.module'
import { Libp2pService } from './libp2p.service'

@Module({
  imports: [SocketModule],
  providers: [Libp2pService],
  exports: [Libp2pService]
})
export class Libp2pModule { }
