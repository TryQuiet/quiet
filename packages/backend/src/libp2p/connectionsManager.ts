import { NOISE } from '@chainsafe/libp2p-noise'
import { Crypto } from '@peculiar/webcrypto'
import { Agent } from 'https'
import { HttpsProxyAgent } from 'https-proxy-agent'
import Libp2p, { Connection } from 'libp2p'
import Websockets from 'libp2p-websockets'
import SocketIO from 'socket.io'
import Bootstrap from 'libp2p-bootstrap'
import Gossipsub from 'libp2p-gossipsub'
import KademliaDHT from 'libp2p-kad-dht'
import Mplex from 'libp2p-mplex'
import fetch, { Response } from 'node-fetch'
import AbortController from 'abort-controller'
import { DateTime } from 'luxon'
import * as os from 'os'
import PeerId from 'peer-id'
import { CryptoEngine, setEngine } from 'pkijs'
import { ConnectionsManagerOptions } from '../common/types'
import { Certificates, SocketActionTypes } from '@quiet/state-manager'
import {
  createLibp2pAddress,
  createLibp2pListenAddress,
  getPorts,
  torBinForPlatform,
  torDirForPlatform
} from '../common/utils'
import { QUIET_DIR_PATH } from '../constants'
import IOProxy from '../socket/IOProxy'
import initListeners from '../socket/listeners'
import { Storage } from '../storage'
import { Tor } from '../torManager'
import WebsocketsOverTor from './websocketOverTor'
import { DataServer } from '../socket/DataServer'
import { EventEmitter } from 'events'
import logger from '../logger'

const log = logger('conn')

export interface IConstructor {
  host?: string
  port?: number
  agentPort?: number
  agentHost?: string
  options?: Partial<ConnectionsManagerOptions>
  socketIOPort?: number
  io?: SocketIO.Server
  storageClass?: any // TODO: what type?
  httpTunnelPort?: number
}

export interface Libp2pNodeParams {
  peerId: PeerId
  listenAddresses: string[]
  agent: Agent
  cert?: string
  key?: string
  ca?: string[]
  localAddress: string
  bootstrapMultiaddrsList: string[]
  transportClass: Websockets
  targetPort: number
}

export interface InitLibp2pParams {
  peerId: PeerId
  address: string
  addressPort: number
  targetPort: number
  bootstrapMultiaddrs: string[]
  certs?: Certificates
}

export class ConnectionsManager extends EventEmitter {
  agentHost: string
  agentPort: number
  httpTunnelPort: number
  socksProxyAgent: any
  options: ConnectionsManagerOptions
  quietDir: string
  io: SocketIO.Server
  ioProxy: IOProxy
  libp2pTransportClass: any
  StorageCls: any
  tor: Tor
  libp2pInstance: Libp2p
  connectedPeers: Map<string, number>
  socketIOPort: number

  constructor({ agentPort, httpTunnelPort, options, storageClass, io, socketIOPort }: IConstructor) {
    super()
    this.io = io || null
    this.agentPort = agentPort
    this.httpTunnelPort = httpTunnelPort
    this.agentHost = 'localhost'
    this.socksProxyAgent = this.createAgent()
    this.options = {
      ...new ConnectionsManagerOptions(),
      ...options
    }
    this.socketIOPort = socketIOPort
    this.quietDir = this.options.env?.appDataPath || QUIET_DIR_PATH
    this.StorageCls = storageClass || Storage
    this.libp2pTransportClass = options.libp2pTransportClass || WebsocketsOverTor
    this.ioProxy = new IOProxy(this)
    this.connectedPeers = new Map()

    process.on('unhandledRejection', error => {
      console.error(error)
      throw new Error()
    })
    process.on('SIGINT', function () {
      log('\nGracefully shutting down from SIGINT (Ctrl-C)')
      process.exit(0)
    })
    const webcrypto = new Crypto()
    setEngine(
      'newEngine',
      // @ts-ignore
      webcrypto,
      new CryptoEngine({
        name: '',
        crypto: webcrypto,
        subtle: webcrypto.subtle
      })
    )
  }

