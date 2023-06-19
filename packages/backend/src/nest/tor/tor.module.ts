import { Module } from '@nestjs/common'
import { CONFIG_OPTIONS, TOR_CONTROL_PARAMS } from '../const'
import { ConfigOptions } from '../types'
import { TorControl } from './tor-control.service'
import { Tor } from './tor.service'
import { TorControlAuthType } from './tor.types'

const torControlParams = {
  provide: TOR_CONTROL_PARAMS,
  useFactory: (configOptions: ConfigOptions) => {
    return {
      port: configOptions.torControlPort,
      host: 'localhost',
      // auth: {
      //   value: configOptions.torAuthCookie || configOptions.torPassword,
      //   type: configOptions.torAuthCookie ? TorControlAuthType.COOKIE : TorControlAuthType.PASSWORD
      // }
    }
  },
  inject: [CONFIG_OPTIONS],

}

@Module({
    providers: [Tor, TorControl, torControlParams],
      exports: [Tor, TorControl],
})
export class TorModule {}
