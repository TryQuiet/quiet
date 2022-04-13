import waggle, { DataServer, ConnectionsManager } from '@quiet/waggle'
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

export type ApplicationPorts = Awaited<ReturnType<typeof getPorts>>
export const runWaggle = async (
  ports: ApplicationPorts,
  appDataPath: string
): Promise<{
  connectionsManager: ConnectionsManager
  dataServer: DataServer
}> => {
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

  await connectionsManager.init()

  return { connectionsManager, dataServer }
}

export const waggleVersion = waggle.version

console.log('RUNNING WAGGLE', console.log('ARGVS:', process.argv))

runWaggle({
  socksPort: Number(process.argv[2]),
  libp2pHiddenService: Number(process.argv[3]),
  controlPort: Number(process.argv[4]),
  httpTunnelPort: Number(process.argv[5]),
  dataServer: Number(process.argv[6])
}, process.argv[7]).then((data) => {
  console.log('END OF INIT')
  process.on('message', message => {
    console.log('WAGGLE RECEIVED', message)
    if (message === 'close') {
      data.connectionsManager.closeAllServices().then(() => {
        console.log('CLOSED ALL SERVICES')
      })
    }
  })
  
}).catch((e) => {
  console.log('WAGGLE ERROR', e)
})



export default { getPorts, runWaggle, waggleVersion }
