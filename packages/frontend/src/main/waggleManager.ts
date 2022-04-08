import waggle, { DataServer, ConnectionsManager } from '@quiet/waggle'
import { BrowserWindow } from 'electron'
import getPort from 'get-port'

export const getPorts = async (): Promise<{
  socksPort: number
  libp2pHiddenService: number
  controlPort: number
  httpTunnelPort: number
  dataServer: number
}> => {
  const controlPort = await getPort()
  const httpTunnelPort = await getPort()
  const socksPort = await getPort()
  const libp2pHiddenService = await getPort()
  const dataServer = await getPort()
  return {
    socksPort,
    libp2pHiddenService,
    controlPort,
    httpTunnelPort,
    dataServer
  }
}

export const runWaggle = async (
  appDataPath: string
): Promise<{
  connectionsManager: ConnectionsManager
  dataServer: DataServer
}> => {
  const ports = await getPorts()

  const dataServer = new waggle.DataServer(ports.dataServer)
  await dataServer.listen()

  const isDev = process.env.NODE_ENV === 'development'
  const resourcesPath = isDev ? null : process.resourcesPath

  const connectionsManager = new waggle.ConnectionsManager({
    port: ports.libp2pHiddenService,
    agentHost: 'localhost',
    agentPort: ports.socksPort,
    httpTunnelPort: ports.httpTunnelPort,
    io: dataServer.io,
    options: {
      env: {
        appDataPath: `${appDataPath}/Quiet`,
        resourcesPath
      },
      spawnTor: true,
      torControlPort: ports.controlPort
    }
  })

  return { connectionsManager, dataServer }
}

export const waggleVersion = waggle.version

export default { getPorts, runWaggle, waggleVersion }
