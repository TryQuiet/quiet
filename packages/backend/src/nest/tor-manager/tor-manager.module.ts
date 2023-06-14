import { Module } from '@nestjs/common';
import { TorManagerService } from './tor-manager.service';

@Module({
  providers: [TorManagerService]
})
export class TorManagerModule {}
