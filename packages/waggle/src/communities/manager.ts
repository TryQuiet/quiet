import PeerId, { JSONPeerId } from 'peer-id'
import { ConnectionsManager } from '../libp2p/connectionsManager'
import { Storage } from '../storage'
import { getPorts } from '../utils'
import debug from 'debug'
import { CertsData, DataFromPems } from '../common/types'
import { CertificateRegistration } from '../registration'

const log = Object.assign(debug('waggle:communities'), {
  error: debug('waggle:communities:err')
})

interface HiddenServiceData {
  onionAddress: string
  privateKey?: string
  port?: number
}

interface CommunityData {
  hiddenService: HiddenServiceData
  peerId: JSONPeerId
  localAddress: string
}

export default class CommunitiesManager {
  connectionsManager: ConnectionsManager
  communities: Map<string, Storage>

  constructor(connectionsManager: ConnectionsManager) {
    this.connectionsManager = connectionsManager
    this.communities = new Map()
  }

  public getStorage(peerId: string): Storage {
    try {
      return this.communities.get(peerId)
    } catch (e) {
      log.error(`No available Storage for peer ${peerId}`)
      throw e
    }
  }

  public create = async (certs: CertsData): Promise<CommunityData> => {
    const ports = await getPorts()
    const hiddenService = await this.connectionsManager.tor.createNewHiddenService(ports.libp2pHiddenService, ports.libp2pHiddenService)
    const peerId = await PeerId.create()

    const localAddress = await this.initStorage(peerId, hiddenService.onionAddress, ports.libp2pHiddenService, [peerId.toB58String()], certs)
    log(`Created community, ${peerId.toB58String()}`)
    return {
      hiddenService,
      peerId: peerId.toJSON(),
      localAddress
    }
  }

  public launch = async (peerId: JSONPeerId, hiddenServiceKey: string, bootstrapMultiaddrs: string[], certs: CertsData): Promise<string> => {
    // Start existing community (community that user is already a part of)
    const ports = await getPorts()
    const onionAddress = await this.connectionsManager.tor.spawnHiddenService({
      virtPort: ports.libp2pHiddenService,
      targetPort: ports.libp2pHiddenService,
      privKey: hiddenServiceKey
    })
    log(`Launching community, ${peerId.id}`)
    return await this.initStorage(await PeerId.createFromJSON(peerId), onionAddress, ports.libp2pHiddenService, bootstrapMultiaddrs, certs)
  }

  public initStorage = async (peerId: PeerId, onionAddress: string, port: number, bootstrapMultiaddrs: string[], certs: CertsData): Promise<string> => {
    const listenAddrs = `/dns4/${onionAddress}/tcp/${port}/wss`
    const peerIdB58string = peerId.toB58String()
    const libp2pObj = await this.connectionsManager.initLibp2p(peerId, listenAddrs, bootstrapMultiaddrs, certs)
    const storage = new this.connectionsManager.StorageCls(
      this.connectionsManager.zbayDir,
      this.connectionsManager.io,
      {
        ...this.connectionsManager.options,
        orbitDbDir: `OrbitDB${peerIdB58string}`,
        ipfsDir: `Ipfs${peerIdB58string}`
      }
    )
    await storage.init(libp2pObj.libp2p, peerId)
    this.communities.set(peerIdB58string, storage)
    log(`Initialized storage for peer ${peerIdB58string}`)
    return libp2pObj.localAddress
  }

  public closeStorages = async () => {
    for (const storage of this.communities.values()) {
      await storage.stopOrbitDb()
    }
  }

  public setupRegistrationService = async (storage: Storage, dataFromPems: DataFromPems, hiddenServicePrivKey?: string, port?: number): Promise<CertificateRegistration> => {
    const certRegister = new CertificateRegistration(
      this.connectionsManager.tor,
      storage,
      dataFromPems,
      hiddenServicePrivKey,
      port
    )
    try {
      await certRegister.init()
    } catch (err) {
      log.error(`Couldn't initialize certificate registration service: ${err as string}`)
      return
    }
    try {
      await certRegister.listen()
    } catch (err) {
      log.error(`Certificate registration service couldn't start listening: ${err as string}`)
    }
    return certRegister
  }
}
