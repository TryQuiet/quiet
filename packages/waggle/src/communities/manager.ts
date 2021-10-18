import PeerId, { JSONPeerId } from 'peer-id'
import { ConnectionsManager } from '../libp2p/connectionsManager'
import { Storage } from '../storage'
import { getPorts } from '../common/utils'
import { CertsData, DataFromPems } from '../common/types'
import { CertificateRegistration } from '../registration'
import logger from '../logger'
const log = logger('communities')

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

interface Community {
  storage: Storage
  registrar?: CertificateRegistration
}

export default class CommunitiesManager {
  connectionsManager: ConnectionsManager
  communities: Map<string, Community>

  constructor(connectionsManager: ConnectionsManager) {
    this.connectionsManager = connectionsManager
    this.communities = new Map()
  }

  public getStorage(peerId: string): Storage {
    try {
      return this.getCommunity(peerId).storage
    } catch (e) {
      log.error(`No available Storage for peer ${peerId}`)
      throw e
    }
  }

  public getCommunity(peerId: string): Community {
    return this.communities.get(peerId)
  }

  public create = async (certs: CertsData): Promise<CommunityData> => {
    const ports = await getPorts()
    const virtPort = 443
    const hiddenService = await this.connectionsManager.tor.createNewHiddenService(virtPort, ports.libp2pHiddenService)
    const peerId = await PeerId.create()

    const localAddress = await this.initStorage(peerId, hiddenService.onionAddress, virtPort, ports.libp2pHiddenService, [peerId.toB58String()], certs)
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
    const virtPort = 443

    let onionAddress
    if (this.connectionsManager.tor) {
      onionAddress = await this.connectionsManager.tor.spawnHiddenService({
        virtPort,
        targetPort: ports.libp2pHiddenService,
        privKey: hiddenServiceKey
      })
    } else {
      onionAddress = '0.0.0.0'
    }
    log(`Launching community, ${peerId.id}`)
    return await this.initStorage(await PeerId.createFromJSON(peerId), onionAddress, ports.libp2pHiddenService, ports.libp2pHiddenService, bootstrapMultiaddrs, certs)
  }

  public initStorage = async (peerId: PeerId, onionAddress: string, virtPort: number, targetPort: number, bootstrapMultiaddrs: string[], certs: CertsData): Promise<string> => {
    let port: number
    if (this.connectionsManager.tor) {
      port = virtPort
    } else {
      port = targetPort
    }
    const listenAddrs = `/dns4/${onionAddress}/tcp/${port}/wss`
    const peerIdB58string = peerId.toB58String()
    if (bootstrapMultiaddrs.length === 0) {
      bootstrapMultiaddrs = [`/dns4/${onionAddress}/tcp/${port}/wss/p2p/${peerIdB58string}`]
    }
    const libp2pObj = await this.connectionsManager.initLibp2p(peerId, listenAddrs, bootstrapMultiaddrs, certs, targetPort)
    const storage = this.connectionsManager.createStorage(peerIdB58string)
    await storage.init(libp2pObj.libp2p, peerId)
    this.communities.set(peerIdB58string, { storage })
    log(`Initialized storage for peer ${peerIdB58string}`)
    return libp2pObj.localAddress
  }

  public closeStorages = async () => {
    const storages = Array.from(this.communities.values()).map(community => community.storage)
    log(`Closing ${storages.length} storages`)
    for (const storage of storages) {
      await storage.stopOrbitDb()
    }
  }

  public stopRegistrars = async () => {
    const registrars = Array.from(this.communities.values()).map(community => community.registrar).filter((r) => r !== null && r !== undefined)
    log(`Stopping ${registrars.length} registrars`)
    for (const registrar of registrars) {
      await registrar.stop()
    }
  }

  public setupRegistrationService = async (peerId: string, storage: Storage, dataFromPems: DataFromPems, hiddenServicePrivKey?: string, port?: number): Promise<CertificateRegistration> => {
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
    const community = this.communities.get(peerId)
    community.registrar = certRegister
    this.communities.set(peerId, community)
    log(`Initialized registration service for peer ${peerId}`)
    return certRegister
  }
}
