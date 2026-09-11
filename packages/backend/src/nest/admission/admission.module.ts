import { Libp2pModule } from '../libp2p/libp2p.module'
import { QssAdmissionAdapter } from './qss-admission.adapter'
import { P2pAdmissionAdapter } from './p2p-admission.adapter'
import { AdmissionClock } from './admission-clock'
import { Module } from '@nestjs/common'
import { SigChainModule } from '../auth/sigchain.service.module'
import { LocalDbModule } from '../local-db/local-db.module'
import { QSSModule } from '../qss/qss.module'
import { AdmissionCoordinator } from './admission-coordinator.service'

@Module({
  imports: [QSSModule, SigChainModule, LocalDbModule, Libp2pModule],
  providers: [AdmissionCoordinator, QssAdmissionAdapter, P2pAdmissionAdapter, AdmissionClock],
  exports: [AdmissionCoordinator],
})
export class AdmissionModule {}
