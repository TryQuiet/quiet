import { Module } from '@nestjs/common'
import { Libp2pService } from './libp2p.service'
import { ProcessInChunksService } from './process-in-chunks.service'
import { SigChainModule } from '../auth/sigchain.service.module'
import { LocalDbModule } from '../local-db/local-db.module'
import { QSSModule } from '../qss/qss.module'

@Module({
  imports: [SigChainModule, LocalDbModule, QSSModule],
  providers: [Libp2pService, ProcessInChunksService],
  exports: [Libp2pService],
})
export class Libp2pModule {}
