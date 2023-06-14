import { Module } from '@nestjs/common';
import { Libp2pService } from './libp2p.service';

@Module({
  providers: [Libp2pService]
})
export class Libp2pModule {}
