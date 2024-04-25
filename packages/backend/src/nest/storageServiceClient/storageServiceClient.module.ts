import { Module } from '@nestjs/common'
import { StorageServiceClient } from './storageServiceClient.service'

@Module({
  providers: [StorageServiceClient],
  exports: [StorageServiceClient],
})
export class StorageServiceClientModule {}
