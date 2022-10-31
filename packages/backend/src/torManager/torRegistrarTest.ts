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
import { Command } from 'commander'
const program = new Command()

enum TestMode {
  NEWNYM = 'newnym',
  REGULAR = 'regular'
}

program
  .option('-p, --peersNumber <number>', 'Total number of peers', '20')
  .option('-r, --requestsNumber <number>', 'Number of requests per single test', '5')
  .requiredOption('-m, --mode <type>', 'Number of requests per single test - "newnym" or "regular"')

program.parse(process.argv)
const options = program.opts()
console.log('OPTIONS', options)
const log = logger('torMesh')

const peersCount = options.peersNumber
const requestsCount = options.requestsNumber
const mode = options.mode
let eventEmmiter = new EventEmitter()
let torServices = new Map<string, { tor: Tor; httpTunnelPort: number, onionAddress?: string }>()
let results = {}

const spawnTor = async (i: number) => {
  const tmpDir = createTmpDir()
  console.log(tmpDir)
  log(`spawning tor number ${i}`)
  const tmpAppDataPath = tmpQuietDirPath(tmpDir.name)

  const ports = await getPorts()

  const tor = await spawnTorProcess(tmpAppDataPath, ports)

  await tor.init()
  torServices.set(i.toString(), { tor, httpTunnelPort: ports.httpTunnelPort })
}

const spawnMesh = async () => {
  const torProcesses = []
  for (let i = 0; i < peersCount; i++) {
    torProcesses.push(spawnTor(i))
  }
  await Promise.all(torProcesses)
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
    // eslint-disable-next-line
    res.send({ counter: req.body.counter })
    log(`Post (${req.body.counter}) ${serverAddress}`)
    eventEmmiter.emit(`${serverAddress}-success`)
  })
  app.listen(port, () => {
    log('listening')
    results[serverAddress].serverReadyTime = new Date()
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

  if (mode === TestMode.NEWNYM) {
    await tor.switchToCleanCircuts()
  }

  let response = null
  const agent = await createAgent(httpTunnelPort)
  const options = {
    method: 'POST',
    body: JSON.stringify({ counter }),
    headers: { 'Content-Type': 'application/json' },
    agent
  }

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

  if (response && response.status !== 200) {
    log(`Response code !== 200 (it is ${response.status}) ${counter} ${serviceAddress}`)
    results[serviceAddress][counter].statusCode = response.status
    throw `Response code !== 200 (it is ${response.status})`
  }

  return response
}

const createHiddenServices = async () => {
  log('Creating hidden services for servers')
  for (const [key, data] of torServices) {
    if (Number(key) % 2) continue
    const { libp2pHiddenService } = await getPorts()
    const hiddenService = await data.tor.createNewHiddenService(80, libp2pHiddenService)
    const address = hiddenService.onionAddress.split('.')[0]
    results[address] = {}
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
          log(`Sending request after ${delay}ms`)
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
      results[serverOnionAddress].requestsStartTime = new Date(),
      results[serverOnionAddress].bootstrapTime = tor.bootstrapTime
      // @ts-ignore
      response = await Promise.any(requests) // Get first successful response
      results[serverOnionAddress].endTime = new Date()
      results[serverOnionAddress].statusCode = response.status
      log('GOT RESPONSE', response)
    } catch (e) {
      log(`All requests failed for ${serverOnionAddress}, ${e.message}`)
    }

    const end = new Date()
    results[serverOnionAddress].receivedResultsTime = (end.getTime() - results[serverOnionAddress].requestsStartTime.getTime()) / 1000 // Since scheduling Promise.any

    try {
      responseData = await response.json()
    } catch (e) {
      log(`Didn't receive proper response data for ${serverOnionAddress}`)
      results[serverOnionAddress].success = false
      continue
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
    results[serverOnionAddress].requestsStartTime = new Date()
    results[serverOnionAddress].bootstrapTime = tor.bootstrapTime

    let response = null
    let responseData = null
    for (let rq = 0; rq < requestsCount; rq++) {
      try {
        response = await sendRequest(
          serverOnionAddress, 
          clients[serverCounter].httpTunnelPort,
          tor,
          rq
        )
        log('got response', rq, serverOnionAddress)
        results[serverOnionAddress].endTime = new Date()
        results[serverOnionAddress].statusCode = response.status
        break
      } catch (e) {
        continue
      }
    }

    const end = new Date()
    results[serverOnionAddress].receivedResultsTime = (end.getTime() - results[serverOnionAddress].requestsStartTime.getTime()) / 1000 // Since scheduling Promise.any

    try {
      responseData = await response.json()
    } catch (e) {
      log(`Didn't receive proper response data for ${serverOnionAddress}`)
      results[serverOnionAddress].success = false
      continue
    }

    const {counter} = responseData
    results[serverOnionAddress][counter].fetchTime = (end.getTime() - results[serverOnionAddress][counter].startFetchTime.getTime()) / 1000
  }
}

const main = async () => {
  await spawnMesh()
  await createHiddenServices()
  log('created hidden services')
  console.time('test time')
  if (mode === TestMode.NEWNYM) {
    await testWithDelayedNewnym()
  } else {
    await sendRequests()
  }
  console.timeEnd('test time')
  await destroyHiddenServices()
  log('destroyed hidden services')
  await killMesh()
  log('RESULTS', JSON.stringify(results))
  fs.writeFileSync(`${new Date().toISOString()}_mode_${mode}.json`, JSON.stringify(results))
  log('after killing mesh')
  process.exit(1)
}
// eslint-disable-next-line
main()
