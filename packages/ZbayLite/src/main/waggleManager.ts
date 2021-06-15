import TlgManager from 'waggle'
import fp from 'find-free-port'
import path from 'path'
import os from 'os'
import * as fs from 'fs'
import { ipcMain, BrowserWindow } from 'electron'
import electronStore from '../shared/electronStore'
import debug from 'debug'
const log = Object.assign(debug('zbay:waggle'), {
  error: debug('zbay:waggle:err')
})

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
    socksPort: ports.socksPort,
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
  const hiddenServices = electronStore.get('hiddenServices')

  if (!hiddenServices) {
    let libp2pHiddenService

    try {
      libp2pHiddenService = await tor.createNewHiddenService(
        ports.libp2pHiddenService,
        ports.libp2pHiddenService
      )
    } catch (e) {
      log.error(`tlgManager ERROR: can't add new onion service ${e}`)
    }

    const services = {
      libp2pHiddenService
    }
    electronStore.set('hiddenServices', services)
  } else {
    const services = Array.from(Object.keys(hiddenServices))
    for (const service of services) {
      if (!ports[service]) continue
      try {
        await tor.spawnHiddenService({
          virtPort: ports[service],
          targetPort: ports[service],
          privKey: hiddenServices[service].privateKey
        })
      } catch (e) {
        log.error(`can't add onion services ${e}`)
      }
    }
  }

  if (fs.existsSync(`${path.join.apply(null, [os.homedir(), 'zbay_tor'])}`)) {
    fs.rmdirSync(`${path.join.apply(null, [os.homedir(), 'zbay_tor'])}`, {
      recursive: true
    })
  }

  tor.process.stderr.on('data', data => {
    log.error(`grep stderr: ${data}`)
  })
  tor.process.on('close', code => {
    if (code !== 0) {
      log(`ps process exited with code ${code}`)
    }
  })

  return tor
}

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

export const runWaggle = async (webContents: BrowserWindow['webContents']): Promise<any> => {
  const ports = electronStore.get('ports')
  const appDataPath = electronStore.get('appDataPath')
  const { libp2pHiddenService } = electronStore.get('hiddenServices')

  const dataServer = new TlgManager.DataServer(ports.dataServer)
  await dataServer.listen()

  const connectionsManager = new TlgManager.ConnectionsManager({
    port: ports.libp2pHiddenService,
    host: `${libp2pHiddenService.onionAddress}.onion`,
    agentHost: 'localhost',
    agentPort: ports.socksPort,
    io: dataServer.io,
    options: {
      env: {
        appDataPath: `${appDataPath}/Zbay`
      }
    }
  })

  TlgManager.initListeners(dataServer.io, connectionsManager)

  webContents.send('connectToWebsocket')
  ipcMain.on('connectionReady', () => {
    if (!electronStore.get('waggleInitialized')) {
      connectionsManager
        .initializeNode()
        .then(async () => {
          await connectionsManager.initStorage()
          webContents.send('waggleInitialized')
          electronStore.set('waggleInitialized', true)
        })
        .catch(error => {
          log.error(`Couldn't initialize waggle: ${error.message}`)
        })
    }
  })
}

export const waggleVersion = TlgManager.version

export default { spawnTor, getPorts, runWaggle, waggleVersion }
