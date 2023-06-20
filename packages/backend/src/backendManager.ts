import { Crypto } from '@peculiar/webcrypto'
import { Command } from 'commander'
import logger from './logger'
import { torBinForPlatform, torDirForPlatform } from './index'
import { NestFactory } from '@nestjs/core'
import path from 'path'
import { AppModule } from './nest/app.module'
import { ConnectionsManagerService } from './nest/connections-manager/connections-manager.service'
import getPort from 'get-port'

// nest
// create / app context

// provide  token id
// useclasss

// inject interfejs abstrac calss
// privder
//  use class inne systemy

//  dynamic modules
//  static method dla options jako provider

//  inject (quiet options o)ptions

//  lifecycle hooks

//  connections manager w backaned manager

// app modile for options

const log = logger('backendManager')
const program = new Command()

program
.option('-p, --platform <platform>', 'platform')
.option('-dpth, --dataPath <dataPath>', 'data directory path')
.option('-dprt, --dataPort <dataPort>', 'data port')
.option('-t, --torBinary <torBinary>', 'tor binary path')
.option('-ac, --authCookie <authCookie>', 'tor authentication cookie')
.option('-cp, --controlPort <controlPort>', 'tor control port')
.option('-htp, --httpTunnelPort <httpTunnelPort>', 'http tunnel port')
.option('-a, --appDataPath <string>', 'Path of application data directory')
.option('-d, --socketIOPort <number>', 'Socket io data server port')
.option('-r, --resourcesPath <string>', 'Application resources path')

program.parse(process.argv)
const options = program.opts()

console.log('options', options)

export const runBackendDesktop = async () => {
  const isDev = process.env.NODE_ENV === 'development'

  const webcrypto = new Crypto()

  // @ts-ignore
  global.crypto = webcrypto

  const resourcesPath = isDev ? null : options.resourcesPath.trim()

  // const connectionsManager = new ConnectionsManager({
  //   socketIOPort: options.socketIOPort,
  //   torBinaryPath: torBinForPlatform(resourcesPath),
  //   torResourcesPath: torDirForPlatform(resourcesPath),
  //   options: {
  //     env: {
  //       appDataPath: path.join(options.appDataPath.trim(), 'Quiet'),
  //     }
  //   }
  // })

  const app = await NestFactory.createApplicationContext(AppModule.forOptions({
    socketIOPort: options.socketIOPort,
      torBinaryPath: torBinForPlatform(resourcesPath),
      torResourcesPath: torDirForPlatform(resourcesPath),
      torControlPort: await getPort(),
      options: {
        env: {
          appDataPath: path.join(options.appDataPath.trim(), 'Quiet'),
        }
      }
  }), { logger: ['error', 'warn', 'debug', 'log', 'verbose'] })

  const connectionsManager = app.get<ConnectionsManagerService>(ConnectionsManagerService)

  process.on('message', async (message) => {
    if (message === 'close') {
      try {
        await connectionsManager.closeAllServices()
      } catch (e) {
        log.error('Error occured while closing backend services', e)
      }
      if (process.send) process.send('closed-services')
    }
    if (message === 'leaveCommunity') {
      try {
        await connectionsManager.leaveCommunity()
      } catch (e) {
        log.error('Error occured while leaving community', e)
      }
      if (process.send) process.send('leftCommunity')
    }
  })

  // await connectionsManager.init()
}

// export const runBackendMobile = async (): Promise<any> => {
//   // Enable triggering push notifications
//   process.env['BACKEND'] = 'mobile'
//   process.env['CONNECTION_TIME'] = (new Date().getTime() / 1000).toString() // Get time in seconds

//   const connectionsManager: ConnectionsManager = new ConnectionsManager({
//     socketIOPort: options.dataPort,
//     httpTunnelPort: options.httpTunnelPort ? options.httpTunnelPort : null,
//     torAuthCookie: options.authCookie ? options.authCookie : null,
//     torControlPort: options.controlPort ? options.controlPort : null,
//     torBinaryPath: options.torBinary ? options.torBinary : null,
//     options: {
//       env: {
//         appDataPath: options.dataPath,
//       },
//       createPaths: false,
//     }
//   })

//   await connectionsManager.init()
// }

const platform = options.platform

if (platform === 'desktop') {
  runBackendDesktop().catch(error => {
    log.error('Error occurred while initializing backend', error)
    throw error
  })
} else if (platform === 'mobile') {
  // runBackendMobile().catch(async (error) => {
  //   log.error('Error occurred while initializing backend', error)
  //   // Prevent stopping process before getting output
  //   await new Promise<void>((resolve) => {
  //     setTimeout(() => { resolve() }, 10000)
  //   })
  //   throw error
  // })
} else {
  throw Error(`Platfrom must be either desktop or mobile, received ${options.platform}`)
}
