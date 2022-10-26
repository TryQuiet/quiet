import express, { response } from 'express'
import { HttpsProxyAgent } from 'https-proxy-agent'
import fetch, { Response } from 'node-fetch'
import fs from 'fs'
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

const peersCount = 2
// const timeout = 130_000
// const timeoutPerRequest = 15_000
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

const createServer = async (port, serverAddress: string) => {
  const app: express.Application = express()
  app.use(express.json())
  // eslint-disable-next-line
  app.post('/test', async (req, res) => {
    log(`post. Returning ${{ counter: req.body.counter }}`)
    // eslint-disable-next-line
    res.send({ counter: req.body.counter })
    log(`Post (${req.body.counter}) ${serverAddress}`)
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
    body: JSON.stringify({ counter }),
    headers: { 'Content-Type': 'application/json' },
    agent
  }

  await tor.switchToCleanCircuts()

  try {
    log('Sending request to', serviceAddress)
    console.time(`fetch (${counter}) ${serviceAddress}`)
    results[serviceAddress][counter] = {
      startFetchTime: new Date()
    }
    response = await fetch('http://' + serviceAddress + '.onion/test', options)
  } catch (e) {
    console.log(`fetch error ${serviceAddress}`, e)
    throw e
  } finally {
    console.timeEnd(`fetch (${counter}) ${serviceAddress}`)
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
    let responseData = null
    let response = null
    try {
      results[serverOnionAddress] = {
        torLogs: tor.torFileName,
        requestsStartTime: new Date(),
        bootstrapTime: tor.bootstrapTime
      }
      // @ts-ignore
      response = await Promise.any(requests)
      results[serverOnionAddress].endTime = new Date()
      results[serverOnionAddress].statusCode = response.status
      log('GOT RESPONSE', responseData, response)
    } catch (e) {
      log(`All requests failed for ${serverOnionAddress}, ${e.message}`)
    }

    const end = new Date()
    results[serverOnionAddress].receivedResultsTime = (end.getTime() - results[serverOnionAddress].requestsStartTime.getTime()) / 1000 // Since scheduling Promise.any

    try {
      responseData = await response.json()
    } catch (e) {
      log(`Didn't receive proper response for ${serverOnionAddress}`)
      results[serverOnionAddress].success = false
      return
    }

    const {counter} = responseData
    results[serverOnionAddress][counter].fetchTime = (end.getTime() - results[serverOnionAddress][counter].startFetchTime.getTime()) / 1000
    
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
    const serverOnionAddress = servers[serverCounter].onionAddress
    const tor = servers[serverCounter].tor
    results[serverOnionAddress] = {
      requestsStartTime: new Date(),
      bootstrapTime: tor.bootstrapTime
    }

    let rq = 0;
    while (rq < requestsCount) {
      try {
        const response = await sendRequest(
          serverOnionAddress, 
          clients[serverCounter].httpTunnelPort,
          tor,
          rq
        )
        log('got response', rq, serverOnionAddress)
        const end = new Date()
        // Gather results
        // @ts-ignore
        const {counter} = response.json()
        results[serverOnionAddress][counter].fetchTime = end.getTime() - results[serverOnionAddress][counter].startFetchTime.getTime()
        results[serverOnionAddress].receivedResultsTime = (end.getTime() - results[serverOnionAddress].requestsStartTime.getTime()) / 1000 // Since scheduling Promise.any
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
  console.time('test time')
  await testWithDelayedNewnym()
  // await sendRequests()
  console.timeEnd('test time')
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
  fs.writeFileSync(`${new Date().toISOString()}_delayed.json`, JSON.stringify(results))
  log('after killing mesh')
  process.exit(1)
}
// eslint-disable-next-line
main()
