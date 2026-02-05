import { forwardRef, Module } from '@nestjs/common'
import { SigChainModule } from '../auth/sigchain.service.module'
import { LocalDbModule } from '../local-db/local-db.module'

import { QSSAuthConnection } from './qss-auth-conn'
import { QSSAuthConnectionManager } from './qss-auth-conn-manager.service'
import { QSSClient } from './qss.client'
import { QSSService } from './qss.service'
import { OrbitDbModule } from '../storage/orbitDb/orbitdb.module'
import { CaptchaModule } from '../captcha/captcha.module'
import { SocketModule } from '../socket/socket.module'
import { Serializer } from './serializer.service'

@Module({
  imports: [SigChainModule, LocalDbModule, forwardRef(() => OrbitDbModule), CaptchaModule, SocketModule],
  providers: [QSSService, QSSClient, QSSAuthConnectionManager, QSSAuthConnection, Serializer],
  exports: [QSSService, QSSClient, Serializer],
})
export class QSSModule {}
