import { Crypto } from '@peculiar/webcrypto'
import { Command } from 'commander'
import { NestFactory } from '@nestjs/core'
import path from 'path'
import getPort from 'get-port'
import { AppModule } from './nest/app.module'
import { ConnectionsManagerService } from './nest/connections-manager/connections-manager.service'
import { torBinForPlatform, torDirForPlatform } from './nest/common/utils'
import initRnBridge from './rn-bridge'

import logger from './nest/common/logger'
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
  .option('-scrt, --socketIOSecret <string>', 'socketIO secret')

program.parse(process.argv)
const options = program.opts()

console.log('options', options)

interface OpenServices {
  torControlPort?: any
  socketIOPort?: any
  socketIOSecret?: any
  httpTunnelPort?: any
  authCookie?: any
}

import { INestApplicationContext } from '@nestjs/common'

export const runBackendDesktop = async () => {
  const isDev = process.env.NODE_ENV === 'development'

  const webcrypto = new Crypto()

  // @ts-ignore
  global.crypto = webcrypto

  const resourcesPath = isDev ? null : options.resourcesPath.trim()

  const app = await NestFactory.createApplicationContext(
    AppModule.forOptions({
      socketIOPort: options.socketIOPort,
      socketIOSecret: options.socketIOSecret,
      torBinaryPath: torBinForPlatform(resourcesPath),
      torResourcesPath: torDirForPlatform(resourcesPath),
      torControlPort: await getPort(),
      options: {
        env: {
          appDataPath: path.join(options.appDataPath.trim(), 'Quiet'),
        },
      },
    }),
    { logger: false }
  )

  const connectionsManager = app.get<ConnectionsManagerService>(ConnectionsManagerService)

  process.on('message', async message => {
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
}

export const runBackendMobile = async (): Promise<any> => {
  // Enable triggering push notifications
  process.env['BACKEND'] = 'mobile'
  process.env['CONNECTION_TIME'] = (new Date().getTime() / 1000).toString() // Get time in seconds

  const rn_bridge = initRnBridge()

  let app: INestApplicationContext
  app = await NestFactory.createApplicationContext(
    AppModule.forOptions({
      socketIOPort: options.dataPort,
      socketIOSecret: options.socketIOSecret,
      httpTunnelPort: options.httpTunnelPort ? options.httpTunnelPort : null,
      torAuthCookie: options.authCookie ? options.authCookie : null,
      torControlPort: options.controlPort ? options.controlPort : await getPort(),
      torBinaryPath: options.torBinary ? options.torBinary : null,
      options: {
        env: {
          appDataPath: options.dataPath,
        },
        createPaths: false,
      },
    }),
    { logger: ['warn', 'error', 'log', 'debug', 'verbose'] }
  )

  rn_bridge.channel.on('close', async () => {
    const connectionsManager = app.get<ConnectionsManagerService>(ConnectionsManagerService)
    await connectionsManager.closeAllServices()
    await app.close()
  })
  rn_bridge.channel.on('open', async (msg: OpenServices) => {
    app = await NestFactory.createApplicationContext(
      AppModule.forOptions({
        socketIOPort: msg.socketIOPort,
        socketIOSecret: msg.socketIOSecret,
        httpTunnelPort: msg.httpTunnelPort ? msg.httpTunnelPort : null,
        torAuthCookie: msg.authCookie ? msg.authCookie : null,
        torControlPort: msg.torControlPort ? msg.torControlPort : await getPort(),
        torBinaryPath: options.torBinary ? options.torBinary : null,
        options: {
          env: {
            appDataPath: options.dataPath,
          },
          createPaths: false,
        },
      }),
      { logger: ['warn', 'error', 'log', 'debug', 'verbose'] }
    )
  })
}

const platform = options.platform

if (platform === 'desktop') {
  runBackendDesktop().catch(error => {
    log.error('Error occurred while initializing backend', error)
    throw error
  })
} else if (platform === 'mobile') {
  runBackendMobile().catch(async error => {
    log.error('Error occurred while initializing backend', error)
    // Prevent stopping process before getting output
    await new Promise<void>(resolve => {
      setTimeout(() => {
        resolve()
      }, 10000)
    })
    throw error
  })
} else {
  throw Error(`Platfrom must be either desktop or mobile, received ${options.platform}`)
}
