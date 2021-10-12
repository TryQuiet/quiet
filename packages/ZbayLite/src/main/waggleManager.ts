import TlgManager from 'waggle'
import fp from 'find-free-port'
import { BrowserWindow } from 'electron'
import electronStore from '../shared/electronStore'
import { ConnectionsManager } from 'waggle/lib/libp2p/connectionsManager'
import { DataServer } from 'waggle/lib/socket/DataServer'

export const getPorts = async (): Promise<{
  socksPort: number
  libp2pHiddenService: number
  controlPort: number
  dataServer: number
}> => {
  const [controlPort] = await fp(9151)
  const [socksPort] = await fp(9052)
  const [libp2pHiddenService] = await fp(7950)
  const [dataServer] = await fp(4677)
  return {
    socksPort,
    libp2pHiddenService,
    controlPort,
    dataServer
  }
}

export const runWaggle = async (webContents: BrowserWindow['webContents']): Promise<{ connectionsManager: ConnectionsManager; dataServer: DataServer }> => {
  const ports = await getPorts()
  const appDataPath = electronStore.get('appDataPath')

  const dataServer = new TlgManager.DataServer(ports.dataServer)
  await dataServer.listen()

  const connectionsManager = new TlgManager.ConnectionsManager({
    port: ports.libp2pHiddenService,
    agentHost: 'localhost',
    agentPort: ports.socksPort,
    io: dataServer.io,
    options: {
      env: {
        appDataPath: `${appDataPath}/Zbay`
      },
      spawnTor: true,
      torControlPort: ports.controlPort
    }
  })

  await connectionsManager.init()

  webContents.send('connectToWebsocket')

  return { connectionsManager, dataServer }
}

export const waggleVersion = TlgManager.version

export default { getPorts, runWaggle, waggleVersion }
