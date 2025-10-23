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
import { sleep } from './nest/common/sleep'

// Shutdown helper constants
const SHUTDOWN_TIMEOUT = 60_000 // 1 minute

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

interface CaptchaTokenMessage {
  type: 'hcaptcha-token'
  token: string
}

interface CaptchaErrorMessage {
  type: 'hcaptcha-error'
  message: string
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

function isCaptchaTokenMessage(msg: any): msg is CaptchaTokenMessage {
  return msg && typeof msg === 'object' && msg.type === 'hcaptcha-token' && typeof msg.token === 'string'
}

function isCaptchaErrorMessage(msg: any): msg is CaptchaErrorMessage {
  return msg && typeof msg === 'object' && msg.type === 'hcaptcha-error' && typeof msg.message === 'string'
}
function setupGracefulShutdown(app: INestApplicationContext, getConnectionsManager: () => ConnectionsManagerService) {
  let shuttingDown = false
  let termSignalCount = 0

  /**
   * Close down all backend services and tell the parent process we're done.
   * Safe to call multiple times—concurrent callers will see `shuttingDown`
   * and return early.
   */
  async function gracefulCloseServices() {
    if (shuttingDown) return
    shuttingDown = true
    if (process.connected) process.send?.('closing-services')
    let timeoutId: NodeJS.Timeout | undefined
    try {
      // Failsafe: force‑exit if closeAllServices hangs >SHUTDOWN_TIMEOUT
      timeoutId = setTimeout(() => {
        logger.error('closeAllServices timed out, forcing process exit')
        if (process.connected) process.send?.('closed-services')
        process.exit(1)
      }, SHUTDOWN_TIMEOUT)
      const connectionsManager = getConnectionsManager()
      await connectionsManager.closeAllServices()
      logger.info('All backend services closed successfully')
    } catch (e) {
      logger.error('Error occurred while closing backend services', e)
      process.exit(1)
    } finally {
      if (timeoutId) clearTimeout(timeoutId)
      if (process.connected) process.send?.('closed-services')
      scheduleProcessExit(0)
    }
  }

  /**
   * Set the process exit code and let Node exit naturally so that
   * stdout / stderr buffers have a chance to flush.
   * Falls back to `process.exit()` only if the event‑loop hasn't
   * unwound after a short grace period.
   */
  function scheduleProcessExit(code: number) {
    logger.info(`Scheduling process exit with code ${code}`)
    process.exitCode = code
    // After one tick, if we're still alive, force exit (rare).
    setTimeout(() => {
      process.exit(code)
    }, 500)
  }

  async function initiateShutdown(exitCode: number, reason: string) {
    if (exitCode === 1) {
      logger.warn(`${reason}: forcing immediate exit with code 1`)
      scheduleProcessExit(1)
    }
    if (shuttingDown) return
    logger.info(`${reason} received, initiating shutdown`)
    await gracefulCloseServices()
  }

  async function handleTermSignal(signal: 'SIGINT' | 'SIGTERM') {
    termSignalCount += 1
    const exitCode = termSignalCount > 1 ? 1 : 0
    await initiateShutdown(exitCode, signal + (exitCode ? ' (force close)' : ''))
  }

  process.on('SIGINT', async () => await handleTermSignal('SIGINT'))
  process.on('SIGTERM', async () => await handleTermSignal('SIGTERM'))

  process.on('uncaughtException', async (error: Error) => {
    if (error.message.includes('EPIPE')) {
      return
    }
    logger.error('Uncaught Exception thrown:', error)
    await initiateShutdown(1, 'uncaughtException')
  })

  process.on('unhandledRejection', async (reason: any, promise) => {
    let reasonMsg = ''
    if (reason instanceof Error) {
      reasonMsg = reason.stack || reason.message
    } else if (typeof reason === 'object' && reason !== null && 'stack' in reason) {
      reasonMsg = (reason as any).stack
    } else {
      reasonMsg = JSON.stringify(reason)
    }
    logger.error('Unhandled Rejection at:', promise, 'reason:', reasonMsg)
    await initiateShutdown(0, 'unhandledRejection')
  })

  return {
    gracefulCloseServices,
    initiateShutdown,
  }
}

export const runBackendDesktop = async (secret: string) => {
  logger.info('Running backend manager desktop')

  const isDev = process.env.NODE_ENV === 'development'
  const webcrypto = new Crypto()
  // @ts-ignore
  global.crypto = webcrypto
  validateOptions(options)
  const resourcesPath = options.resourcesPath.trim()
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
  const shutdown = setupGracefulShutdown(app, () => app.get<ConnectionsManagerService>(ConnectionsManagerService))

  process.on('message', async message => {
    if (message === 'close') {
      logger.info('Received close message from parent process')
      await shutdown.gracefulCloseServices()
    }
    if (message === 'leaveCommunity') {
      try {
        await connectionsManager.leaveCommunity()
      } catch (e) {
        logger.error('Error occurred while leaving community', e)
        await shutdown.initiateShutdown(1, 'leaveCommunity error')
      }
      if (process.send) process.send('leftCommunity')
    }
    if (isCaptchaTokenMessage(message)) {
      connectionsManager.getQssService().hcaptchaToken = message.token
    }
    if (isCaptchaErrorMessage(message)) {
      connectionsManager.getQssService().handleHcaptchaError(message.message)
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
  const shutdown = setupGracefulShutdown(app, () => app.get<ConnectionsManagerService>(ConnectionsManagerService))
  rn_bridge.channel.send('backendReady')
}

const platform = options.platform
if (platform === 'desktop') {
  let ipcNonce: string | undefined = randomBytes(16).toString('hex')
  process.on('message', msg => {
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
      await sleep(10_000)
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
