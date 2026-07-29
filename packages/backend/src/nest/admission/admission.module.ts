import { Module } from '@nestjs/common'
import { SigChainModule } from '../auth/sigchain.service.module'
import { Libp2pModule } from '../libp2p/libp2p.module'
import { LocalDbModule } from '../local-db/local-db.module'
import { QSSModule } from '../qss/qss.module'
import { AdmissionCoordinator } from './admission-coordinator.service'

@Module({
  imports: [QSSModule, Libp2pModule, SigChainModule, LocalDbModule],
  providers: [AdmissionCoordinator],
  exports: [AdmissionCoordinator],
})
export class AdmissionModule {}
