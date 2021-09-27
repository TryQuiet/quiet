import { Tor } from './torManager'
import { DataServer } from './socket/DataServer'
import { ConnectionsManager } from './libp2p/connectionsManager'
import { ZBAY_DIR_PATH } from './constants'
import * as os from 'os'
import fs from 'fs'
import PeerId from 'peer-id'
import { getPorts, torBinForPlatform, torDirForPlatform } from './utils'
import { dataFromRootPems } from './testUtils'
import CommunitiesManager from './communities/manager'
import { CertsData } from './common/types'

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
  httpTunnelPort: number
  torControlPort: number
  hiddenServicePort: number
  certificates: CertsData

  constructor(torPath?: string, pathDevLib?: string, peerIdFileName?: string, port = 7788, socksProxyPort = 9050, httpTunnelPort = 9052, torControlPort = 9051, hiddenServicePort = 7788, torAppDataPath = ZBAY_DIR_PATH, hiddenServiceSecret?: string, certificates?: CertsData) {
    this.torPath = torPath || torBinForPlatform()
    this.torAppDataPath = torAppDataPath
    this.pathDevLib = pathDevLib || torDirForPlatform()
    this.peerIdFileName = peerIdFileName || this.getPeerIdFileName()
    this.port = port
    this.socksProxyPort = socksProxyPort
    this.httpTunnelPort = httpTunnelPort
    this.torControlPort = torControlPort
    this.hiddenServicePort = hiddenServicePort
    this.hiddenServiceSecret = hiddenServiceSecret
    this.certificates = certificates
  }

  public getHiddenServiceSecret(): string {
    return this.hiddenServiceSecret || process.env.HIDDEN_SERVICE_SECRET
  }

  public getPeerIdFileName(): string {
    return process.env.PEERID_FILE
  }

  async getStaticPeer(): Promise<PeerId> {
    const peerId = fs.readFileSync(this.peerIdFileName)
    const parsedId = JSON.parse(peerId.toString()) as PeerId.JSONPeerId
    return await PeerId.createFromJSON(parsedId)
  }

  async getPeer(): Promise<PeerId> {
    if (!this.peerIdFileName) {
      return await PeerId.create()
    }
    return await this.getStaticPeer()
  }

  public async init(): Promise<void> { // TODO: Check if this is working
    this.tor = await this.spawnTor()
    const onionAddress = await this.spawnService()
    const dataServer = await this.initDataServer()
    const connectonsManager = await this.initConnectionsManager(dataServer)
    const communities = new CommunitiesManager(connectonsManager)
    const peerId = await this.getPeer()

    await communities.initStorage(
      peerId,
      onionAddress,
      this.port,
      ['/dns4/2lmfmbj4ql56d55lmv7cdrhdlhls62xa4p6lzy6kymxuzjlny3vnwyqd.onion/tcp/7788/wss/p2p/Qmak8HeMad8X1HGBmz2QmHfiidvGnhu6w6ugMKtx8TFc85'],
      this.certificates
    )
    await communities.setupRegistrationService(
      peerId.toB58String(),
      communities.getStorage(peerId.toB58String()),
      dataFromRootPems,
      process.env.HIDDEN_SERVICE_SECRET_REGISTRATION
    )
  }

  async spawnTor(): Promise<Tor> {
    const tor = new Tor({
      torPath: this.torPath,
      appDataPath: this.torAppDataPath,
      controlPort: this.torControlPort,
      socksPort: this.socksProxyPort,
      httpTunnelPort: this.httpTunnelPort,
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

  async spawnService(): Promise<string> {
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
    return `${service as string}`
  }

  async initDataServer(): Promise<DataServer> {
    console.log('Init DataServer')
    const ports = await getPorts()
    const dataServer = new DataServer(ports.dataServer)
    await dataServer.listen()
    return dataServer
  }

  async initConnectionsManager(dataServer: DataServer, storageClass?: any, options?: any): Promise<ConnectionsManager> {
    console.log('initStorage.storageClass:->', storageClass)
    const connectonsManager = new ConnectionsManager({
      httpTunnelPort: this.httpTunnelPort,
      agentHost: 'localhost',
      agentPort: this.socksProxyPort,
      io: dataServer.io,
      storageClass,
      options: {
        isEntryNode: true,
        torControlPort: this.torControlPort,
        torPassword: this.tor.torPassword,
        spawnTor: false,
        ...options
      }
    })
    await connectonsManager.init()
    return connectonsManager
  }
}
