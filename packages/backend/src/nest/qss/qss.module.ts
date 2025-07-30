import { forwardRef, Module } from '@nestjs/common'
import { SigChainModule } from '../auth/sigchain.service.module'
import { LocalDbModule } from '../local-db/local-db.module'

import { QSSAuthConnection } from './qss-auth-conn'
import { QSSAuthConnectionManager } from './qss-auth-conn-manager.service'
import { QSSClient } from './qss.client'
import { QSSService } from './qss.service'
import { OrbitDbModule } from '../storage/orbitDb/orbitdb.module'

@Module({
  imports: [SigChainModule, LocalDbModule, forwardRef(() => OrbitDbModule)],
  providers: [QSSService, QSSClient, QSSAuthConnectionManager, QSSAuthConnection],
  exports: [QSSService],
})
export class QSSModule {}
