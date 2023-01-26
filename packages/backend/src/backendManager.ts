import { Crypto } from '@peculiar/webcrypto'
import { Command } from 'commander'
import logger from './logger'
import { ConnectionsManager, torBinForPlatform, torDirForPlatform } from './index'

const log = logger('backendManager')
const program = new Command()

export const runBackendDesktop = async () => {
  const isDev = process.env.NODE_ENV === 'development'

  const webcrypto = new Crypto()

  //@ts-ignore
  global.crypto = webcrypto

  program
    .option('-a, --appDataPath <string>', 'Path of application data directory')
    .option('-d, --socketIOPort <number>', 'Socket io data server port')
    .option('-r, --resourcesPath <string>', 'Application resources path')

  program.parse(process.argv)
  const options = program.opts()

  const resourcesPath = isDev ? null : options.resourcesPath.trim()

  const connectionsManager = new ConnectionsManager({
    socketIOPort: options.socketIOPort,
    torBinaryPath: torBinForPlatform(resourcesPath),
    torResourcesPath: torDirForPlatform(resourcesPath),
    options: {
      env: {
        appDataPath: `${options.appDataPath.trim()}/Quiet`,
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
      process.send('closed-services')
    }
  })

  await connectionsManager.init()
}

export const runBackendMobile = async (): Promise<any> => {
  // Enable triggering push notifications
  process.env['BACKEND'] = 'mobile'
  process.env['CONNECTION_TIME'] = (new Date().getTime() / 1000).toString() // Get time in seconds

  program
    .requiredOption('-dpth, --dataPath <dataPath>', 'data directory path')
    .requiredOption('-dprt, --dataPort <dataPort>', 'data port')
    .option('-t, --torBinary <torBinary>', 'tor binary path')
    .option('-ac, --authCookie <authCookie>', 'tor authentication cookie')
    .option('-cp, --controlPort <controlPort>', 'tor control port')
    .option('-htp, --httpTunnelPort <httpTunnelPort>', 'http tunnel port')

  program.parse(process.argv)
  const options = program.opts()

  const connectionsManager: ConnectionsManager = new ConnectionsManager({
    socketIOPort: options.dataPort,
    httpTunnelPort: options.httpTunnelPort ? options.httpTunnelPort : null,
    torAuthCookie: options.authCookie ? options.authCookie : null,
    torControlPort: options.controlPort ? options.controlPort : null,
    torBinaryPath: options.torBinary ? options.torBinary : null,
    torResourcesPath: null,
    options: {
      env: {
        appDataPath: options.dataPath,
      },
      createPaths: false,
    }
  })

  await connectionsManager.init()
}

const platform = process.env.QUIET_PLATFORM

if (platform === 'desktop') {
  runBackendDesktop().catch(e => {
    log.error('Error occurred while initializing backend', e)
    throw Error(e.message)
  })
} else {
  runBackendMobile().catch(error => {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    console.log(error)
  })
}