  public readonly createAgent = (): Agent => {
    if (this.socksProxyAgent || !this.agentPort || !this.agentHost) return

    log(`Creating https proxy agent: ${this.httpTunnelPort}`)

    return new HttpsProxyAgent({ port: this.httpTunnelPort, host: this.agentHost })
  }

  public readonly createLibp2pAddress = (address: string, port: number, peerId: string): string => {
    return createLibp2pAddress(address, port, peerId, this.options.wsType)
  }

  public readonly createLibp2pListenAddress = (address: string, port: number): string => {
    return createLibp2pListenAddress(address, port, this.options.wsType)
  }

  public initListeners = () => {
    initListeners(this.io, this.ioProxy)
    log('Initialized socket listeners')
  }

  public createNetwork = async () => {
    const ports = await getPorts()
    let hiddenService
    if (this.tor) {
      hiddenService = await this.tor.createNewHiddenService(443, ports.libp2pHiddenService)
      await this.tor.destroyHiddenService(hiddenService.onionAddress.split('.')[0])
    } else {
      hiddenService = {
        onionAddress: '0.0.0.0',
        privateKey: ''
      }
    }

    const peerId = await PeerId.create()
    log(
      `Created network for peer ${peerId.toB58String()}. Address: ${hiddenService.onionAddress as string
      }`
    )
    return {
      hiddenService,
      peerId: peerId.toJSON()
    }
  }

  public init = async () => {
    await this.spawnTor()
    const dataServer = new DataServer(this.socketIOPort)
    this.io = dataServer.io
    this.ioProxy = new IOProxy(this)
    this.initListeners()
    await dataServer.listen()
  }

  public closeAllServices = async () => {
    await this.ioProxy.closeAll()
  }

  public spawnTor = async () => {
    const basePath = this.options.env.resourcesPath || ''
    this.tor = new Tor({
      torPath: torBinForPlatform(basePath),
      appDataPath: this.quietDir,
      controlPort: this.options.torControlPort,
      socksPort: this.agentPort,
      torPassword: this.options.torPassword,
      torAuthCookie: this.options.torAuthCookie,
      httpTunnelPort: this.httpTunnelPort,

      options: {
        env: {
          LD_LIBRARY_PATH: torDirForPlatform(basePath),
          HOME: os.homedir()
        },
        detached: true
      }
    })

    if (this.options.spawnTor) {
      await this.tor.init()
      log('Spawned Tor')
    } else {
      this.tor.initTorControl()
      log('Initialized tor control')
    }
  }

