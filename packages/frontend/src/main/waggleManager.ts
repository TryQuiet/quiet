import waggle, { DataServer, ConnectionsManager } from '@quiet/waggle'
import logger from './logger'
import { Command } from 'commander'
const program = new Command()

const log = logger('waggleManager')

program
  .requiredOption('-s, --socksPort <number>', 'Socks proxy port')
  .requiredOption('-h, --httpTunnelPort <number>', 'Tor http tunnel port')
  .requiredOption('-a, --appDataPath <string>', 'Path of application data directory')
  .requiredOption('-c, --controlPort <number>', 'Tor control port')
  .requiredOption('-d, --dataServerPort <number>', 'Socket io data server port')
  .option('-r, --resourcesPath <string>', 'Application resources path')
  .requiredOption('-l, --libp2pHiddenService <number>', 'Libp2p tor hidden service port')

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

  await connectionsManager.init()

  return { connectionsManager, dataServer }
}

export const waggleVersion = waggle.version

runWaggle().then((data) => {
  process.on('message', message => {
    if (message === 'close') {
      data.connectionsManager.closeAllServices().catch((e) => {
        log.error('Error occured while closing waggle services', e)
      }).finally(() => {
        process.send('closedServices')
      })
    }
  })
}).catch((e) => {
  log.error('Waggle initialization returned error', e)
})
