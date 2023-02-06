import express from 'express'
import createHttpsProxyAgent from 'https-proxy-agent'
import fetch, { Response } from 'node-fetch'

import { Tor } from './torManager'

let compare, createPaths, removeDirs, removeFiles, getUsersAddresses, getFilesRecursively, getDirsRecursively, createLibp2pAddress, createLibp2pListenAddress, removeFilesFromDir, fetchAbsolute, getPorts, DummyIOServer, torBinForPlatform, torDirForPlatform

(async () => {
  const { 
  createPaths: createPathsImported,
  compare: compareImported,
  removeDirs: removeDirsImported,
  removeFiles: removeFilesImported,
  getUsersAddresses: getUsersAddressesImported,
  getFilesRecursively: getFilesRecursivelyImported,
  getDirsRecursively: getDirsRecursivelyImported,
  createLibp2pAddress: createLibp2pAddressImported,

  createLibp2pListenAddress: createLibp2pListenAddressImported,
  removeFilesFromDir: removeFilesFromDirImproted,
  fetchAbsolute: fetchAbsoluteImported,
  getPorts: getPortsImported,
  DummyIOServer: DummyIOServerImported,
  torBinForPlatform: torBinForPlatformImported,
  torDirForPlatform: torDirForPlatformImported,
  } = await import('../common/utils')

  createPaths = createPathsImported
  compare =  compareImported
  removeDirs = removeDirsImported
  removeFiles = removeFilesImported
  getUsersAddresses = getUsersAddressesImported
  getFilesRecursively = getFilesRecursivelyImported
  getDirsRecursively = getDirsRecursivelyImported
  createLibp2pAddress = createLibp2pAddressImported
  createLibp2pListenAddress =createLibp2pListenAddressImported
  removeFilesFromDir = removeFilesFromDirImproted
  fetchAbsolute = fetchAbsoluteImported
  getPorts =getPortsImported
  DummyIOServer = DummyIOServerImported
  torBinForPlatform = torBinForPlatformImported
  torDirForPlatform = torDirForPlatformImported


})()
import {
  createTmpDir,
  spawnTorProcess,
  tmpQuietDirPath
} from '../common/testUtils'

import logger from '../logger'
const log = logger('torMesh')

const amount = 10
const timeout = 130_000

const torServices = new Map<string, { tor: Tor; httpTunnelPort: number }>()
const hiddenServices = new Map<string, string>()

const spawnMesh = async () => {
  for (let i = 0; i < amount; i++) {
    const tmpDir = createTmpDir()
    console.log(tmpDir)
    log(`spawning tor number ${i}`)
    const tmpAppDataPath = tmpQuietDirPath(tmpDir.name)

    const ports = await getPorts()

    const tor = await spawnTorProcess(tmpAppDataPath, ports)

    await tor.init()
    torServices.set(i.toString(), { tor, httpTunnelPort: ports.httpTunnelPort })
  }
}

const killMesh = async () => {
  for (const data of torServices.values()) {
    await data.tor.kill()
  }
}

let finishedRequests = 0

const createServer = async (port, serverAddress: string) => {
  const app: express.Application = express()
 // app.use(express.json())
  // eslint-disable-next-line
  app.post('/test', async (req, res) => {
    // eslint-disable-next-line
    console.timeEnd(`${req.body.serviceAddress} - ${serverAddress}`)
    res.send({ success: 'success' })
    log(`${Math.floor(100 * (finishedRequests / (amount * (amount - 1))))}% connected`)
    finishedRequests++
  })
  app.listen(port, () => {
    log('listening')
  })
}

const createAgent = async (httpTunnelPort) => {
  return createHttpsProxyAgent({ port: httpTunnelPort, host: 'localhost' })
}

const sendRequest = async (
  serviceAddress: string,
  httpTunnelPort: number,
  ownHs: string
): Promise<Response> => {
  const agent = await createAgent(httpTunnelPort)
  const options = {
    method: 'POST',
    body: JSON.stringify({ serviceAddress: ownHs }),
    headers: { 'Content-Type': 'application/json' },
    agent
  }
  try {
    return await fetch('http://' + serviceAddress + '.onion/test', options)
  } catch (e) {
    console.log('ERROR', e)
    throw e
  }
}

const createHiddenServices = async () => {
  log('createHiddenServices')
  for (const [key, data] of torServices) {
    torServices.keys()
    const { libp2pHiddenService } = await getPorts()
    const hiddenService = await data.tor.createNewHiddenService({ targetPort: libp2pHiddenService })
    const address = hiddenService.onionAddress.split('.')[0]
    log(`created hidden service for instance ${key} and onion address is ${address}`)
    hiddenServices.set(key, address)
    await createServer(libp2pHiddenService, address)
  }
}

const destroyHiddenServices = async () => {
  for (const [key, data] of torServices) {
    await data.tor.destroyHiddenService(hiddenServices.get(key))
    log(
      `destroyed hidden service for instance ${key} with onion address ${hiddenServices.get(key)}`
    )
  }
}

const sendRequests = async () => {
  for (const [key1, value1] of torServices) {
    for (const [key2, value2] of hiddenServices) {
      if (key1 === key2) continue
      const hs = hiddenServices.get(key1)
      console.log(`sendRequest ${hs} - ${value2}`)
      console.time(`${hs} - ${value2}`)
      // eslint-disable-next-line
      sendRequest(value2, value1.httpTunnelPort, hs)
    }
  }
}

const waitForRequests = async () => {
  return await new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(new Error('rejected because of timeout'))
    }, timeout)
    setInterval(() => {
      if (finishedRequests === amount * (amount - 1)) {
        resolve('finisehd')
      }
    }, 1000)
  })
}

const main = async () => {
  await spawnMesh()
  await createHiddenServices()
  log('created hidden services')
  await sendRequests()
  try {
    log('waiting for requests')
    await waitForRequests()
  } catch (e) {
    log.error(e)
  }
  log('after all connections')
  await destroyHiddenServices()
  log('destroyed hidden services')
  await killMesh()
  log('after killing mesh')
  process.exit(1)
}
// eslint-disable-next-line
main()
