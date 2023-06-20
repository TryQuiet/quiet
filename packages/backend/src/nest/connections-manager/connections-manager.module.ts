import { Module } from '@nestjs/common'
import { RegistrationModule } from '../registration/registration.module'
import { StorageModule } from '../storage/storage.module'
import { TorModule } from '../tor/tor.module'
import { ConnectionsManagerService } from './connections-manager.service'

@Module({
  imports: [RegistrationModule, StorageModule, TorModule],
  providers: [ConnectionsManagerService],
  exports: [ConnectionsManagerService]
})
export class ConnectionsManagerModule {}
