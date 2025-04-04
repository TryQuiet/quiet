import { Inject, Injectable } from '@nestjs/common'
import { EventEmitter } from 'events'
import { type PeerId } from '@libp2p/interface'
import {
  ConnectionProcessInfo,
  SocketEvents,
  type UserProfile,
  type UserProfilesStoredEvent,
  type Identity,
} from '@quiet/types'
import { IPFS_REPO_PATCH, ORBIT_DB_DIR, QUIET_DIR } from '../const'
import { LocalDbService } from '../local-db/local-db.service'
import { createLogger } from '../common/logger'
import { removeFiles, removeDirs, createPaths } from '../common/utils'
import { StorageEvents } from './storage.types'
import { IpfsService } from '../ipfs/ipfs.service'
import { OrbitDbService } from './orbitDb/orbitDb.service'
import { UserProfileStore } from './userProfile/userProfile.store'
import { LocalDBKeys } from '../local-db/local-db.types'
import { ChannelsService } from './channels/channels.service'

@Injectable()
export class StorageService extends EventEmitter {
  private peerId: PeerId | null = null

  private readonly logger = createLogger(StorageService.name)

  constructor(
    @Inject(QUIET_DIR) public readonly quietDir: string,
    @Inject(ORBIT_DB_DIR) public readonly orbitDbDir: string,
    @Inject(IPFS_REPO_PATCH) public readonly ipfsRepoPath: string,
    private readonly localDbService: LocalDbService,
    private readonly ipfsService: IpfsService,
    private readonly orbitDbService: OrbitDbService,
    private readonly userProfileStore: UserProfileStore,
    private readonly channelsService: ChannelsService
  ) {
    super()
  }

  private prepare() {
    removeFiles(this.quietDir, 'LOCK')
    removeDirs(this.quietDir, 'repo.lock')

    if (!['android', 'ios'].includes(process.platform)) {
      createPaths([this.ipfsRepoPath, this.orbitDbDir])
    }
  }

  public async init(peerId: PeerId) {
    this.logger.info('Initializing storage')
    this.prepare()
    this.peerId = peerId

    this.emit(SocketEvents.CONNECTION_PROCESS_INFO, ConnectionProcessInfo.INITIALIZING_IPFS)

    this.logger.info(`Starting IPFS`)
    await this.ipfsService.createInstance()
    await this.ipfsService.start()

    this.logger.info(`Creating OrbitDB service`)
    await this.orbitDbService.create(peerId, this.ipfsService.ipfsInstance!)

    this.logger.info(`Initializing Databases`)
    await this.initDatabases()

    this.logger.info(`Starting database sync`)
    await this.startSync()

    this.logger.info('Initialized storage')
  }

  private async startSync() {
    if (!this.ipfsService.isStarted()) {
      this.logger.warn(`IPFS not started. Not starting database sync`)
      return
    }

    // await this.communityMetadataStore.startSync()
    // await this.certificatesStore.startSync()
    // await this.certificatesRequestsStore.startSync()
    await this.userProfileStore.startSync()
    await this.channelsService.startSync()
  }

  static dbAddress = (db: { root: string; path: string }) => {
    // Note: Do not use path.join for creating db address!
    return `/orbitdb/${db.root}/${db.path}`
  }

  /**
   * Get the ChannelsService for managing channels and messages
   */
  public get channels() {
    return this.channelsService
  }

  public async initDatabases() {
    this.logger.time('Storage.initDatabases')

    if (!(await this.localDbService.exists(LocalDBKeys.PEERS))) {
      this.logger.info(`Adding empty value to 'peers' key in local DB`)
      await this.localDbService.put(LocalDBKeys.PEERS, {})
    }

    this.logger.info('1/3')
    this.attachStoreListeners()

    // FIXME: This is sort of messy how we are initializing things. Currently,
    // the CommunityMetadataStore sends an event during initialization which is
    // picked up by the CertificatesStore. Perhaps we can initialize stores
    // first and then load data/send events.
    this.logger.info('2/3')
    // await this.certificatesStore.init()
    // await this.certificatesRequestsStore.init()
    // await this.communityMetadataStore.init()
    await this.userProfileStore.init()

    this.logger.info('3/3')
    await this.channelsService.init(this.peerId!)

    this.logger.timeEnd('Storage.initDatabases')
    this.logger.info('Initialized DBs')

    this.emit(SocketEvents.CONNECTION_PROCESS_INFO, ConnectionProcessInfo.DBS_INITIALIZED)
  }

  public async stop() {
    await this.channelsService.close()

    try {
      await this.userProfileStore?.close()
    } catch (e) {
      this.logger.error('Error closing user profiles db', e)
    }

    await this.orbitDbService.stop()

    try {
      await this.ipfsService.stop()
    } catch (e) {
      this.logger.error('Error stopping IPFS service', e)
    }
  }

  public attachStoreListeners() {
    this.userProfileStore.on(StorageEvents.USER_PROFILES_STORED, (payload: UserProfilesStoredEvent) => {
      this.emit(StorageEvents.USER_PROFILES_STORED, payload)
    })
  }

  public async addUserProfile(profile: UserProfile) {
    await this.userProfileStore.setEntry(profile.userId, profile)
  }

  public async setIdentity(identity: Identity) {
    await this.localDbService.setIdentity(identity)
  }

  public async getIdentity(id: string): Promise<Identity | undefined> {
    return await this.localDbService.getIdentity(id)
  }

  public async clean() {
    this.peerId = null

    await this.channelsService.clean()

    // this.certificatesRequestsStore.clean()
    // this.certificatesStore.clean()
    // this.communityMetadataStore.clean()
    this.userProfileStore.clean()

    await this.ipfsService.destoryInstance()
  }
}
