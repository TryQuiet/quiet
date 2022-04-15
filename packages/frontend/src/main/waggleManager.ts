import waggle, { DataServer, ConnectionsManager } from '@quiet/waggle'
import logger from './logger'
import { Command } from 'commander'
const program = new Command()

const log = logger('waggleManager')

program
  .option('-s, --socksPort <number>', 'Socks proxy port')
  .option('-h, --httpTunnelPort <number>', 'Tor http tunnel port')
  .option('-a, --appDataPath <string>', 'Path of application data directory')
  .option('-c, --controlPort <number>', 'Tor control port')
  .option('-d, --dataServerPort <number>', 'Socket io data server port')
  .option('-r, --resourcesPath <string>', 'Application resources path')
  .option('-l, --libp2pHiddenService <number>', 'Libp2p tor hidden service port')

program.parse(process.argv)
const options = program.opts()

export const runWaggle = async (): Promise<{
  connectionsManager: ConnectionsManager
  dataServer: DataServer
}> => {
  const dataServer = new waggle.DataServer(options.dataServerPort)
  await dataServer.listen()

  const isDev = process.env.NODE_ENV === 'development'
  const resourcesPath = isDev ? null : options.resourcesPath.trim()

  const connectionsManager = new waggle.ConnectionsManager({
    port: options.libp2pHiddenService,
    agentHost: 'localhost',
    agentPort: options.socksPort,
    httpTunnelPort: options.httpTunnelPort,
    io: dataServer.io,
    options: {
      env: {
        appDataPath: `${options.appDataPath.trim()}/Quiet`,
        resourcesPath
      },
      spawnTor: true,
      torControlPort: options.controlPort
    }
  })

  process.on('message', async (message) => {
    if (message === 'close') {
      try {
        await dataServer.close()
        await connectionsManager.closeAllServices()
      } catch (e) {
        log.error('Error occured while closing waggle services', e)
      }
      process.send('closed-services')
    }
  })

  await connectionsManager.init()

  return { connectionsManager, dataServer }
}

export const waggleVersion = waggle.version

runWaggle().catch((e) => {
  log.error('Waggle initialization returned error', e)
})
