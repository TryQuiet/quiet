
import { NestFactory } from '@nestjs/core'
import getPort from 'get-port'
import { AppModule } from './nest/app.module'
import { ConnectionsManagerService } from './nest/connections-manager/connections-manager.service'
import { torBinForPlatform, torDirForPlatform } from './nest/common/utils'

export const app = await NestFactory.createApplicationContext(
  AppModule.forOptions({
    socketIOPort: await getPort(),
    torBinaryPath: torBinForPlatform(undefined),
    torResourcesPath: torDirForPlatform(undefined),
    torControlPort: await getPort(),
    options: {
      env: {
        appDataPath: 'Quiet-test-123',
      },
    },
  }),
  { logger: false }
)

export const connectionsManager = app.get<ConnectionsManagerService>(ConnectionsManagerService)
