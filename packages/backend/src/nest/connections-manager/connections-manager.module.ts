import { Module } from '@nestjs/common'
import { Libp2pModule } from '../libp2p/libp2p.module'
import { LocalDbModule } from '../local-db/local-db.module'
import { RegistrationModule } from '../registration/registration.module'
import { SocketModule } from '../socket/socket.module'
import { StorageModule } from '../storage/storage.module'
import { TorModule } from '../tor/tor.module'
import { ConnectionsManagerService } from './connections-manager.service'

@Module({
  imports: [RegistrationModule, StorageModule, TorModule, SocketModule, LocalDbModule, Libp2pModule],
  providers: [ConnectionsManagerService],
  exports: [ConnectionsManagerService]
})
export class ConnectionsManagerModule {}