  public initLibp2p = async (params: InitLibp2pParams): Promise<{ libp2p: Libp2p; localAddress: string }> => {
    const localAddress = this.createLibp2pAddress(params.address, params.addressPort, params.peerId.toB58String())

    log(`Initializing libp2p for ${params.peerId.toB58String()}, bootstrapping with ${params.bootstrapMultiaddrs.length} peers`)

    const nodeParams: Libp2pNodeParams = {
      peerId: params.peerId,
      listenAddresses: [this.createLibp2pListenAddress(params.address, params.addressPort)],
      agent: this.socksProxyAgent,
      localAddress: localAddress,
      cert: params.certs?.certificate,
      key: params.certs?.key,
      ca: params.certs?.CA,
      bootstrapMultiaddrsList: params.bootstrapMultiaddrs,
      transportClass: this.libp2pTransportClass,
      targetPort: params.targetPort
    }
    const libp2p = ConnectionsManager.createBootstrapNode(nodeParams)

    this.libp2pInstance = libp2p

    libp2p.on('peer:discovery', (peer: PeerId) => {
      log(`${params.peerId.toB58String()} discovered ${peer.toB58String()}`)
    })

    libp2p.connectionManager.on('peer:connect', (connection: Connection) => {
      log(`${params.peerId.toB58String()} connected to ${connection.remotePeer.toB58String()}`)
      this.connectedPeers.set(connection.remotePeer.toB58String(), DateTime.utc().valueOf())

      this.emit(SocketActionTypes.PEER_CONNECTED, {
        peer: connection.remotePeer.toB58String()
      })
    })

    libp2p.connectionManager.on('peer:disconnect', (connection: Connection) => {
      log(`${params.peerId.toB58String()} disconnected from ${connection.remotePeer.toB58String()}`)

      const connectionStartTime = this.connectedPeers.get(connection.remotePeer.toB58String())

      const connectionEndTime: number = DateTime.utc().valueOf()

      const connectionDuration: number = connectionEndTime - connectionStartTime

      this.connectedPeers.delete(connection.remotePeer.toB58String())

      this.emit(SocketActionTypes.PEER_DISCONNECTED, {
        peer: connection.remotePeer.toB58String(),
        connectionDuration,
        lastSeen: connectionEndTime
      })
    })

    log(`Initialized libp2p for peer ${params.peerId.toB58String()}`)

    return {
      libp2p,
      localAddress
    }
  }

  public createStorage = (peerId: string, communityId: string) => {
    log(`Creating storage for community: ${communityId}`)
    return new this.StorageCls(this.quietDir, this.ioProxy, communityId, {
      ...this.options,
      orbitDbDir: `OrbitDB${peerId}`,
      ipfsDir: `Ipfs${peerId}`
    })
  }

  public sendCertificateRegistrationRequest = async (
    serviceAddress: string,
    userCsr: string,
    requestTimeout: number = 120_000
  ): Promise<Response> => {
    const controller = new AbortController()
    const timeout = setTimeout(() => {
      controller.abort()
    }, requestTimeout)

    let options = {
      method: 'POST',
      body: JSON.stringify({ data: userCsr }),
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal
    }
    if (this.tor) {
      options = Object.assign({
        agent: this.socksProxyAgent
      }, options)
    }

    try {
      const start = new Date()
      const response = await fetch(`${serviceAddress}/register`, options)
      const end = new Date()
      const fetchTime = (end.getTime() - start.getTime()) / 1000
      log(`Fetched ${serviceAddress}, time: ${fetchTime}`)
      return response
    } catch (e) {
      log.error(e)
      throw e
    } finally {
      clearTimeout(timeout)
    }
  }

  public static readonly createBootstrapNode = (params: Libp2pNodeParams): Libp2p => {
    return ConnectionsManager.defaultLibp2pNode(params)
  }

  private static readonly defaultLibp2pNode = (params: Libp2pNodeParams): Libp2p => {
    return new Libp2p({
      connectionManager: {
        minConnections: 3,
        maxConnections: 8
      },
      peerId: params.peerId,
      addresses: {
        listen: params.listenAddresses
      },
      modules: {
        transport: [params.transportClass],
        peerDiscovery: [Bootstrap],
        streamMuxer: [Mplex],
        connEncryption: [NOISE],
        dht: KademliaDHT,
        pubsub: Gossipsub
      },
      dialer: {
        dialTimeout: 120_000,
        maxParallelDials: 10
      },
      config: {
        peerDiscovery: {
          [Bootstrap.tag]: {
            enabled: true,
            list: params.bootstrapMultiaddrsList
          },
          autoDial: true
        },
        relay: {
          enabled: true,
          hop: {
            enabled: true,
            active: false
          }
        },
        dht: {
          enabled: true,
          randomWalk: {
            enabled: true
          }
        },
        transport: {
          [params.transportClass.name]: {
            websocket: {
              agent: params.agent,
              cert: params.cert,
              key: params.key,
              ca: params.ca
            },
            localAddress: params.localAddress,
            targetPort: params.targetPort
          }
        }
      }
    })
  }
}
