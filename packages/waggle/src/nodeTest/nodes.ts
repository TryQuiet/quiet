import Node from '../node'
import { ZBAY_DIR_PATH } from '../constants'
import { StorageTestSnapshot } from '../storage/storageSnapshot'
import WebsocketsOverTor from '../libp2p/websocketOverTor'
import Websockets from 'libp2p-websockets'
import { DataServer } from '../socket/DataServer'
import { ConnectionsManager } from '../libp2p/connectionsManager'
import CommunitiesManager from '../communities/manager'
/**
 * More customizable version of Node (entry node), mainly for testing purposes
 */

class TestStorageOptions {
  createSnapshot?: boolean
  messagesCount: number
  useSnapshot?: boolean
}

export class LocalNode extends Node {
  storageOptions: any
  appDataPath: string
  storage: any // Storage | StorageTestSnapshot
  localAddress: string
  bootstrapMultiaddrs: string[]

  constructor(
    torPath?: string,
    pathDevLib?: string,
    peerIdFileName?: string,
    port = 7788,
    socksProxyPort = 9050,
    torControlPort = 9051,
    hiddenServicePort = 7788,
    torAppDataPath = ZBAY_DIR_PATH,
    hiddenServiceSecret?: string,
    storageOptions?: TestStorageOptions,
    appDataPath?: string,
    bootstrapMultiaddrs?: string[]
  ) {
    let _port: number = port
    if (process.env.TOR_PORT) {
      _port = Number(process.env.TOR_PORT)
    }
    super(torPath, pathDevLib, peerIdFileName, _port, socksProxyPort, torControlPort, hiddenServicePort, torAppDataPath, hiddenServiceSecret)
    this.storageOptions = storageOptions
    this.appDataPath = appDataPath
    this.bootstrapMultiaddrs = bootstrapMultiaddrs
  }

  async initDataServer(): Promise<DataServer> {
    const dataServer = new DataServer(this.port - 50)
    await dataServer.listen()
    return dataServer
  }
}

export class NodeWithoutTor extends LocalNode {
  public async init(): Promise<void> {
    console.log('Using NodeWithoutTor')
    const dataServer = await this.initDataServer()
    const connectonsManager = await this.initConnectionsManager(
      dataServer,
      StorageTestSnapshot,
      {
        ...this.storageOptions,
        env: {
          appDataPath: this.appDataPath
        },
        libp2pTransport: Websockets
      }
    )
    const communities = new CommunitiesManager(connectonsManager)
    const peerId = await this.getPeer()
    this.localAddress = await communities.initStorage(
      peerId,
      '0.0.0.0',
      this.port,
      this.bootstrapMultiaddrs
    )
    this.storage = communities.getStorage(peerId.toB58String())
  }

  async initConnectionsManager(dataServer: DataServer, storageClass?: any, options?: any): Promise<ConnectionsManager> {
    return new ConnectionsManager({
      io: dataServer.io,
      storageClass,
      options
    })
  }
}

export class NodeWithTor extends LocalNode {
  public async init(): Promise<void> {
    console.log('Using NodeWithTor')
    this.tor = await this.spawnTor()
    const onionAddress = await this.spawnService()
    console.log('onion', onionAddress)
    const dataServer = await this.initDataServer()
    const connectonsManager = await this.initConnectionsManager(
      dataServer,
      StorageTestSnapshot,
      {
        ...this.storageOptions,
        env: {
          appDataPath: this.appDataPath
        },
        libp2pTransport: WebsocketsOverTor
      }
    )
    const communities = new CommunitiesManager(connectonsManager)
    const peerId = await this.getPeer()
    this.localAddress = await communities.initStorage(
      peerId,
      onionAddress,
      this.port,
      this.bootstrapMultiaddrs
    )
    this.storage = communities.getStorage(peerId.toB58String())
  }
}
