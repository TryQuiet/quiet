import { Inject, Injectable } from '@nestjs/common'
import { EventEmitter } from 'events'
import {
  ConnectionProcessInfo,
  SocketEvents,
  type UserProfile,
  type UserProfilesStoredEvent,
  type Identity,
  UserData,
  NetworkStats,
  SetUserProfileResponse,
} from '@quiet/types'
import { IPFS_REPO_PATCH, ORBIT_DB_DIR, QUIET_DIR } from '../const'
import { LocalDbService } from '../local-db/local-db.service'
import { createLogger } from '../common/logger'
import { removeFiles, removeDirs, createPaths, removeFilesFromDir } from '../common/utils'
import { type PurgeDataOptions, StorageEvents } from './storage.types'
import { IpfsService } from '../ipfs/ipfs.service'
import { OrbitDbService } from './orbitDb/orbitDb.service'
import { UserProfileStore } from './userProfile/userProfile.store'
import { NotificationTokensStore } from './notifications/notificationTokens.store'
import { LocalDBKeys } from '../local-db/local-db.types'
import { ChannelsService } from './channels/channels.service'
import { Member } from '@localfirst/auth'
import { SigChainService } from '../auth/sigchain.service'
import { DateTime } from 'luxon'
import { createLibp2pAddress } from '@quiet/common'
import { existsSync, readdirSync, rmSync } from 'fs'
import path from 'path'

@Injectable()
export class StorageService extends EventEmitter {
  public initialized: boolean = false
  private initPromise: Promise<void> | undefined
  private storeListenersAttached = false

  private readonly logger = createLogger(StorageService.name)

  constructor(
    @Inject(QUIET_DIR) public readonly quietDir: string,
    @Inject(ORBIT_DB_DIR) public readonly orbitDbDir: string,
    @Inject(IPFS_REPO_PATCH) public readonly ipfsRepoPath: string,
    public readonly localDbService: LocalDbService,
    public readonly ipfsService: IpfsService,
    public readonly orbitDbService: OrbitDbService,
    public readonly userProfileStore: UserProfileStore,
    public readonly notificationTokensStore: NotificationTokensStore,
    public readonly channelsService: ChannelsService,
    public readonly sigchainService: SigChainService
  ) {
    super()
  }

  private prepare() {
    removeFiles(this.quietDir, 'LOCK')
    removeDirs(this.quietDir, 'repo.lock')

    if (!['android', 'ios'].includes(process.platform)) {
      createPaths([this.ipfsRepoPath, this.orbitDbDir, this.quietDir])
    }
  }

  public async init(teamId?: string) {
    if (this.initialized) {
      this.logger.warn(`${StorageService.name} already initialized, skipping duplicate event`)
      if (teamId != null) {
        this.addTeamIdToDbMetas(teamId)
      }
      return
    }

    if (this.initPromise != null) {
      this.logger.warn(`${StorageService.name} currently initializing, waiting for existing initialization`)
      return this.initPromise
    }

    this.initPromise = this.initInternal(teamId).finally(() => {
      this.initPromise = undefined
    })

    return this.initPromise
  }

  private async initInternal(teamId?: string) {
    this.logger.info('Initializing storage')
    this.prepare()

    this.emit(SocketEvents.CONNECTION_PROCESS_INFO, ConnectionProcessInfo.INITIALIZING_IPFS)

    if (this.localDbService.getStatus() === 'closed') {
      await this.localDbService.open()
    }

    this.logger.info(`Starting IPFS`)
    await this.ipfsService.createInstance()
    await this.ipfsService.start()

    this.logger.info(`Creating OrbitDB service`)
    await this.orbitDbService.create(this.ipfsService.ipfsInstance!)

    this.logger.info(`Initializing Databases`)
    await this.initDatabases()

    if (teamId != null) {
      this.addTeamIdToDbMetas(teamId)
    }

    this.logger.info(`Starting database sync`)
    await this.startSync()

    this.logger.info('Updating peer store')
    await this.updatePeerStore()

    this.logger.info('Initialized storage')
    this.initialized = true
    this.emit(StorageEvents.INITIALIZED)
  }

  public async clean() {
    try {
      await this.orbitDbService.stopSync()
    } catch (e) {
      // If the sync was not started, this is fine
    }

    await this.channelsService.clean()
    await this.notificationTokensStore.clean()
    await this.userProfileStore.clean()
    await this.ipfsService.destroyInstance()
    await this.stop()
  }

  public purgeData({ removeTorDataDirectory = true }: PurgeDataOptions = {}) {
    this.logger.info('Purging data directories and files')
    this._purgeDataDirectories({ removeTorDataDirectory })
    this._purgeFiles()
  }
  private _purgeDataDirectories({ removeTorDataDirectory }: Required<PurgeDataOptions>) {
    const dirsToRemove = existsSync(this.quietDir)
      ? readdirSync(this.quietDir).filter(
          i =>
            i.startsWith('Ipfs') ||
            i.startsWith('OrbitDB') ||
            i.startsWith('backendDB') ||
            i.startsWith('Local Storage') ||
            i.startsWith('libp2pDatastore') ||
            i.startsWith('databases') ||
            (removeTorDataDirectory && i.startsWith('TorDataDirectory')) ||
            i.startsWith('uploads') ||
            i.startsWith('downloads')
        )
      : []
    const dirsToRemovePaths = new Set([this.ipfsRepoPath, this.orbitDbDir])
    for (const dir of dirsToRemove) {
      dirsToRemovePaths.add(path.join(this.quietDir, dir))
    }
    for (const dirPath of dirsToRemovePaths) {
      this.logger.info(`Removing dir: ${dirPath}`)
      removeFilesFromDir(dirPath, { throwOnError: false, maxRetries: 1, retryDelay: 100 })
    }
  }

