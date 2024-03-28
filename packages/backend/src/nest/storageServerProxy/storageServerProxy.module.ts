import { Module } from '@nestjs/common'
import { ServerProxyService } from './storageServerProxy.service'

@Module({
  providers: [ServerProxyService],
  exports: [ServerProxyService],
})
export class ServerProxyServiceModule {}
