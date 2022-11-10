import backend, { DataServer, ConnectionsManager } from '@quiet/backend'
import logger from './logger'
import { Command } from 'commander'
const program = new Command()

const log = logger('backendManager')

program
  .option('-s, --socksPort <number>', 'Socks proxy port')
  .option('-h, --httpTunnelPort <number>', 'Tor http tunnel port')
  .option('-a, --appDataPath <string>', 'Path of application data directory')
  .option('-c, --controlPort <number>', 'Tor control port')
  .option('-d, --socketIOPort <number>', 'Socket io data server port')
  .option('-r, --resourcesPath <string>', 'Application resources path')
  .option('-l, --libp2pHiddenService <number>', 'Libp2p tor hidden service port')

program.parse(process.argv)
const options = program.opts()

export const runBackend = async () => {
  const isDev = process.env.NODE_ENV === 'development'
  const resourcesPath = isDev ? null : options.resourcesPath.trim()

  const connectionsManager = new backend.ConnectionsManager({
    socketIOPort: options.socketIOPort,
    options: {
      env: {
        appDataPath: `${options.appDataPath.trim()}/Quiet`,
        resourcesPath
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

export const backendVersion = backend.version

runBackend().catch(e => {
  log.error('Error occurred while initializing backend', e)
  throw Error(e.message)
})
