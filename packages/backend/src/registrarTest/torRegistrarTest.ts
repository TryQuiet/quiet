import express from 'express'
import createHttpsProxyAgent from 'https-proxy-agent'
import fetch, { Response } from 'node-fetch'
import fs from 'fs'
import {
  createTmpDir,
  spawnTorProcess,
  tmpQuietDirPath
} from '../common/testUtils'

import logger from '../logger'
import { EventEmitter } from 'events'
import { Command } from 'commander'
import { Tor, GetInfoTorSignal } from '../torManager/torManager'
import { getPorts } from '../common/utils'
const program = new Command()

enum TestMode {
  NEWNYM = 'newnym',
  REGULAR = 'regular'
}

program
  .option('-p, --peersNumber <number>', 'Total number of peers', '20')
  .option('-r, --requestsNumber <number>', 'Number of requests per single test', '5')
  .option('-g, --numEntryGuards <number>', 'NumEntryGuards to be set in torrc', '0')
  .option('-v, --vanguardsLiteEnabled <string>', 'VanguardsLiteEnabled to be set in torrc', 'auto')
  .option('-t, --torBinName <string>', 'Tor binary name', 'tor')
  .option('-m, --mode <type>', 'Number of requests per single test - "newnym" or "regular"', TestMode.REGULAR)

program.parse(process.argv)
const options = program.opts()
console.log('OPTIONS', options)
const log = logger('torMesh')

interface TorService {
  tor: Tor
  httpTunnelPort: number
  onionAddress?: string
  bootstrapTime: number
}

const peersCount = options.peersNumber
const requestsCount = options.requestsNumber
const mode = options.mode
const guardsCount = options.numEntryGuards
const vanguargsLiteEnabled = options.vanguardsLiteEnabled
const torBinName = options.torBinName
const eventEmmiter = new EventEmitter()
const torServices = new Map<string, TorService>()
const results = Object.assign({}, options)
results['node'] = process.versions.node

const spawnTor = async (i: number) => {
  const tmpDir = createTmpDir()
  console.log(tmpDir)
  log(`spawning tor number ${i}`)
  const tmpAppDataPath = tmpQuietDirPath(tmpDir.name)
  const ports = await getPorts()
  const extraTorProcessParams = { '--NumEntryGuards': guardsCount, '--VanguardsLiteEnabled': vanguargsLiteEnabled }

  const tor = await spawnTorProcess(tmpAppDataPath, ports, extraTorProcessParams, torBinName)

  const startBootstrap = new Date()
  await tor.init()
  const bootstrapTime = (new Date().getTime() - startBootstrap.getTime()) / 1000
  torServices.set(i.toString(), { tor, httpTunnelPort: ports.httpTunnelPort, bootstrapTime })
  await tor.getInfo(GetInfoTorSignal.CONFIG_TEXT)
}

const spawnMesh = async () => {
  const torProcesses: Array<Promise<void>> = []
  for (let i = 0; i < peersCount; i++) {
    torProcesses.push(spawnTor(i))
  }
  await Promise.all(torProcesses)
}

const killMesh = async () => {
  for (const data of torServices.values()) {
    await data.tor.kill()
  }
  eventEmmiter.emit('closeServers')
}

const createServer = async (port: number, serverAddress: string) => {
  const app: express.Application = express()
  // @ts-ignore
  app.use(express.json())
  // eslint-disable-next-line
  app.post('/test', async (req, res) => {
    // eslint-disable-next-line
    res.send({ counter: req.body.counter })
    log(`Post (${req.body.counter}) ${serverAddress}`)
    eventEmmiter.emit(`${serverAddress}-success`)
  })
  const server = app.listen(port, () => {
    log(`listening on port ${port}, address: ${serverAddress}`)
    results[serverAddress].serverReadyTime = new Date()
  })

  eventEmmiter.on('closeServers', () => {
    log(`closing server ${serverAddress}`)
    server.close()
  })
}

const createAgent = (httpTunnelPort: number) => {
  return createHttpsProxyAgent({ port: httpTunnelPort, host: 'localhost' })
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

  let response: Response | null = null
  const agent = createAgent(httpTunnelPort)
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
    throw new Error(`Response code !== 200 (it is ${response.status})`)
  }

  return response
}

