import TlgManager from 'waggle'
import fp from 'find-free-port'
import path from 'path'
import os from 'os'
import * as fs from 'fs'
import electronStore from '../shared/electronStore'

const isDev = process.env.NODE_ENV === 'development'

const pathDev = path.join.apply(null, [process.cwd(), 'tor', 'tor'])
const pathProd = path.join.apply(null, [process.resourcesPath, 'tor', 'tor'])
const pathDevLib = path.join.apply(null, [process.cwd(), 'tor'])
const pathProdLib = path.join.apply(null, [process.resourcesPath, 'tor'])

export const spawnTor = async () => {
  const appDataPath = path.join.apply(null, [electronStore.get('appDataPath'), 'Zbay'])

  const ports = await getPorts()
  electronStore.set('ports', ports)

  const tor = new TlgManager.Tor({
    torPath: isDev ? pathDev : pathProd,
    appDataPath: appDataPath,
    controlPort: ports.controlPort,
    options: {
      env: {
        LD_LIBRARY_PATH: isDev ? pathDevLib : pathProdLib,
        HOME: os.homedir()
      },
      detached: true
    }
  })

  await tor.init()
  await tor.setSocksPort(ports.socksPort)
  await tor.setHttpTunnelPort(ports.httpTunnelPort)
  const hiddenServices = electronStore.get('hiddenServices')

  if (!hiddenServices) {
    let libp2pHiddenService
    let directMessagesHiddenService

    try {
      libp2pHiddenService = await tor.addNewService(
        ports.libp2pHiddenService,
        ports.libp2pHiddenService
      )
      directMessagesHiddenService = await tor.addNewService(80, ports.directMessagesHiddenService)
    } catch (e) {
      console.log(`tlgManager ERROR: can't add new onion service ${e}`)
    }

    const services = {
      libp2pHiddenService,
      directMessagesHiddenService
    }
    electronStore.set('hiddenServices', services)
  } else {
    const services = Array.from(Object.keys(hiddenServices))
    for (const service of services) {
      try {
        if (service === 'directMessagesHiddenService') {
          await tor.addOnion({
            virtPort: 80,
            targetPort: ports[service],
            privKey: hiddenServices[service].privateKey
          })
          continue
        }
        await tor.addOnion({
          virtPort: ports[service],
          targetPort: ports[service],
          privKey: hiddenServices[service].privateKey
        })
      } catch (e) {
        console.log(`can't add onion services ${e}`)
      }
    }
  }

  if (fs.existsSync(`${path.join.apply(null, [os.homedir(), 'zbay_tor'])}`)) {
    fs.rmdirSync(`${path.join.apply(null, [os.homedir(), 'zbay_tor'])}`, {
      recursive: true
    })
  }

  tor.process.stderr.on('data', data => {
    console.error(`grep stderr: ${data}`)
  })
  tor.process.on('close', code => {
    if (code !== 0) {
      console.log(`ps process exited with code ${code}`)
    }
  })
  return tor
}

export const getPorts = async (): Promise<{
  socksPort: number
  httpTunnelPort: number
  directMessagesHiddenService: number
  libp2pHiddenService: number
  controlPort: number
}> => {
  const [controlPort] = await fp(9151)
  const [socksPort] = await fp(9052)
  const [httpTunnelPort] = await fp(9082)
  const [directMessagesHiddenService] = await fp(3435)
  const [libp2pHiddenService] = await fp(7950)
  return {
    socksPort,
    httpTunnelPort,
    directMessagesHiddenService,
    libp2pHiddenService,
    controlPort
  }
}

export const getOnionAddress = (): string => {
  const hiddenServices = electronStore.get('hiddenServices')
  const address = hiddenServices.directMessagesHiddenService.onionAddress
  return address
}

export const runLibp2p = async (webContents): Promise<any> => {
  const ports = electronStore.get('ports')
  const appDataPath = electronStore.get('appDataPath')
  const { libp2pHiddenService } = electronStore.get('hiddenServices')

  const connectonsManager = new TlgManager.ConnectionsManager({
    port: ports.libp2pHiddenService,
    host: `${libp2pHiddenService.onionAddress}.onion`,
    agentHost: 'localhost',
    agentPort: ports.socksPort,
    options: {
      env: {
        appDataPath: `${appDataPath}/Zbay`
      }
    }
  })

  await connectonsManager.initializeNode()

  const dataServer = new TlgManager.DataServer()
  dataServer.listen()
  TlgManager.initListeners(dataServer.io, connectonsManager)
  webContents.send('connectToWebsocket')
}

export default { spawnTor, getOnionAddress, getPorts, runLibp2p }
