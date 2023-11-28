import { Module } from '@nestjs/common'
import { SocketModule } from '../socket/socket.module'
import { Libp2pService } from './libp2p.service'
import { ProcessInChunksService } from './process-in-chunks.service'

@Module({
  imports: [SocketModule],
  providers: [Libp2pService, ProcessInChunksService],
  exports: [Libp2pService],
})
export class Libp2pModule {}
