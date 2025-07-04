import { Crypto } from '@peculiar/webcrypto'
import { Command } from 'commander'
import { NestFactory } from '@nestjs/core'
import path from 'path'
import getPort from 'get-port'
import { AppModule } from './nest/app.module'
import { ConnectionsManagerService } from './nest/connections-manager/connections-manager.service'
import { TorControl } from './nest/tor/tor-control.service'
import { torBinForPlatform, torDirForPlatform } from './nest/common/utils'
import initRnBridge from './rn-bridge'
import { INestApplicationContext } from '@nestjs/common'
import { OpenServices, validateOptions } from './options'
import { SOCKS_PROXY_AGENT } from './nest/const'
import { createLogger } from './nest/common/logger'
import { HttpsProxyAgent } from 'https-proxy-agent'

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
  .option('-scrt, --socketIOSecret <string>', 'socketIO secret')

logger.info('Parsing args')

program.parse(process.argv)
const options = program.opts()

logger.info('options', options)

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

  process.on('SIGINT', async () => handleTermSignal('SIGINT'))
  process.on('SIGTERM', async () => handleTermSignal('SIGTERM'))

  process.on('uncaughtException', async (error: Error) => {
    if (error.message.includes('EPIPE')) {
      return
    }
    logger.error('Uncaught Exception thrown:', error)
    initiateShutdown(1, 'uncaughtException')
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
    initiateShutdown(0, 'unhandledRejection')
  })

  return {
    gracefulCloseServices,
    initiateShutdown,
  }
}

export const runBackendDesktop = async () => {
  logger.info('Running backend manager desktop')

  const isDev = process.env.NODE_ENV === 'development'

  const webcrypto = new Crypto()

  // @ts-ignore
  global.crypto = webcrypto

  validateOptions(options)

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
      }
      if (process.send) process.send('leftCommunity')
    }
  })
}

export const runBackendMobile = async () => {
  logger.info('Running backend manager mobile')

  // Enable triggering push notifications
  process.env['BACKEND'] = 'mobile'
  process.env['CONNECTION_TIME'] = (new Date().getTime() / 1000).toString() // Get time in seconds

  const rn_bridge = initRnBridge()

  const app: INestApplicationContext = await NestFactory.createApplicationContext(
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
}

const platform = options.platform

if (platform === 'desktop') {
  runBackendDesktop().catch(error => {
    logger.error('Error occurred while initializing backend', error)
    throw error
  })
} else if (platform === 'mobile') {
  runBackendMobile().catch(async error => {
    logger.error('Error occurred while initializing backend', error)
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
