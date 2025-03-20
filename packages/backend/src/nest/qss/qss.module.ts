import { Module } from '@nestjs/common'
import { SigChainModule } from '../auth/sigchain.service.module'

import { QSSKXEncryptionService } from './encryption/qss-enc.service'
import { SodiumHelper } from './encryption/sodium.helper'
import { QSSClient } from './qss.client'
import { QSSService } from './qss.service'

@Module({
  imports: [SigChainModule],
  providers: [QSSService, QSSClient, QSSKXEncryptionService, SodiumHelper],
  exports: [QSSService],
})
export class QSSModule {}
