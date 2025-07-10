import { Crypto } from '@peculiar/webcrypto'
import { Command } from 'commander'
import { NestFactory } from '@nestjs/core'
import path from 'path'
import getPort from 'get-port'
import { AppModule } from './nest/app.module'
import { ConnectionsManagerService } from './nest/connections-manager/connections-manager.service'
import { TorControl } from './nest/tor/tor-control.service'
import { torBinForPlatform, torDirForPlatform } from './nest/common/utils'
import initRnBridge, { RnBridge } from './rn-bridge'
import { INestApplicationContext } from '@nestjs/common'
import { OpenServices, validateOptions } from './options'
import { SOCKS_PROXY_AGENT } from './nest/const'
import { createLogger } from './nest/common/logger'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { randomBytes } from 'crypto'

const logger = createLogger('backendManager')

logger.info('Launching backend manager')

const program = new Command()

logger.info('Launching backend manager program')

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

logger.info('Parsing args')

program.parse(process.argv)
const options = program.opts()

interface SecretMessage {
  type: 'set-socket-secret'
  secret: string
  nonce: string
}

let secretReceived = false

function isSecretMessage(msg: any): msg is SecretMessage {
  return (
    msg &&
    typeof msg === 'object' &&
    msg.type === 'set-socket-secret' &&
    typeof msg.secret === 'string' &&
    typeof msg.nonce === 'string'
  )
}

export const runBackendDesktop = async (secret: string) => {
  logger.info('Running backend manager desktop')

  const isDev = process.env.NODE_ENV === 'development'
  const webcrypto = new Crypto()
  // @ts-ignore
  global.crypto = webcrypto
  validateOptions(options)
  const resourcesPath = isDev ? null : options.resourcesPath.trim()
  if (!secret) {
    logger.error('Socket IO secret is not set. Please set SOCKET_IO_SECRET via IPC.')
    throw new Error('Socket IO secret is not set.')
  }
  const app = await NestFactory.createApplicationContext(
    AppModule.forOptions({
      socketIOPort: options.socketIOPort,
      socketIOSecret: secret,
      torBinaryPath: torBinForPlatform(resourcesPath),
      torResourcesPath: torDirForPlatform(resourcesPath),
      torControlPort: await getPort(),
      options: {
        env: {
          appDataPath: path.join(options.appDataPath.trim(), 'Quiet'),
        },
      },
    })
  )
  const connectionsManager = app.get<ConnectionsManagerService>(ConnectionsManagerService)
  process.on('message', async message => {
    if (message === 'close') {
      try {
        await connectionsManager.closeAllServices()
      } catch (e) {
        logger.error('Error occurred while closing backend services', e)
      }
      if (process.send) process.send('closed-services')
    }
    if (message === 'leaveCommunity') {
      try {
        await connectionsManager.leaveCommunity()
      } catch (e) {
        logger.error('Error occurred while leaving community', e)
      }
      if (process.send) process.send('leftCommunity')
    }
  })
}

export const runBackendMobile = async (rn_bridge: any, secret: string) => {
  logger.info('Running backend manager mobile')
  process.env['BACKEND'] = 'mobile'
  process.env['CONNECTION_TIME'] = (new Date().getTime() / 1000).toString()

  const app: INestApplicationContext = await NestFactory.createApplicationContext(
    AppModule.forOptions({
      socketIOPort: options.dataPort,
      socketIOSecret: secret,
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
  let proxyAgent: HttpsProxyAgent<string> | undefined
  rn_bridge.channel.on('close', () => {
    const connectionsManager = app.get<ConnectionsManagerService>(ConnectionsManagerService)
    connectionsManager.pause()
  })
  rn_bridge.channel.on('open', (msg: OpenServices) => {
    const connectionsManager = app.get<ConnectionsManagerService>(ConnectionsManagerService)
    const torControl = app.get<TorControl>(TorControl)
    proxyAgent = app.get<HttpsProxyAgent<string>>(SOCKS_PROXY_AGENT)
    torControl.torControlParams.port = msg.torControlPort
    torControl.torControlParams.auth.value = msg.authCookie
    proxyAgent.connectOpts.port = msg.httpTunnelPort
    proxyAgent.proxy.port = msg.httpTunnelPort
    connectionsManager.resume()
  })
  rn_bridge.channel.send('backendReady')
}

const platform = options.platform
if (platform === 'desktop') {
  let ipcNonce: string | undefined = randomBytes(16).toString('hex')
  process.on('message', async msg => {
    if (secretReceived) return
    if (!isSecretMessage(msg)) return

    secretReceived = true
    const secret = msg.secret
    if (msg.nonce && typeof msg.nonce === 'string') {
      if (msg.nonce !== ipcNonce) {
        logger.error('IPC nonce mismatch. Expected:', ipcNonce, 'Received:', msg.nonce)
        throw new Error('IPC nonce mismatch')
      }
    }
    ipcNonce = undefined
    runBackendDesktop(secret).catch(async error => {
      logger.error('Error occurred while initializing backend', error)
      // Prevent stopping process before getting output
      await new Promise<void>(resolve => {
        setTimeout(() => {
          resolve()
        }, 10000)
      })
    })
  })
  process.send?.({ type: 'readyForSecret', nonce: ipcNonce })
} else if (platform === 'mobile') {
  const rn_bridge: RnBridge = initRnBridge()
  let ipcNonce: string | undefined = randomBytes(16).toString('hex')

  rn_bridge.channel.once('secret', async msg => {
    if (isSecretMessage(msg) && msg.nonce === ipcNonce && !secretReceived) {
      secretReceived = true
      ipcNonce = undefined

      runBackendMobile(rn_bridge, msg.secret).catch(async error => {
        logger.error('Error occurred while initializing backend', error)
        // Prevent stopping process before getting output
        if (process.env.NODE_ENV === 'development') {
          await new Promise<void>(resolve => {
            setTimeout(() => {
              resolve()
            }, 10000)
          })
        } else {
          await new Promise<void>(resolve => {
            setTimeout(() => {
              resolve()
            }, 100)
          })
        }
      })
    } else {
      throw new Error('Invalid secret message or nonce mismatch')
    }
  })
  // Notify the Kotlin side that we're ready
  rn_bridge.channel.send('readyForSecret', ipcNonce)
}

if (platform !== 'desktop' && platform !== 'mobile') {
  throw Error(`Platfrom must be either desktop or mobile, received ${options.platform}`)
}
