import { Module } from '@nestjs/common'
import { LocalDbModule } from '../local-db/local-db.module'
import { SocketModule } from '../socket/socket.module'
import { StorageModule } from '../storage/storage.module'
import { TorModule } from '../tor/tor.module'
import { ConnectionsManagerService } from './connections-manager.service'
import { StorageServiceClientModule } from '../storageServiceClient/storageServiceClient.module'
import { Libp2pModule } from '../libp2p/libp2p.module'
import { SigChainModule } from '../auth/sigchain.service.module'
import { QSSModule } from '../qss/qss.module'
import { QPSModule } from '../qps/qps.module'
import { CaptchaModule } from '../captcha/captcha.module'
import { AdmissionModule } from '../admission/admission.module'

@Module({
  imports: [
    Libp2pModule,
    StorageModule,
    TorModule,
    SocketModule,
    LocalDbModule,
    StorageServiceClientModule,
    SigChainModule,
    QSSModule,
    QPSModule,
    CaptchaModule,
    AdmissionModule,
  ],
  providers: [ConnectionsManagerService],
  exports: [ConnectionsManagerService],
})
export class ConnectionsManagerModule {}
