import express from 'express'
import { HttpsProxyAgent } from 'https-proxy-agent'
import fetch, { Response } from 'node-fetch'

import { Tor } from './torManager'

import { getPorts } from '../common/utils'
import {
  createTmpDir,
  spawnTorProcess,
  tmpQuietDirPath
} from '../common/testUtils'

import logger from '../logger'
const log = logger('torMesh')

const amount = 1
const timeout = 130_000

const torServices = new Map<string, { tor: Tor; httpTunnelPort: number }>()
const torClientServices = new Map<string, { tor: Tor; httpTunnelPort: number }>()
const hiddenServices = new Map<string, string>()
const clientsHiddenServices = new Map<string, string>()

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

  for (let i = 0; i < amount; i++) {
    const tmpDir = createTmpDir()
    console.log(tmpDir)
    log(`spawning tor for client number ${i}`)
    const tmpAppDataPath = tmpQuietDirPath(tmpDir.name)

    const ports = await getPorts()

    const tor = await spawnTorProcess(tmpAppDataPath, ports)

    await tor.init()
    torClientServices.set(i.toString(), { tor, httpTunnelPort: ports.httpTunnelPort })
  }

}

const killMesh = async () => {
  for (const data of torServices.values()) {
    await data.tor.kill()
  }
  for (const data of torClientServices.values()) {
    await data.tor.kill()
  }
}

let finishedRequests = 0

const createServer = async (port: number, serverAddress: string) => {
  const app: express.Application = express()
  app.use(express.json())
  // eslint-disable-next-line
  app.post('/test', async (req, res) => {
    // eslint-disable-next-line
    console.timeEnd(`${req.body.serviceAddress} -> ${serverAddress}`)
    res.send({ success: 'success' })
    log(`${Math.floor(100 * (finishedRequests / (amount * (amount - 1))))}% connected`)
    finishedRequests++
  })
  app.listen(port, () => {
    log('listening on port', port)
  })
}

const createAgent = (httpTunnelPort: number) => {
  return new HttpsProxyAgent({ port: httpTunnelPort, host: 'localhost' })
}


const sendCertificateRegistrationRequest = async (
  serviceAddress: string,
  httpTunnelPort: number,
  ownHs: string,
  requestTimeout: number = 120_000
): Promise<Response> => {
  const controller = new AbortController()
  const timeout = setTimeout(() => {
    controller.abort()
    log(`Aborting request after ${requestTimeout / 1000} s`)
  }, requestTimeout)

  let options = {
    method: 'POST',
    body: JSON.stringify({ serviceAddress: ownHs }),
    headers: { 'Content-Type': 'application/json' },
    signal: controller.signal,
    agent: createAgent(httpTunnelPort)
  }

  // await this.tor.switchToCleanCircuts()
  
  try {
    const start = new Date()
    const address = 'http://' + serviceAddress + '.onion/test'
    log('ADRES', address)
    const response = await fetch(address, options)
    const end = new Date()
    const fetchTime = (end.getTime() - start.getTime()) / 1000
    log(`Fetched ${serviceAddress}, time: ${fetchTime}`)
    return response
  } catch (e) {
    log.error("Registrar fetch error:", e.message)
    throw e
  } finally {
    clearTimeout(timeout)
  }
}




const sendRequest = async (
  serviceAddress: string,
  httpTunnelPort: number,
  ownHs: string
): Promise<Response> => {
  const controller = new AbortController()
  const requestTimeout = 60_000
  const timeout = setTimeout(() => {
    controller.abort()
    log(`Aborting request after ${requestTimeout / 1000} s`)
  }, requestTimeout)
  
  const agent = createAgent(httpTunnelPort)
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
    const { libp2pHiddenService } = await getPorts()
    const hiddenService = await data.tor.createNewHiddenService(80, libp2pHiddenService)
    const address = hiddenService.onionAddress.split('.')[0]
    log(`created hidden service for instance ${key} and onion address is ${address}`)
    hiddenServices.set(key, address)
    await createServer(libp2pHiddenService, address)
  }
}

const createClientsHiddenServices = async () => {
  log('createHiddenServices')
  for (const [key, data] of torClientServices) {
    torServices.keys()
    const { libp2pHiddenService } = await getPorts()
    const hiddenService = await data.tor.createNewHiddenService(80, libp2pHiddenService)
    const address = hiddenService.onionAddress.split('.')[0]
    log(`created hidden service for instance ${key} and onion address is ${address}`)
    clientsHiddenServices.set(key, address)
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

// const sendRequests = async () => {
//   for (const [key1, value1] of torServices) {
//     for (const [key2, value2] of hiddenServices) {
//       if (key1 === key2) continue
//       const hs = hiddenServices.get(key1)
//       console.log(`sendRequest ${hs} - ${value2}`)
//       console.time(`${hs} - ${value2}`)
//       // eslint-disable-next-line
//       sendRequest(value2, value1.httpTunnelPort, hs)
//     }
//   }
// }

const sendRequests = async () => {
  const hsValues = Array.from(hiddenServices.values())
  // const hsKeys = Array.from(hiddenServices.keys())
  // log('hiddenServices', hiddenServices)
  let i = 0
  for (const [key, value] of clientsHiddenServices) {
    // log('client', key, value)
    const hs = hsValues[i]
    // log('server', hsKeys[i], hs, hsValues, hsKeys)
    console.time(`${hs} -> ${value}`)
    log('--->', await sendCertificateRegistrationRequest(value, torClientServices.get(key).httpTunnelPort, hs))
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
  await createClientsHiddenServices()
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
