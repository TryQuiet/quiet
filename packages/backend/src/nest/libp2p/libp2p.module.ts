import { Module } from '@nestjs/common'
import { Libp2pService } from './libp2p.service'
import { ProcessInChunksService } from './process-in-chunks.service'

@Module({
  providers: [Libp2pService, ProcessInChunksService],
  exports: [Libp2pService],
})
export class Libp2pModule {}
