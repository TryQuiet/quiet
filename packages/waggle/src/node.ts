import { Tor } from './torManager'
import { DataServer } from './socket/DataServer'
import { ConnectionsManager } from './libp2p/connectionsManager'
import initListeners from './socket/listeners'
import { dataFromRootPems, ZBAY_DIR_PATH } from './constants'
import * as os from 'os'
import fs from 'fs'
import PeerId from 'peer-id'
import { getPorts, torBinForPlatform, torDirForPlatform } from './utils'

export default class Node {
  tor: Tor
  torPath: string
  torAppDataPath: string
  pathDevLib: string
  hiddenServiceSecret: string | null
  peer: PeerId
  peerIdFileName: string | null
  port: number
  socksProxyPort: number
  torControlPort: number
  hiddenServicePort: number

  constructor(torPath?: string, pathDevLib?: string, peerIdFileName?: string, port = 7788, socksProxyPort = 9050, torControlPort = 9051, hiddenServicePort = 7788, torAppDataPath = ZBAY_DIR_PATH, hiddenServiceSecret?: string) {
    this.torPath = torPath || torBinForPlatform()
    this.torAppDataPath = torAppDataPath
    this.pathDevLib = pathDevLib || torDirForPlatform()
    this.peerIdFileName = peerIdFileName || this.getPeerIdFileName()
    this.port = port
    this.socksProxyPort = socksProxyPort
    this.torControlPort = torControlPort
    this.hiddenServicePort = hiddenServicePort
    this.hiddenServiceSecret = hiddenServiceSecret
  }

  public getHiddenServiceSecret (): string {
    return this.hiddenServiceSecret || process.env.HIDDEN_SERVICE_SECRET
  }

  public getPeerIdFileName (): string {
    return process.env.PEERID_FILE
  }

  async getStaticPeer(): Promise<PeerId> {
    const peerId = fs.readFileSync(this.peerIdFileName)
    const parsedId = JSON.parse(peerId.toString()) as PeerId.JSONPeerId
    return await PeerId.createFromJSON(parsedId)
  }

  async getPeer(): Promise<PeerId | null> {
    if (!this.peerIdFileName) {
      return null
    }
    return await this.getStaticPeer()
  }

  public async init(): Promise<void> {
    this.tor = await this.spawnTor()
    const onionAddress = await this.spawnService()
    console.log('onion', onionAddress)
    const dataServer = await this.initDataServer()
    const connectonsManager = await this.initConnectionsManager(dataServer, onionAddress)
    await this.initListeners(dataServer, connectonsManager)
    await connectonsManager.setupRegistrationService(this.tor, process.env.HIDDEN_SERVICE_SECRET_REGISTRATION, dataFromRootPems)
  }

  async spawnTor (): Promise<Tor> {
    const tor = new Tor({
      torPath: this.torPath,
      appDataPath: this.torAppDataPath,
      controlPort: this.torControlPort,
      socksPort: this.socksProxyPort,
      options: {
        env: {
          LD_LIBRARY_PATH: this.pathDevLib,
          HOME: os.homedir()
        },
        detached: true
      }
    })
    await tor.init()
    return tor
  }

  async spawnService (): Promise<string> {
    console.log('Spawning service')
    let service: any
    try {
      service = this.tor.getServiceAddress(this.hiddenServicePort)
    } catch (e) {
      if (this.getHiddenServiceSecret()) {
        service = await (await this.tor.spawnHiddenService({
          virtPort: this.hiddenServicePort,
          targetPort: this.hiddenServicePort,
          privKey: this.getHiddenServiceSecret()
        }))
      } else {
        service = (await this.tor.createNewHiddenService(this.hiddenServicePort, this.hiddenServicePort)).onionAddress
      }
    }
    return `${service as string}.onion`
  }

  async initDataServer(): Promise<DataServer> {
    console.log('Init DataServer')
    const ports = await getPorts()
    const dataServer = new DataServer(ports.dataServer)
    await dataServer.listen()
    return dataServer
  }

  async initConnectionsManager(dataServer: DataServer, host: string, storageClass?: any, options?: any): Promise<ConnectionsManager> {
    console.log('initStorage.storageClass:->', storageClass)
    const peer = await this.getPeer()
    const connectonsManager = new ConnectionsManager({
      port: this.port,
      host: host,
      agentHost: 'localhost',
      agentPort: this.socksProxyPort,
      io: dataServer.io,
      storageClass,
      options: {
        bootstrapMultiaddrs: process.env.BOOTSTRAP_ADDRS ? [process.env.BOOTSTRAP_ADDRS] : [],
        isEntryNode: true,
        ...options
      }
    })
    const node = await connectonsManager.initializeNode(peer)
    console.log(node)
    await connectonsManager.initStorage()
    return connectonsManager
  }

  async initListeners(dataServer: DataServer, connectonsManager: ConnectionsManager) {
    initListeners(dataServer.io, connectonsManager)
  }
}
