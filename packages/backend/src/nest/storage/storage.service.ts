import { Inject, Injectable } from '@nestjs/common'
import { EventEmitter } from 'events'
import { type PeerId } from '@libp2p/interface'
import {
  ConnectionProcessInfo,
  SocketEvents,
  type CachedUserProfileResponse,
  type UserProfile,
  type UserProfilesStoredEvent,
  type Identity,
  type DeviceNetworkEndpoint,
  type NetworkEndpointsStoredEvent,
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
import { NetworkEndpointsStore } from './networkEndpoints/networkEndpoints.store'
import { LocalDBKeys } from '../local-db/local-db.types'
import { ChannelsService } from './channels/channels.service'
import { SigChainService } from '../auth/sigchain.service'
import { DateTime } from 'luxon'
import { createLibp2pAddress } from '@quiet/common'
import { existsSync, readdirSync, rmSync } from 'fs'
import path from 'path'
import { SocketService } from '../socket/socket.service'
import { Libp2pEvents } from '../libp2p/libp2p.types'

const CACHED_USER_PROFILE_REQUEST_TIMEOUT_MS = 5_000

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
    public readonly networkEndpointsStore: NetworkEndpointsStore,
    public readonly notificationTokensStore: NotificationTokensStore,
    public readonly channelsService: ChannelsService,
    public readonly sigchainService: SigChainService,
    public readonly socketService: SocketService
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
    await this.migrateMissingSelfUserProfile()

    if (teamId != null) {
      this.addTeamIdToDbMetas(teamId)
    }

    this.logger.info(`Starting database sync`)
    await this.startSync()

    this.logger.info('Publishing local network endpoint')
    await this.publishLocalNetworkEndpoint()

    this.logger.info('Updating peer store')
    await this.updatePeerStore()

    this.logger.info('Initialized storage')
    this.initialized = true
    this.emit(StorageEvents.INITIALIZED)
  }

  private async migrateMissingSelfUserProfile(): Promise<void> {
    const activeChain = this.sigchainService.getActiveChain(false)
    if (!activeChain?.team || !activeChain.roles.amIMember()) {
      this.logger.trace('Skipping cached self user profile migration; active user is not a team member')
      return
    }

    // Fresh joins already queue the profile supplied by the join flow. Persist
    // that profile first so the migration does not append a duplicate cached
    // entry before startSync flushes the same deferred profile again.
    await this.userProfileStore.flushDeferredEntries()

    const selfUserId = activeChain.user.userId
    const storedProfiles = await this.userProfileStore.getUserProfiles()
    if (storedProfiles.some(profile => profile.userId === selfUserId)) {
      this.logger.trace('Skipping cached self user profile migration; profile already exists in store', selfUserId)
      return
    }
    if (this.socketService.serverIoProvider.io.sockets.sockets.size === 0) {
      this.logger.trace('Skipping cached self user profile migration; no connected state-manager clients')
      return
    }

    const cachedProfile = await this.requestCachedSelfUserProfile(selfUserId)
    if (!cachedProfile) {
      this.logger.info('No cached self user profile returned by state-manager', selfUserId)
      return
    }
    if (cachedProfile.userId !== selfUserId) {
      this.logger.warn('Cached self user profile userId mismatch', {
        expected: selfUserId,
        received: cachedProfile.userId,
      })
      return
    }

    const response = await this.addUserProfile(cachedProfile)
    if (!response.success) {
      this.logger.warn('Failed to migrate cached self user profile', selfUserId, response.error)
    }
  }

  private async requestCachedSelfUserProfile(userId: string): Promise<UserProfile | undefined> {
    this.logger.info('Requesting cached self user profile from state-manager', userId)
    return new Promise(resolve => {
      this.socketService.serverIoProvider.io
        .timeout(CACHED_USER_PROFILE_REQUEST_TIMEOUT_MS)
        .emit(
          SocketEvents.CACHED_USER_PROFILE_REQUEST,
          { userId },
          (err: Error | null, responses: CachedUserProfileResponse[] = []) => {
            if (err) {
              this.logger.warn('Timed out requesting cached self user profile from state-manager', userId, err)
              resolve(undefined)
              return
            }

            resolve(responses.find(response => response?.profile)?.profile)
          }
        )
    })
  }

  public async clean() {
    try {
      await this.orbitDbService.stopSync()
    } catch (e) {
      // If the sync was not started, this is fine
    }

    await this.channelsService.clean()
    await this.notificationTokensStore.clean()
    await this.networkEndpointsStore.clean()
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
    await this.networkEndpointsStore.startSync()
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

    this.logger.info('1/5')
    this.attachStoreListeners()
    this.logger.info('2/5')
    await this.userProfileStore.init()

    this.logger.info('3/5')
    await this.networkEndpointsStore.init()

    this.logger.info('4/5')
    await this.notificationTokensStore.init()

    this.logger.info('5/5')
    await this.channelsService.init()

    this.logger.timeEnd('Storage.initDatabases')
    this.logger.info('Initialized DBs')

    this.emit(SocketEvents.CONNECTION_PROCESS_INFO, ConnectionProcessInfo.DBS_INITIALIZED)
  }

  public addTeamIdToDbMetas(teamId: string): void {
    this.logger.info('Adding team ID to all OrbitDB database meta fields')
    this.userProfileStore.updateMetadata({ teamId })
    this.networkEndpointsStore.updateMetadata({ teamId })
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
      await this.networkEndpointsStore?.close()
    } catch (e) {
      this.logger.error('Error closing network endpoints db', e)
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

    this.ipfsService.libp2pService.on(Libp2pEvents.AUTH_CONNECTED, (peerId: PeerId) => {
      void this.orbitDbService.resyncPeer(peerId).catch(error => {
        this.logger.warn('Failed to refresh databases after authentication', error)
      })
    })

    this.userProfileStore.on(StorageEvents.USER_PROFILES_STORED, (payload: UserProfilesStoredEvent) => {
      this.emit(StorageEvents.USER_PROFILES_STORED, payload)
    })
    this.networkEndpointsStore.on(StorageEvents.NETWORK_ENDPOINTS_STORED, (payload: NetworkEndpointsStoredEvent) => {
      this.emit(StorageEvents.NETWORK_ENDPOINTS_STORED, payload)
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

  private async publishLocalNetworkEndpoint(): Promise<void> {
    const chain = this.sigchainService.getActiveChain(false)
    if (chain?.team == null || !chain.roles.amIMember() || !chain.team.hasDevice(chain.device.deviceId)) {
      this.logger.warn('Skipping network endpoint publication without an active admitted device')
      return
    }

    const community = await this.localDbService.getCurrentCommunity()
    if (community == null) {
      this.logger.warn('Skipping network endpoint publication without a current community')
      return
    }
    const identity = await this.getIdentity(community.id)
    if (identity == null) {
      this.logger.warn('Skipping network endpoint publication without a local identity')
      return
    }

    const endpoint: DeviceNetworkEndpoint = {
      teamId: chain.team.id,
      userId: chain.user.userId,
      deviceId: chain.device.deviceId,
      onionAddress: identity.networkInfo.hiddenService.onionAddress.replace(/\.onion$/, ''),
      peerId: identity.networkInfo.peerId.id,
    }
    await this.networkEndpointsStore.setEntry(endpoint.deviceId, endpoint)
  }

  public async updatePeerStore() {
    const team = this.sigchainService.getActiveChain().team
    if (!team) return
    const existingPeers = await this.localDbService.getPeerStats()
    const endpoints = await this.networkEndpointsStore.getNetworkEndpoints()
    if (this.sigchainService.getActiveChain(false)?.team !== team) return
    const libp2p = this.ipfsService.libp2pService
    const peers: Record<string, NetworkStats> = {}

    // Endpoint replication can lag behind LFA admission. Keep a known reachable
    // address only when its secured-session binding still names a current device
    // of a current member. Persist the binding for a restart during that gap.
    for (const [peerId, stats] of Object.entries(existingPeers ?? {})) {
      const authenticatedIdentity = libp2p.getAuthenticatedPeerIdentity(peerId) ?? stats.authenticatedIdentity
      if (stats.address && authenticatedIdentity && libp2p.isAuthenticatedPeerAuthorized(authenticatedIdentity)) {
        peers[peerId] = { ...stats, authenticatedIdentity }
      }
    }

    // A device that has left the team must not keep a reachable address, even if its
    // session was still authorised the last time it was seen.
    const activeEndpoints = endpoints.filter(endpoint => team.hasDevice(endpoint.deviceId))
    for (const endpoint of endpoints) {
      if (!team.hasDevice(endpoint.deviceId)) delete peers[endpoint.peerId]
    }

    for (const endpoint of activeEndpoints) {
      const multiaddr = createLibp2pAddress(endpoint.onionAddress, endpoint.peerId)
      const retained = peers[endpoint.peerId]
      if (retained) {
        // Session binding already checked above; just refresh the address.
        peers[endpoint.peerId] = { ...retained, address: multiaddr }
        continue
      }
      // The endpoint itself is team-verified, but a stored session binding that
      // failed the check above must not be carried over with it.
      const existingStats = existingPeers[endpoint.peerId]
      if (existingStats) {
        peers[endpoint.peerId] = { ...existingStats, authenticatedIdentity: undefined, address: multiaddr }
      } else {
        peers[endpoint.peerId] = {
          peerId: endpoint.peerId,
          address: multiaddr,
          lastSeen: DateTime.utc().toSeconds(),
          connectionTime: 0,
        }
      }
    }
    await this.localDbService.setPeerStats(peers)
  }
}
