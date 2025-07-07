import { Module } from '@nestjs/common'
import { SigChainModule } from '../auth/sigchain.service.module'

import { QSSAuthConnection } from './qss-auth-conn'
import { QSSAuthConnectionManager } from './qss-auth-conn-manager.service'
import { QSSClient } from './qss.client'
import { QSSService } from './qss.service'

@Module({
  imports: [SigChainModule],
  providers: [QSSService, QSSClient, QSSAuthConnectionManager, QSSAuthConnection],
  exports: [QSSService],
})
export class QSSModule {}
