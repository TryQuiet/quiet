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
import { EventEmitter } from 'events'
const log = logger('torMesh')

const peersCount = 4
const timeout = 130_000
const requestsCount = 5
const eventEmmiter = new EventEmitter()

const torServices = new Map<string, { tor: Tor; httpTunnelPort: number, mode: string, onionAddress?: string }>()
// const hiddenServices = new Map<string, string>()

const results = {}

const spawnMesh = async () => {
  for (let i = 0; i < peersCount; i++) {
    const tmpDir = createTmpDir()
    console.log(tmpDir)
    log(`spawning tor number ${i}`)
    const tmpAppDataPath = tmpQuietDirPath(tmpDir.name)

    const ports = await getPorts()

    const tor = await spawnTorProcess(tmpAppDataPath, ports)

    await tor.init()
    let mode = 'server'
    if (i % 2) {
      mode = 'client'
    }
    torServices.set(i.toString(), { tor, httpTunnelPort: ports.httpTunnelPort, mode })
  }
}

const killMesh = async () => {
  for (const data of torServices.values()) {
    await data.tor.kill()
  }
}

let finishedRequests = 0
let failedRequests = 0
let cancelledRequests = 0

const createServer = async (port, serverAddress: string) => {
  const app: express.Application = express()
  app.use(express.json())
  // eslint-disable-next-line
  app.post('/test', async (req, res) => {
    // eslint-disable-next-line
    res.send({ success: 'success' })
    finishedRequests++
    eventEmmiter.emit(`${serverAddress}-success`)
  })
  app.listen(port, () => {
    log('listening')
  })
}

const createAgent = async (httpTunnelPort) => {
  return new HttpsProxyAgent({ port: httpTunnelPort, host: 'localhost' })
}

const sendRequest = async (
  serviceAddress: string,
  httpTunnelPort: number,
  tor: Tor,
  counter: number,
): Promise<Response> => {
  let response = null
  const agent = await createAgent(httpTunnelPort)
  const options = {
    method: 'POST',
    body: JSON.stringify({ serviceAddress: '' }),
    headers: { 'Content-Type': 'application/json' },
    agent
  }

  await tor.switchToCleanCircuts()
  let data = {
    requestCounter: counter
  }

  try {
    log('Sending request to', serviceAddress)
    console.time(`fetch (${counter}) ${serviceAddress}`)
    const start = new Date()
    response = await fetch('http://' + serviceAddress + '.onion/test', options)
    const end = new Date()
    const fetchTime = (end.getTime() - start.getTime()) / 1000

    // Gather results
    Object.assign(data, {
      fetchTime,
      receivedResultsTime: (end.getTime() - results[serviceAddress].requestsStartTime.getTime()) / 1000, // Since scheduling Promise.any
    })

  } catch (e) {
    console.log(`fetch error ${serviceAddress}`, e)
    failedRequests++
    throw e
  } finally {
    console.timeEnd(`fetch (${counter}) ${serviceAddress}`)
    console.timeEnd(`schedule fetch (${counter}) ${serviceAddress}`)
    results[serviceAddress][counter] = data
  }
  return response
}

const createHiddenServices = async () => {
  log('Creating hidden services for servers')
  for (const [key, data] of torServices) {
    if (data.mode !== 'server') continue
    const { libp2pHiddenService } = await getPorts()
    const hiddenService = await data.tor.createNewHiddenService(80, libp2pHiddenService)
    const address = hiddenService.onionAddress.split('.')[0]
    log(`created hidden service for instance ${key} and onion address is ${address}`)
    data.onionAddress = address
    torServices.set(key, data)
    await createServer(libp2pHiddenService, address)
  }
}

const destroyHiddenServices = async () => {
  for (const [key, data] of torServices) {
    if (!data.onionAddress) continue
    await data.tor.destroyHiddenService(data.onionAddress)
    log(
      `destroyed hidden service for instance ${key} with onion address ${data.onionAddress}`
    )
  }
}

const testWithDelayedNewnym = async () => {
  const servers = []
  const clients = []
  for (const [key, torData] of torServices) {
    if (torData.onionAddress) {
      servers.push(torData)
    } else {
      clients.push(torData)
    }
  }

  function resolveTimeout(func, address, port, tor, requestCounter, delay: number) {
    return new Promise(
      (resolve, reject) => {
        console.time(`schedule fetch (${requestCounter}) ${address}`)

        const timeoutId = setTimeout(async (address, port, tor, requestCounter) => {
          console.log(`Resolving request after ${delay}ms`)
          try {
            resolve(func(address, port, tor, requestCounter))
          } catch (e) {
            reject(`request rejected. ${e.message}`)
          }
        }, delay, address, port, tor, requestCounter)

        eventEmmiter.on(`${address}-success`, () => {
          log(`Clearing timeout (${requestCounter}) ${address}`)
          clearTimeout(timeoutId)
        })

      }
    )
  }

  for (let serverCounter = 0; serverCounter < servers.length; serverCounter++) {
    const requests = []
    const serverOnionAddress = servers[serverCounter].onionAddress
    const tor = servers[serverCounter].tor
    results[serverOnionAddress] = {}
    for (let rq = 0; rq < requestsCount; rq++) {
      requests.push(resolveTimeout(
        sendRequest,
        serverOnionAddress,
        clients[serverCounter].httpTunnelPort,
        tor,
        rq,
        rq * 10_500
      ))
    }

    try {
      results[serverOnionAddress] = {
        torLogs: tor.torFileName,
        requestsStartTime: new Date(),
        bootstrapTime: tor.bootstrapTime
      }
      // @ts-ignore
      const response = await Promise.any(requests)
      log('RESP', response)
    } catch (e) {
      log(`All requests failed for ${serverOnionAddress}, ${e.message}`)
    }
  }
  log('END')
}

const sendRequests = async () => { // No newnym, send next request if previous one timed out
  const servers = []
  const clients = []
  for (const [key, torData] of torServices) {
    if (torData.onionAddress) {
      servers.push(torData)
    } else {
      clients.push(torData)
    }
  }

  for (let serverCounter = 0; serverCounter < servers.length; serverCounter++) {
    const onionAddress = servers[serverCounter].onionAddress
    const tor = servers[serverCounter].tor
    results[onionAddress] = {
      requestsStartTime: new Date(),
      bootstrapTime: tor.bootstrapTime
    }

    let rq = 0;
    while (rq < requestsCount) {
      try {
        await sendRequest(
          onionAddress, 
          clients[serverCounter].httpTunnelPort,
          tor,
          rq
        )
        log('got response', rq, onionAddress)
        break
      } catch (e) {
        rq++
      }
    }
  }
}

// const waitForRequests = async () => {
//   return await new Promise((resolve, reject) => {
//     setTimeout(() => {
//       reject(new Error('rejected because of timeout'))
//     }, timeout)
//     setInterval(() => {
//       if (finishedRequests + failedRequests + cancelledRequests === (peersCount / 2) * requestsCount) {
//         resolve('finished')
//       }
//     }, 1000)
//   })
// }

const main = async () => {
  await spawnMesh()
  await createHiddenServices()
  log('created hidden services')
  // await testWithDelayedNewnym()
  await sendRequests()
  // try {
  //   log('waiting for requests')
  //   await waitForRequests()
  // } catch (e) {
  //   log.error(e)
  // }
  await destroyHiddenServices()
  log('destroyed hidden services')
  await killMesh()
  log('RESULTS', JSON.stringify(results))
  log('after killing mesh')
  process.exit(1)
}
// eslint-disable-next-line
main()
