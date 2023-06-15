import { Module } from '@nestjs/common'
import { CONFIG_OPTIONS, TOR_CONTROL_PARAMS } from '../const'
import { ConfigOptions } from '../types'
import { TorControl } from './tor-control.service'
import { Tor } from './tor.service'
import { TorControlAuthType } from './tor.types'



// public generateHashedPassword = () => {
//   const password = crypto.randomBytes(16).toString('hex')
//   const hashedPassword = child_process.execSync(
//     `${this.torPath} --quiet --hash-password ${password}`,
//     { env: this.options?.env }
//   )
//   this.torPassword = password
//   this.torHashedPassword = hashedPassword.toString().trim()
// }

// const torPasswordProvider = {
//   provide: 'torPasswordProvider',
//   useFactory: (expressProvider: express.Application) => {
//     const password = crypto.randomBytes(16).toString('hex')
//     const hashedPassword = child_process.execSync(
//       `${this.torPath} --quiet --hash-password ${password}`,
//       { env: this.options?.env }
//     )
//    const torPassword = password
//     const torHashedPassword = hashedPassword.toString().trim()

//     return { torPassword, torHashedPassword }
//   },
//   inject: [EXPRESS_PROVIDER],

// }

const torControlParams = {
  provide: TOR_CONTROL_PARAMS,
  useFactory: (configOptions: ConfigOptions ) => {
    return {
      port: configOptions.torControlPort,
      host: 'localhost',
      auth: {
        value: configOptions.torAuthCookie || configOptions.torPassword,
        type: configOptions.torAuthCookie ? TorControlAuthType.COOKIE : TorControlAuthType.PASSWORD
      }
    }
  },
  inject: [CONFIG_OPTIONS],

}

@Module({
    providers: [Tor, TorControl,torControlParams],
      exports: [Tor, TorControl],
})
export class TorModule {}
