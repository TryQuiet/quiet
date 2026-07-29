import { Module } from '@nestjs/common'
import { SigChainModule } from '../auth/sigchain.service.module'
import { LocalDbModule } from '../local-db/local-db.module'
import { QSSModule } from '../qss/qss.module'
import { AdmissionCoordinator } from './admission-coordinator.service'

@Module({
  imports: [QSSModule, SigChainModule, LocalDbModule],
  providers: [AdmissionCoordinator],
  exports: [AdmissionCoordinator],
})
export class AdmissionModule {}