const createHiddenServices = async () => {
  log('Creating hidden services for servers')
  for (const [key, data] of torServices) {
    if (Number(key) % 2) continue
    const { libp2pHiddenService } = await getPorts()
    const hiddenService = await data.tor.createNewHiddenService({ targetPort: libp2pHiddenService, virtPort: 80 })
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
  const servers: TorService[] = []
  const clients: TorService[] = []
  for (const [_key, torData] of torServices) {
    if (torData.onionAddress) {
      servers.push(torData)
    } else {
      clients.push(torData)
    }
  }

  async function resolveTimeout(func: (...args: any[]) => Promise<Response>, address: string, port: number, tor: Tor, requestCounter: number, delay: number): Promise<Response> {
    return await new Promise(
      (resolve, reject) => {
        const timeoutId = setTimeout(async (address, port, tor, requestCounter) => {
          log(`Sending request after ${delay}ms`)
          try {
            resolve(func(address, port, tor, requestCounter))
          } catch (e) {
            reject(new Error(`request rejected. ${e.message}`))
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
    const requests: Array<Promise<Response>> = []
    const serverOnionAddress = servers[serverCounter].onionAddress
    if (!serverOnionAddress) {
      log.error('No onionAddress. Servers:', servers, 'counter:', serverCounter)
      continue
    }
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
    let response: Response | null = null
    try {
      results[serverOnionAddress].requestsStartTime = new Date()
      results[serverOnionAddress].bootstrapTime = servers[serverCounter].bootstrapTime
      // @ts-ignore
      response = await Promise.any(requests) // Get first successful response
      results[serverOnionAddress].endTime = new Date()
      results[serverOnionAddress].statusCode = response?.status
    } catch (e) {
      log(`All requests failed for ${serverOnionAddress}, ${e.message}`)
    }

    const end = new Date()
    results[serverOnionAddress].receivedResultsTime = (end.getTime() - results[serverOnionAddress].requestsStartTime.getTime()) / 1000 // Since scheduling Promise.any

    try {
      responseData = await response?.json()
    } catch (e) {
      log(`Didn't receive proper response data for ${serverOnionAddress}`)
      results[serverOnionAddress].success = false
      continue
    }

    if (!responseData) return
    const { counter } = responseData
    results[serverOnionAddress][counter].fetchTime = (end.getTime() - results[serverOnionAddress][counter].startFetchTime.getTime()) / 1000
  }
  log('END')
}

const sendRequests = async () => { // No newnym, send next request if previous one timed out
  const servers: TorService[] = []
  const clients: TorService[] = []
  for (const [key, torData] of torServices) {
    if (torData.onionAddress) {
      servers.push(torData)
    } else {
      clients.push(torData)
    }
  }

  for (let serverCounter = 0; serverCounter < servers.length; serverCounter++) {
    const serverOnionAddress = servers[serverCounter].onionAddress
    if (!serverOnionAddress) {
      log.error('No onionAddress. Servers:', servers, 'counter:', serverCounter)
      continue
    }
    const tor = servers[serverCounter].tor
    results[serverOnionAddress].requestsStartTime = new Date()
    results[serverOnionAddress].bootstrapTime = servers[serverCounter].bootstrapTime

    let response: Response | null = null
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
        log.error(`error, resp ${rq}, ${e.message}`)
        continue
      }
    }

    const end = new Date()
    results[serverOnionAddress].receivedResultsTime = (end.getTime() - results[serverOnionAddress].requestsStartTime.getTime()) / 1000 // Since scheduling Promise.any

    try {
      responseData = await response?.json()
    } catch (e) {
      log(`Didn't receive proper response data for ${serverOnionAddress}`, e.message)
      results[serverOnionAddress].success = false
      continue
    }

    if (!responseData) return
    const { counter } = responseData
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
  fs.writeFileSync(`${torBinName}_${new Date().toISOString()}_mode_${mode}_guards${guardsCount}_vanguards${vanguargsLiteEnabled}.json`, JSON.stringify(results))
  log('after killing mesh')
}
// eslint-disable-next-line
main()
