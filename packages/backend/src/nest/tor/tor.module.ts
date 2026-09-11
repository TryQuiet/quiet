import { Module } from '@nestjs/common'
import { CONFIG_OPTIONS, TOR_CONTROL_PARAMS, TOR_PARAMS_PROVIDER, TOR_PASSWORD_PROVIDER } from '../const'
import { ConfigOptions } from '../types'
import { TorControl } from './tor-control.service'
import { Tor } from './tor.service'
import { TorControlAuthType, TorPasswordProvider } from './tor.types'
import { torPasswordProvider } from './tor-password.provider'
import path from 'path'
import * as os from 'os'
import { SocketModule } from '../socket/socket.module'
import { createLogger } from '../common/logger'

const logger = createLogger('TorModule')

const torParamsProvider = {
  provide: TOR_PARAMS_PROVIDER,
  useFactory: (configOptions: ConfigOptions) => {
    const torPath = configOptions.torBinaryPath ? path.normalize(configOptions.torBinaryPath) : ''
    const options = {
      env: {
        LD_LIBRARY_PATH: configOptions.torResourcesPath,
        HOME: os.homedir(),
      },
      // detached: true, // TODO: check if this is needed
    }

    logger.info('Tor Params Provider:', JSON.stringify({ torPath, options }, null, 2))

    return { torPath, options }
  },
  inject: [CONFIG_OPTIONS],
}

const torControlParams = {
  provide: TOR_CONTROL_PARAMS,
  useFactory: (configOptions: ConfigOptions, torPasswordProvider: TorPasswordProvider | null) => {
    // Native Tor has no password provider and can supply its cookie after module initialization.
    // The bootstrap watcher waits for that cookie before attempting control I/O.
    const usesCookieAuth = Boolean(configOptions.torAuthCookie) || torPasswordProvider === null
    return {
      port: configOptions.torControlPort,
      host: 'localhost',
      auth: {
        value: configOptions.torAuthCookie || torPasswordProvider?.torPassword || '',
        type: usesCookieAuth ? TorControlAuthType.COOKIE : TorControlAuthType.PASSWORD,
      },
    }
  },
  inject: [CONFIG_OPTIONS, TOR_PASSWORD_PROVIDER],
}

@Module({
  imports: [SocketModule],
  providers: [Tor, TorControl, torControlParams, torPasswordProvider, torParamsProvider],
  exports: [Tor, TorControl],
})
export class TorModule {}
