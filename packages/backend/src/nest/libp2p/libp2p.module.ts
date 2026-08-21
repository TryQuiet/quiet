import { forwardRef, Module } from '@nestjs/common'
import { Libp2pService } from './libp2p.service'
import { ProcessInChunksService } from './process-in-chunks.service'
import { SigChainModule } from '../auth/sigchain.service.module'
import { LocalDbModule } from '../local-db/local-db.module'
import { QSSModule } from '../qss/qss.module'
import { Libp2pConnectionGater } from './libp2p.connection-gater'

@Module({
  imports: [SigChainModule, LocalDbModule, forwardRef(() => QSSModule)],
  providers: [Libp2pService, ProcessInChunksService, Libp2pConnectionGater],
  exports: [Libp2pService, Libp2pConnectionGater],
})
export class Libp2pModule {}
