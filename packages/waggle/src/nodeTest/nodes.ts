import Node from '../node'
import { ZBAY_DIR_PATH } from '../constants'
import WebsocketsOverTor from '../libp2p/websocketOverTor'
import Websockets from 'libp2p-websockets'
import { DataServer } from '../socket/DataServer'
import { ConnectionsManager } from '../libp2p/connectionsManager'
import CommunitiesManager from '../communities/manager'
import { createUsersCerts } from '../libp2p/tests/client-server'
import { ConnectionsManagerOptions } from '../common/types'
import { RootCA } from '@zbayapp/identity'
import { Certificates } from '@zbayapp/nectar'

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
  storageClass: any
  appDataPath: string
  storage: any // Storage | StorageTestSnapshot
  localAddress: string
  bootstrapMultiaddrs: string[]
  rootCa: RootCA
  connectionsManager: ConnectionsManager
  communitiesManager: CommunitiesManager
  dataServer: DataServer

  constructor(
    torPath?: string,
    pathDevLib?: string,
    peerIdFileName?: string,
    port = 7788,
    socksProxyPort = 9050,
    torControlPort = 9051,
    httpTunnelPort = 9052,
    hiddenServicePort = 7788,
    torAppDataPath = ZBAY_DIR_PATH,
    hiddenServiceSecret?: string,
    storageOptions?: TestStorageOptions,
    appDataPath?: string,
    bootstrapMultiaddrs?: string[],
    rootCa?: RootCA,
    storageClass?: any
  ) {
    let _port: number = port
    if (process.env.TOR_PORT) {
      _port = Number(process.env.TOR_PORT)
    }
    super(
      torPath,
      pathDevLib,
      peerIdFileName,
      _port,
      socksProxyPort,
      torControlPort,
      hiddenServicePort,
      httpTunnelPort,
      torAppDataPath,
      hiddenServiceSecret
    )
    this.storageOptions = storageOptions
    this.appDataPath = appDataPath
    this.bootstrapMultiaddrs = bootstrapMultiaddrs
    this.rootCa = rootCa
    this.storageClass = storageClass
  }

  async closeDataServer(): Promise<any> {
    await this.dataServer.close()
  }

  async initDataServer(): Promise<DataServer> {
    this.dataServer = new DataServer(this.port - 50)
    await this.dataServer.listen()
    return this.dataServer
  }

  public async closeServices(): Promise<void> {
    await this.communitiesManager.closeStorages()
    await this.closeDataServer()
    if (this.tor) {
      await this.tor.kill()
    }
  }
}

export class NodeWithoutTor extends LocalNode {
  public async init(): Promise<void> {
    console.log('Using NodeWithoutTor')
    const dataServer = await this.initDataServer()
    const connectionsManager = await this.initConnectionsManager(dataServer, this.storageClass, {
      ...this.storageOptions,
      wsType: 'ws',
      env: {
        appDataPath: this.appDataPath
      },
      libp2pTransportClass: Websockets
    })
    const communitiesManager = new CommunitiesManager(connectionsManager)
    const peerId = await this.getPeer()
    const bootstrapAddressArrayWs = this.bootstrapMultiaddrs.map(address =>
      address.replace('wss', 'ws')
    )
    // eslint-disable-next-line
    const certs = {} as Certificates
    this.localAddress = await communitiesManager.initStorage({
      communityId: 'communityId',
      peerId: peerId,
      onionAddress: '0.0.0.0',
      virtPort: this.port,
      targetPort: this.port,
      peers: bootstrapAddressArrayWs,
      certs: certs
    })
    this.connectionsManager = connectionsManager
    this.communitiesManager = communitiesManager
    this.storage = communitiesManager.getStorage(peerId.toB58String())
  }

  async initConnectionsManager(
    dataServer: DataServer,
    storageClass?: any,
    options?: ConnectionsManagerOptions
  ): Promise<ConnectionsManager> {
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
    console.log(this.storageOptions)
    const connectionsManager = await this.initConnectionsManager(dataServer, this.storageClass, {
      ...this.storageOptions,
      env: {
        appDataPath: this.appDataPath
      },
      libp2pTransportClass: WebsocketsOverTor
    })
    const userCert = await createUsersCerts(onionAddress, this.rootCa)

    const certs: Certificates = {
      certificate: userCert.userCert,
      key: userCert.userKey,
      CA: [this.rootCa.rootCertString]
    }
    const virtPort = 443

    const communitiesManager = new CommunitiesManager(connectionsManager)
    const peerId = await this.getPeer()
    this.localAddress = await communitiesManager.initStorage({
      communityId: 'communityId',
      peerId: peerId,
      onionAddress: onionAddress,
      virtPort: virtPort,
      targetPort: this.port,
      peers: this.bootstrapMultiaddrs,
      certs: certs
    })
    this.connectionsManager = connectionsManager
    this.communitiesManager = communitiesManager
    this.storage = communitiesManager.getStorage(peerId.toB58String())
  }
}
