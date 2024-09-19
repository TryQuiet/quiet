import { Module } from '@nestjs/common'
import { LocalDbModule } from '../local-db/local-db.module'
import { RegistrationModule } from '../registration/registration.module'
import { SocketModule } from '../socket/socket.module'
import { StorageModule } from '../storage/storage.module'
import { TorModule } from '../tor/tor.module'
import { ConnectionsManagerService } from './connections-manager.service'
import { StorageServiceClientModule } from '../storageServiceClient/storageServiceClient.module'
import { Libp2pModule } from '../libp2p/libp2p.module'

@Module({
  imports: [
    RegistrationModule,
    Libp2pModule,
    StorageModule,
    TorModule,
    SocketModule,
    LocalDbModule,
    StorageServiceClientModule,
  ],
  providers: [ConnectionsManagerService],
  exports: [ConnectionsManagerService],
})
export class ConnectionsManagerModule {}
