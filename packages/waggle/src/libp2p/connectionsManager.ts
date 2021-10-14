import * as os from 'os'
import { HttpsProxyAgent } from 'https-proxy-agent'
import Bootstrap from 'libp2p-bootstrap'
import Gossipsub from 'libp2p-gossipsub'
import { Connection } from 'libp2p-gossipsub/src/interfaces'
import KademliaDHT from 'libp2p-kad-dht'
import Mplex from 'libp2p-mplex'
import { NOISE } from 'libp2p-noise'
import { Response } from 'node-fetch'
import path from 'path'
import PeerId from 'peer-id'
import { CertsData, ConnectionsManagerOptions } from '../common/types'
import { ZBAY_DIR_PATH } from '../constants'
import logger from '../logger'
import IOProxy from '../socket/IOProxy'
import initListeners from '../socket/listeners'
import { Storage } from '../storage'
import { Tor } from '../torManager'
import { fetchRetry, getPorts, torBinForPlatform, torDirForPlatform } from '../common/utils'
import CustomLibp2p, { Libp2pType } from './customLibp2p'
import WebsocketsOverTor from './websocketOverTor'
const log = logger('conn')

export interface IConstructor {
  host?: string
  port?: number
  agentPort?: number
  agentHost?: string
  options?: Partial<ConnectionsManagerOptions>
  io: SocketIO.Server
  storageClass?: any // TODO: what type?
  httpTunnelPort?: number
}

export class ConnectionsManager {
  agentHost: string
  agentPort: number
  httpTunnelPort: number
  socksProxyAgent: any
  options: ConnectionsManagerOptions
  zbayDir: string
  io: SocketIO.Server
  libp2pTransportClass: any
  StorageCls: any
  tor: Tor

  constructor({ agentHost, agentPort, httpTunnelPort, options, storageClass, io }: IConstructor) {
    this.io = io
    this.agentPort = agentPort
    this.httpTunnelPort = httpTunnelPort
    this.agentHost = agentHost
    this.socksProxyAgent = this.createAgent()
    this.options = {
      ...new ConnectionsManagerOptions(),
      ...options
    }
    this.zbayDir = this.options.env?.appDataPath || ZBAY_DIR_PATH
    this.StorageCls = storageClass || Storage
    this.libp2pTransportClass = options.libp2pTransportClass || WebsocketsOverTor

    process.on('unhandledRejection', error => {
      console.error(error)
      throw new Error()
    })
    process.on('SIGINT', function () {
      log('\nGracefully shutting down from SIGINT (Ctrl-C)')
      process.exit(0)
    })
  }

  public readonly createAgent = () => {
    if (this.socksProxyAgent || !this.agentPort || !this.agentHost) return

    log(`Creating https proxy agent: ${this.httpTunnelPort}`)

    return new HttpsProxyAgent({ port: this.httpTunnelPort, host: this.agentHost })
  }

  public initListeners = () => {
    initListeners(this.io, new IOProxy(this))
    log('Initialized socket listeners')
  }

  public createNetwork = async () => {
    const ports = await getPorts()
    const hiddenService = await this.tor.createNewHiddenService(443, ports.libp2pHiddenService)
    await this.tor.destroyHiddenService(hiddenService.onionAddress.split('.')[0])
    const peerId = await PeerId.create()
    return {
      hiddenService,
      peerId: peerId.toJSON()
    }
  }

  public init = async () => {
    this.initListeners()
    await this.spawnTor()
  }

  public spawnTor = async () => {
    let basePath = ''
    if (this.options.useLocalTorFiles) {
      basePath = path.join(__dirname, '../..')
    }

    this.tor = new Tor({
      torPath: torBinForPlatform(basePath),
      appDataPath: this.zbayDir,
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

  public initLibp2p = async (
    peerId: PeerId,
    listenAddrs: string,
    bootstrapMultiaddrs: string[],
    certs: CertsData,
    targetPort: number
  ): Promise<{ libp2p: Libp2pType, localAddress: string }> => {
    const localAddress = `${listenAddrs}/p2p/${peerId.toB58String()}`
    const libp2p = ConnectionsManager.createBootstrapNode({
      peerId: peerId,
      listenAddrs: [listenAddrs],
      agent: this.socksProxyAgent,
      localAddr: localAddress,
      ...certs,
      bootstrapMultiaddrsList: bootstrapMultiaddrs,
      transportClass: this.libp2pTransportClass,
      targetPort
    })
    libp2p.connectionManager.on('peer:connect', (connection: Connection) => {
      log(`${peerId.toB58String()} connected to ${connection.remotePeer.toB58String()}`)
    })
    libp2p.on('peer:discovery', (peer: PeerId) => {
      log(`${peerId.toB58String()} discovered ${peer.toB58String()}`)
    })
    libp2p.connectionManager.on('peer:disconnect', (connection: Connection) => {
      log(`${peerId.toB58String()} disconnected from ${connection.remotePeer.toB58String()}`)
    })
    return {
      libp2p,
      localAddress
    }
  }

  public createStorage = (peerId: string) => {
    return new this.StorageCls(this.zbayDir, this.io, {
      ...this.options,
      orbitDbDir: `OrbitDB${peerId}`,
      ipfsDir: `Ipfs${peerId}`
    })
  }

  public sendCertificateRegistrationRequest = async (
    serviceAddress: string,
    userCsr: string,
    retryCount: number = 3
  ): Promise<Response> => {
    const options = {
      method: 'POST',
      body: JSON.stringify({ data: userCsr }),
      headers: { 'Content-Type': 'application/json' },
      agent: this.socksProxyAgent
    }
    try {
      return await fetchRetry(serviceAddress + '/register', options, retryCount)
    } catch (e) {
      log.error(e)
      throw e
    }
  }

  public static readonly createBootstrapNode = ({
    peerId,
    listenAddrs,
    agent,
    cert,
    key,
    ca,
    localAddr,
    bootstrapMultiaddrsList,
    transportClass,
    targetPort
  }): Libp2pType => {
    return ConnectionsManager.defaultLibp2pNode({
      peerId,
      listenAddrs,
      agent,
      cert,
      key,
      ca,
      localAddr,
      bootstrapMultiaddrsList,
      transportClass,
      targetPort
    })
  }

  private static readonly defaultLibp2pNode = ({
    peerId,
    listenAddrs,
    agent,
    cert,
    key,
    ca,
    localAddr,
    bootstrapMultiaddrsList,
    transportClass,
    targetPort
  }): Libp2pType => {
    return new CustomLibp2p({
      peerId,
      addresses: {
        listen: listenAddrs
      },
      modules: {
        transport: [transportClass],
        peerDiscovery: [Bootstrap],
        streamMuxer: [Mplex],
        connEncryption: [NOISE],
        dht: KademliaDHT,
        pubsub: Gossipsub
      },
      config: {
        peerDiscovery: {
          [Bootstrap.tag]: {
            enabled: true,
            list: bootstrapMultiaddrsList // provide array of multiaddrs
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
          [transportClass.name]: {
            websocket: {
              agent,
              cert,
              key,
              ca
            },
            localAddr,
            targetPort
          }
        }
      }
    })
  }
}
