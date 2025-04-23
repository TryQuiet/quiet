import { Module } from '@nestjs/common'
import { SigChainModule } from '../auth/sigchain.service.module'

import { QSSKXEncryptionService } from './encryption/qss-enc.service'
import { SodiumHelper } from './encryption/sodium.helper'
import { QSSAuthConnection } from './qss-auth-conn'
import { QSSAuthConnectionManager } from './qss-auth-conn-manager.service'
import { QSSClient } from './qss.client'
import { QSSService } from './qss.service'

@Module({
  imports: [SigChainModule],
  providers: [QSSService, QSSClient, QSSKXEncryptionService, QSSAuthConnectionManager, QSSAuthConnection, SodiumHelper],
  exports: [QSSService],
})
export class QSSModule {}