  private _purgeFiles() {
    const filesToRemove = ['Network Persistent State']
    for (const filePath of filesToRemove) {
      this.logger.info(`Removing file ${filePath}`)
      try {
        rmSync(path.join(this.quietDir, filePath))
      } catch (e) {
        this.logger.warn('Failed to delete file on purge', filePath)
      }
    }
  }

  public async startSync() {
    await this.userProfileStore.startSync()
    await this.notificationTokensStore.startSync()
    await this.channelsService.startSync()
  }

  public async stopSync() {
    await this.orbitDbService.stopSync()
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

    this.logger.info('1/4')
    this.attachStoreListeners()
    this.logger.info('2/4')
    await this.userProfileStore.init()

    this.logger.info('3/4')
    await this.notificationTokensStore.init()

    this.logger.info('4/4')
    await this.channelsService.init()

    this.logger.timeEnd('Storage.initDatabases')
    this.logger.info('Initialized DBs')

    this.emit(SocketEvents.CONNECTION_PROCESS_INFO, ConnectionProcessInfo.DBS_INITIALIZED)
  }

  public addTeamIdToDbMetas(teamId: string): void {
    this.logger.info('Adding team ID to all OrbitDB database meta fields')
    this.userProfileStore.updateMetadata({ teamId })
    this.notificationTokensStore.updateMetadata({ teamId })
    this.channelsService.updateMetadata({ teamId })
  }

  public async stop() {
    try {
      await this.channelsService.close()
    } catch (e) {
      this.logger.error('Error closing channels service', e)
    }

    try {
      await this.userProfileStore?.close()
    } catch (e) {
      this.logger.error('Error closing user profiles db', e)
    }

    try {
      await this.notificationTokensStore?.close()
    } catch (e) {
      this.logger.error('Error closing notification tokens db', e)
    }

    try {
      await this.orbitDbService.stop()
    } catch (e) {
      this.logger.error('Error stopping OrbitDB service', e)
    }

    try {
      await this.ipfsService.stop()
    } catch (e) {
      this.logger.error('Error stopping IPFS service', e)
    }
    this.initialized = false
  }

  public attachStoreListeners() {
    if (this.storeListenersAttached) {
      return
    }

    this.userProfileStore.on(StorageEvents.USER_PROFILES_STORED, (payload: UserProfilesStoredEvent) => {
      this.emit(StorageEvents.USER_PROFILES_STORED, payload)
    })
    this.notificationTokensStore.on(StorageEvents.NOTIFICATION_TOKENS_STORED, payload => {
      this.emit(StorageEvents.NOTIFICATION_TOKENS_STORED, payload)
    })
    this.storeListenersAttached = true
  }

  public async addUserProfile(profile: UserProfile): Promise<SetUserProfileResponse> {
    const validationResponse = await UserProfileStore.validateUserProfile(profile)
    if (!validationResponse.success) {
      return validationResponse
    }
    try {
      await this.userProfileStore.setEntry(profile.userId, profile)
    } catch (err) {
      // additions may be deferred if the user is not a member of the team
      this.logger.warn('User profile deferred:', profile.userId, err)
    }
    return { success: true }
  }

  public async deferUserProfile(profile: UserProfile): Promise<SetUserProfileResponse> {
    const validationResponse = await UserProfileStore.validateUserProfile(profile)
    if (!validationResponse.success) {
      return validationResponse
    }
    this.userProfileStore.deferEntry(profile)
    return { success: true }
  }

  public async setIdentity(identity: Identity) {
    await this.localDbService.setIdentity(identity)
  }

  public async getIdentity(id: string): Promise<Identity | undefined> {
    return await this.localDbService.getIdentity(id)
  }

  public async updatePeerStore() {
    const members: Member[] | undefined = this.sigchainService.getActiveChain().team?.members()
    if (!members) return
    // existing peers uses the peerId as the key
    const existingPeers = await this.localDbService.getPeerStats()
    // filter user profiles to only those that are in the team
    const currentUserData = (await this.userProfileStore.getUserProfiles())
      .filter(profile => {
        return members.some(member => member.userId === profile.userId)
      })
      .map(profile => profile.userData)
      .filter((userData): userData is UserData => {
        return !!userData
      })
    // if existing peers has an entry for the user, use that
    // otherwise, create a new entry
    const peers: Record<string, NetworkStats> = {}
    for (const userData of currentUserData) {
      const multiaddr = createLibp2pAddress(userData.onionAddress, userData.peerId)
      const existingStats = existingPeers[userData.peerId]
      if (existingStats) {
        peers[userData.peerId] = existingPeers[userData.peerId]
        peers[userData.peerId].address = multiaddr
      } else {
        peers[userData.peerId] = {
          peerId: userData.peerId,
          address: multiaddr,
          lastSeen: DateTime.utc().toSeconds(),
          connectionTime: 0,
        }
      }
    }
    // update the local db with the new peers
    await this.localDbService.setPeerStats(peers)
  }
}
