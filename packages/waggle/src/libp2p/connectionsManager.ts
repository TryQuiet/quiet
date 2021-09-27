import * as os from 'os'
import { SocksProxyAgent } from 'socks-proxy-agent'
import Mplex from 'libp2p-mplex'
import { NOISE } from 'libp2p-noise'
import KademliaDHT from 'libp2p-kad-dht'
import Gossipsub from 'libp2p-gossipsub'
import PeerId from 'peer-id'
import WebsocketsOverTor from './websocketOverTor'
import Bootstrap from 'libp2p-bootstrap'
import { Storage } from '../storage'
import { torBinForPlatform, torDirForPlatform, getPorts } from '../utils'
import { ZBAY_DIR_PATH } from '../constants'
import { CertsData, ConnectionsManagerOptions } from '../common/types'
import fetch, { Response } from 'node-fetch'
import debug from 'debug'
import CustomLibp2p, { Libp2pType } from './customLibp2p'
import { Tor } from '../torManager'
import initListeners from '../socket/listeners'
import IOProxy from '../socket/IOProxy'
import { Connection } from 'libp2p-gossipsub/src/interfaces'
import { HttpsProxyAgent } from 'https-proxy-agent'
import path from 'path'

const log = Object.assign(debug('waggle:conn'), {
  error: debug('waggle:conn:err')
})

export interface IConstructor {
  host?: string
  port?: number
  agentPort?: number
  agentHost?: string
  options?: Partial<ConnectionsManagerOptions>
  io: any
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

    log('Creating socks proxy agent')
    return new HttpsProxyAgent({ port: this.httpTunnelPort, host: this.agentHost })
  }

  public initListeners = () => {
    initListeners(this.io, new IOProxy(this))
    log('Initialized socket listeners')
  }

  public createNetwork = async () => {
    const ports = await getPorts()
    const hiddenService = await this.tor.createNewHiddenService(ports.libp2pHiddenService, ports.libp2pHiddenService)
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

  public initLibp2p = async (peerId: PeerId, listenAddrs: string, bootstrapMultiaddrs: string[], certs: CertsData): Promise<{ libp2p: Libp2pType, localAddress: string }> => {
    const localAddress = `${listenAddrs}/p2p/${peerId.toB58String()}`
    const libp2p = ConnectionsManager.createBootstrapNode({
      peerId: peerId,
      listenAddrs: [listenAddrs],
      agent: this.socksProxyAgent,
      localAddr: localAddress,
      ...certs,
      bootstrapMultiaddrsList: bootstrapMultiaddrs,
      transportClass: this.libp2pTransportClass
    })
    libp2p.connectionManager.on('peer:connect', async (connection: Connection) => {
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

  public sendCertificateRegistrationRequest = async (serviceAddress: string, userCsr: string): Promise<Response> => {
    const options = {
      method: 'POST',
      body: JSON.stringify({ data: userCsr }),
      headers: { 'Content-Type': 'application/json' },
      agent: new SocksProxyAgent({ port: this.agentPort, host: this.agentHost })
    }
    try {
      return await fetch(serviceAddress + '/register', options)
    } catch (e) {
      console.error(e)
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
    transportClass
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
      transportClass
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
    transportClass
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
            localAddr
          }
        }
      }
    })
  }
}
