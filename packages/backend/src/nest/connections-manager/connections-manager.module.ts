import { Module } from '@nestjs/common'
import { RegistrationModule } from '../registration/registration.module'
import { SocketModule } from '../socket/socket.module'
import { StorageModule } from '../storage/storage.module'
import { TorModule } from '../tor/tor.module'
import { ConnectionsManagerService } from './connections-manager.service'

@Module({
  imports: [RegistrationModule, StorageModule, TorModule, SocketModule],
  providers: [ConnectionsManagerService],
  exports: [ConnectionsManagerService]
})
export class ConnectionsManagerModule {}
