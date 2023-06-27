import { Crypto } from '@peculiar/webcrypto'
import { Command } from 'commander'
import logger from './logger'
import { ConnectionsManager, torBinForPlatform, torDirForPlatform } from './index'
import path from 'path'

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

// @ts-ignore
import rn_bridge from './rn-bridge.ts'

rn_bridge.channel.on('message', (msg: string) => {
  console.log('native sends message', msg)
});

export const runBackendDesktop = async () => {
  const isDev = process.env.NODE_ENV === 'development'

  const webcrypto = new Crypto()

  // @ts-ignore
  global.crypto = webcrypto

  const resourcesPath = isDev ? null : options.resourcesPath.trim()

  const connectionsManager = new ConnectionsManager({
    socketIOPort: options.socketIOPort,
    torBinaryPath: torBinForPlatform(resourcesPath),
    torResourcesPath: torDirForPlatform(resourcesPath),
    options: {
      env: {
        appDataPath: path.join(options.appDataPath.trim(), 'Quiet'),
      }
    }
  })

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

  await connectionsManager.init()
}

export const runBackendMobile = async (): Promise<any> => {
  // Enable triggering push notifications
  process.env['BACKEND'] = 'mobile'
  process.env['CONNECTION_TIME'] = (new Date().getTime() / 1000).toString() // Get time in seconds

  const connectionsManager: ConnectionsManager = new ConnectionsManager({
    socketIOPort: options.dataPort,
    httpTunnelPort: options.httpTunnelPort ? options.httpTunnelPort : null,
    torAuthCookie: options.authCookie ? options.authCookie : null,
    torControlPort: options.controlPort ? options.controlPort : null,
    torBinaryPath: options.torBinary ? options.torBinary : null,
    options: {
      env: {
        appDataPath: options.dataPath,
      },
      createPaths: false,
    }
  })

  await connectionsManager.init()
}

const platform = options.platform

if (platform === 'desktop') {
  runBackendDesktop().catch(error => {
    log.error('Error occurred while initializing backend', error)
    throw error
  })
} else if (platform === 'mobile') {
  runBackendMobile().catch(async (error) => {
    log.error('Error occurred while initializing backend', error)
    // Prevent stopping process before getting output
    await new Promise<void>((resolve) => {
      setTimeout(() => { resolve() }, 10000)
    })
    throw error
  })
} else {
  throw Error(`Platfrom must be either desktop or mobile, received ${options.platform}`)
}
