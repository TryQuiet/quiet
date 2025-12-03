/**
 * Abstraction layer for interacting with QSS
 */
import { Mutex } from 'async-mutex'
import { Server } from '../../../../../3rd-party/auth/packages/auth/dist'
import { MemberContext } from '../../../../../3rd-party/auth/packages/auth/dist/connection'
import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { SigChain } from '../auth/sigchain'
import { createLogger } from '../common/logger'
import { QSS_ALLOWED, QSS_ENDPOINT } from '../const'
import { QSSClient } from './qss.client'
import * as uint8arrays from 'uint8arrays'
import {
  CommunityOperationStatus,
  CommunitySignInMessage,
  CreateCommunity,
  CreateCommunityResponse,
  CreateCommunityStatus,
  QSSLogEntrySyncMessage,
  GeneratePublicKeysMessage,
  WebsocketEvents,
  QSSOperationResult,
  QSSEvents,
  QSSInitStatus,
} from './qss.types'
import { DateTime } from 'luxon'
import * as url from 'node:url'
import EventEmitter from 'node:events'

import { sleep } from '../common/sleep'
import { JoinStatus } from '../libp2p/libp2p.auth'
import { QSSAuthConnectionManager } from './qss-auth-conn-manager.service'
import { LogEntry } from '@orbitdb/core'
import { SigChainService } from '../auth/sigchain.service'
import { EncryptedAndSignedPayload, EncryptionScopeType } from '../auth/services/crypto/types'
import { RoleName } from '../auth/services/roles/roles'
import { hash } from '@localfirst/crypto'
import { OrbitDbService } from '../storage/orbitDb/orbitDb.service'
import { LocalDbService } from '../local-db/local-db.service'
import { LogUpdate } from '../storage/orbitDb/orbitdb.types'
import { logEntryToLogUpdate } from '../storage/orbitDb/util'
import { QSS_RECONNECT_DELAY_MS } from './qss.const'
import { CompoundError, InvitationDataV3, SocketActions, SocketEvents } from '@quiet/types'
import { LocalDbEvents } from '../local-db/local-db.types'
import { SocketService } from '../socket/socket.service'

@Injectable()
export class QSSService extends EventEmitter implements OnModuleDestroy, OnModuleInit {
  /**
   * True while waiting for websocket connection to finish connecting
   */
  private _connecting = false
  /**
   * Interval for checking for unsent sync messages
   */
  private _deadLetterQueueProcessor: NodeJS.Timeout
  /**
   * Interval for retrying/reconnecting to QSS
   */
  private _reconnectQueueProcessor: NodeJS.Timeout

  /**
   * Mutexes for createCommunity per teamId
   */
  private _signInMutex: Mutex = new Mutex()

  private readonly logger = createLogger(`qss:service`)

  constructor(
    @Inject(QSS_ALLOWED) private _qssAllowed: boolean,
    @Inject(QSS_ENDPOINT) public _qssEndpoint: string,
    private readonly qssClient: QSSClient,
    private readonly qssAuthConnManager: QSSAuthConnectionManager,
    private readonly sigChainService: SigChainService,
    private readonly localDbService: LocalDbService,
    private readonly orbitDbService: OrbitDbService,
    private readonly socketService: SocketService
  ) {
    super({ captureRejections: true })
    this.processDeadLetterQueue = this.processDeadLetterQueue.bind(this)
    this._deadLetterQueueProcessor = setInterval(this.processDeadLetterQueue, 30_000)
    this.connect = this.connect.bind(this)
    this._configureEventHandlers()
  }

  public onModuleDestroy() {
    this.close()
  }

  public async onModuleInit() {
    OrbitDbService.events.on('put', (logUpdate: LogUpdate) => {
      void this.sendLogEntrySyncMessage(logUpdate)
    })
  }

  /**
   * Check for pending data sync messages and, if connected, attempt to send to QSS
   */
  private async processDeadLetterQueue(): Promise<void> {
    if (!this.connected) {
      return
    }

    this.logger.info('Processing QSS data sync dead letter queue')

    const unsentHashesByAddr = await this.localDbService.getPendingQssLogSyncMessages()
    const successes: Record<string, string[]> = {}
    for (const [address, unsentHashes] of Object.entries(unsentHashesByAddr)) {
      const successByAddr: string[] = []
      const unsentEntries: LogEntry[] = await this.orbitDbService.getLogEntriesByHashes(address, unsentHashes)
      for (const entry of unsentEntries) {
        const success = await this.sendLogEntrySyncMessage(logEntryToLogUpdate(entry, address))
        if (success) {
          successByAddr.push(entry.hash)
        }
      }
      if (successByAddr.length > 0) {
        successes[address] = successByAddr
      }
    }
    if (Object.keys(successes).length > 0) {
      await this.localDbService.removePendingQssLogSyncMessages(successes)
    }
  }

  private _configureEventHandlers(): void {
    this.qssAuthConnManager.on(QSSEvents.QSS_AUTH_JOINED, () => {
      this.emit(QSSEvents.QSS_AUTH_JOINED)
    })

    this.on(QSSEvents.QSS_START_AUTH_CONN, (teamId: string, teamName?: string) => {
      void this.qssAuthConnManager.startNewConnection(teamId, teamName)
    })

    this.socketService.on(SocketActions.HCAPTCHA_REQUEST, (): void => {
      this.logger.debug('hCaptcha request received')
      if (!this.connected) {
        this.qssClient.once(QSSEvents.QSS_CONNECTED, (): void => {
          this.qssClient.requestCaptchaVerification().catch(error => {
            this.logger.error('Failed to request captcha verification', error)
          })
        })

        this.connect(this.qssEndpoint, true).catch(error => {
          this.logger.error('Failed to connect to QSS on hCaptcha request', error)
        })
      } else {
        this.qssClient.requestCaptchaVerification().catch(error => {
          this.logger.error('Failed to request captcha verification', error)
        })
      }
    })

    this.qssClient.on(QSSEvents.QSS_CAPTCHA_REQUIRED, (): void => {
      this.logger.debug('Captcha required event received from QSS')
      this.qssClient.requestCaptchaVerification().catch(error => {
        this.logger.error('Failed to request captcha verification', error)
      })
    })

    this.localDbService.on(LocalDbEvents.COMMUNITY_ADDED, () => {
      this.logger.debug('Community stored, attempting to authenticate with QSS')
      this.emit(QSSEvents.QSS_HANDLE_SIGN_IN)
    })

    this.qssClient.on(QSSEvents.QSS_CONNECTED, async (): Promise<void> => {
      this.logger.debug('QSS connected, handling appropriate authentication operation')
      this.emit(QSSEvents.QSS_HANDLE_SIGN_IN)
    })

    this.qssClient.on(WebsocketEvents.LOG_ENTRY_SYNC, async (message: QSSLogEntrySyncMessage): Promise<void> => {
      this.logger.debug('Forwarding fanout log entry sync message to OrbitDB service')
      this.orbitDbService.handleFanoutMessage(message)
    })

    this.on(QSSEvents.QSS_HANDLE_SIGN_IN, async () => {
      await this._signInMutex.runExclusive(async () => {
        const initStatus = await this.getQssInitStatus()
        if (!initStatus.communityInitialized || initStatus.community == null) {
          this.logger.warn('Community is null, skipping qss operation reprocessing until community is stored')
          return
        }

        if (!initStatus.qssEnabled) {
          this.logger.trace('QSS not enabled for this community, skipping sign in')
          return
        }

        let sigChain: SigChain
        try {
          sigChain = this.sigChainService.activeChain
        } catch (e) {
          this.logger.error('No active sigchain present, cannot perform QSS operations')
          return
        }

        if (
          !(initStatus.qssSetup ?? false) &&
          sigChain.team != null &&
          this.sigChainService.users.getAllUsers().length === 1
        ) {
          await this.createCommunity(sigChain)
        } else {
          const teamId =
            sigChain.team != null
              ? sigChain.team.id
              : (initStatus.community.inviteData as InvitationDataV3).authData!.teamId!
          const teamName = sigChain.team != null ? sigChain.team.teamName : initStatus.community.name
          this.logger.trace('QSS Sign in', teamId, teamName)
          await this.signInToCommunity(teamId, sigChain, teamName)
        }
      })
    })
  }

  /**
   * Check if QSS is allowed and our websocket connection is active
   */
  public get connected(): boolean {
    return this.canConnect && this.qssClient.connected
  }

  /**
   * Check if QSS is allowed to connect and we have a valid endpoint string
   */
  public get canConnect(): boolean {
    return this.qssAllowed && this._qssEndpoint !== '' && this._qssEndpoint != null
  }

  /**
   * Is QSS allowed to connect on this app?
   */
  public get qssAllowed(): boolean {
    return this._qssAllowed
  }

  /**
   * Configured endpoint for QSS on this app (can come from the flag QSS_ENDPOINT or from the invite)
   */
  public get qssEndpoint(): string | undefined {
    return this._qssEndpoint
  }

  /**
   * Check if QSS is enabled for the current community by its sigchain team ID
   *
   * @returns True if QSS is enabled for the current community
   */
  public async getQssInitStatus(): Promise<QSSInitStatus> {
    const community = await this.localDbService.getCurrentCommunity()
    const status: QSSInitStatus = {
      communityInitialized: false,
      qssEnabled: false,
      qssSetup: false,
      community,
    }
    if (community == null) {
      return status
    }

    return {
      ...status,
      qssEnabled: (community as any).qssEnabled ?? false,
      qssSetup: (community as any).qssSetup ?? false,
      communityInitialized: true,
    }
  }

  /**
   * Check the sigchain join status for a given team
   *
   * @param teamId Team ID we want to check LFA chain join status for
   * @returns JoinStatus for this team
   */
  public joinStatus(teamId: string): JoinStatus {
    const authConnection = this.qssAuthConnManager.getConnection(teamId)
    return authConnection?.joinStatus ?? JoinStatus.NOT_STARTED
  }

  public async connect(qssEndpoint: string | undefined, enabledOverride: boolean = false): Promise<QSSOperationResult> {
    let connStatus: QSSOperationResult
    try {
      connStatus = await this._connectImpl(qssEndpoint, enabledOverride)
    } catch (e) {
      this.logger.error('Error while connecting to QSS', e)
      connStatus = QSSOperationResult.ERROR
    }

    if (this._reconnectQueueProcessor == null) {
      this._reconnectQueueProcessor = setInterval(this.connect, QSS_RECONNECT_DELAY_MS, qssEndpoint, enabledOverride)
    }

    return connStatus
  }

  /**
   * Connect the QSS client if enabled
   *
   * @param qssEndpoint Determined by the QSS_ENDPOINT env variable and data stored in community metadata and V3 invites
   * @returns True if connection was successful
   */
  private async _connectImpl(qssEndpoint: string | undefined, enabledOverride: boolean): Promise<QSSOperationResult> {
    // wait for existing socket to finish connecting, if present
    if (this._connecting) {
      this.logger.trace('Already connecting to QSS, waiting for results of previous connection attempt')
      const waitTime = DateTime.utc().toMillis() + 15_000
      while (!this.connected && DateTime.utc().toMillis() < waitTime) {
        await sleep(500)
      }
    }

    // if we are already connected return true and move on
    if (this.connected) {
      return QSSOperationResult.SUCCESS
    }

    this._connecting = true

    this._qssEndpoint = qssEndpoint ?? this._qssEndpoint
    if (!this.canConnect) {
      this.logger.trace(`Can't connect to QSS because QSS is not initialized`)
      this._connecting = false
      return QSSOperationResult.DISABLED
    }

    if (!enabledOverride) {
      const initStatus = await this.getQssInitStatus()
      if (!initStatus.communityInitialized) {
        this.logger.warn(`Can't determine if QSS is enabled because the community hasn't been initialized in local DB`)
        return QSSOperationResult.ERROR
      }

      if (!initStatus.qssEnabled) {
        this.logger.warn(`Can't connect to QSS because QSS is disabled on this community`)
        return QSSOperationResult.DISABLED
      }
    }

    // wait for our socket to finish connecting
    let connStatus: QSSOperationResult
    try {
      this.logger.info(`Establishing connection with QSS`)
      await this.qssClient.createSocketAndConnect(this._qssEndpoint)
      this.logger.info(`Connection established`)
      connStatus = QSSOperationResult.SUCCESS
    } catch (e) {
      this.logger.error(`Error while connecting to QSS`, e)
      connStatus = QSSOperationResult.ERROR
    }

    this._connecting = false
    return connStatus
  }

  /**
   * Add a community to QSS and start syncing our chain with QSS
   *
   * @param sigChain Sigchain for this community
   * @returns True if successfully created
   */
  public async createCommunity(sigChain: SigChain): Promise<boolean> {
    let created: boolean = false
    try {
      return await this._createCommunityImpl(sigChain)
    } catch (e) {
      created = false
      this.logger.error('Failed to create community on QSS', e)
    }

    return created
  }

  /**
   * Add a community to QSS and start syncing our chain with QSS
   *
   * @param sigChain Sigchain for this community
   * @returns True if successfully created
   */
  public async _createCommunityImpl(sigChain: SigChain): Promise<boolean> {
    if (!this.canConnect) {
      this.logger.trace(`Can't create community on QSS because QSS is not initialized`)
      return false
    }

    if (sigChain.team == null) {
      throw new Error(`Team on this sigchain is nullish!`)
    }

    if (!this.connected) {
      this.logger.warn(`Can't create community on QSS because the client hasn't connected`)
      return false
    }

    if (!this.qssClient.captchaVerified) {
      const verified = await this.qssClient.requestCaptchaVerification()
      if (!verified) {
        this.logger.warn(`Can't create community on QSS because captcha verification failed`)
        return false
      }
    }

    // we need to normalize the hostname for QSS when running locally before adding the server to the chain
    let host = url.parse(this._qssEndpoint).hostname!
    if (host === '127.0.0.1') {
      host = 'localhost'
    }

    // if we don't already have this server in our chain we need to generate keys and add it
    if (!sigChain.team.hasServer(host)) {
      // Generating the QSS LFA keyset for this community
      this.logger.info(`Getting server keys for this team`)
      const qssGeneratePublicKeysMessage: GeneratePublicKeysMessage = {
        ts: DateTime.utc().toMillis(),
        status: CommunityOperationStatus.SENDING,
        payload: {
          teamId: sigChain.team.id,
        },
      }
      const generateKeysResponse = await this.qssClient.sendMessage<GeneratePublicKeysMessage>(
        WebsocketEvents.GEN_PUB_KEYS,
        qssGeneratePublicKeysMessage,
        true
      )

      // if we couldn't create QSS' LFA keys for this community we should eject
      if (
        generateKeysResponse == null ||
        generateKeysResponse.status !== CommunityOperationStatus.SUCCESS ||
        generateKeysResponse.payload == null ||
        generateKeysResponse.payload.teamId != sigChain.team.id ||
        generateKeysResponse.payload.keys == null
      ) {
        this.logger.error(`Failed to generate server keys!`, generateKeysResponse?.reason ?? 'Response was nullish')
        return false
      }

      const lfaServer: Server = {
        host,
        keys: generateKeysResponse.payload.keys,
      }

      // add this QSS server/cluster to our chain using the keys we generated earlier
      this.logger.info(`Got a valid keys response from QSS, adding it to the chain`, lfaServer)
      if (!sigChain.team.hasServer(host)) {
        sigChain.server.addServer(lfaServer)
      }
    }

    const serializedSigChain: Uint8Array = sigChain.save()
    const serializedKeyring: Uint8Array = uint8arrays.fromString(JSON.stringify(sigChain.team.teamKeyring()), 'utf8')
    // send the serialized chain and team keys to QSS
    const qssCreateCommunityMessage: CreateCommunity = {
      ts: DateTime.utc().toMillis(),
      payload: {
        userId: (sigChain.context as MemberContext).user.userId,
        community: {
          teamId: sigChain.team.id,
          sigChain: uint8arrays.toString(serializedSigChain, 'hex'),
        },
        teamKeyring: uint8arrays.toString(serializedKeyring, 'base64'),
      },
    }

    const createCommunityResponse = await this.qssClient.sendMessage<CreateCommunityResponse>(
      WebsocketEvents.CREATE_COMMUNITY,
      qssCreateCommunityMessage,
      true
    )

    // if we didn't get a successful response from QSS when adding the community we should eject
    if (createCommunityResponse == null || createCommunityResponse.status !== CreateCommunityStatus.SUCCESS) {
      this.logger.error(`Failed to create a community!`, createCommunityResponse?.reason ?? 'Response was nullish')
      return false
    }

    const community = await this.localDbService.getCurrentCommunity()
    this.localDbService.updateCommunity(community!.id, { qssSetup: true } as any)

    this.emit(QSSEvents.QSS_START_AUTH_CONN, sigChain.team.id)
    return true
  }

  /**
   * Send a sign in message to QSS and start the auth sync connection with QSS for this community
   *
   * @param teamId ID of the team we are signing in to
   * @param sigChain Sigchain for this team
   * @param teamName Optional team name to pass in for filtering purposes
   */
  public async signInToCommunity(teamId: string, sigChain: SigChain, teamName?: string): Promise<QSSOperationResult> {
    let result: QSSOperationResult
    try {
      result = await this._signInToCommunityImpl(teamId, sigChain, teamName)
    } catch (e) {
      this.logger.error('Failed to sign in to QSS', e)
      result = QSSOperationResult.ERROR
    }

    return result
  }

  /**
   * Send a sign in message to QSS and start the auth sync connection with QSS for this community
   *
   * @param teamId ID of the team we are signing in to
   * @param sigChain Sigchain for this team
   * @param teamName Optional team name to pass in for filtering purposes
   */
  public async _signInToCommunityImpl(
    teamId: string,
    sigChain: SigChain,
    teamName?: string
  ): Promise<QSSOperationResult> {
    if (!this.canConnect) {
      this.logger.info(`Can't sign in to community on QSS because QSS is not enabled for this community`)
      return QSSOperationResult.DISABLED
    }

    if (!this.connected) {
      this.logger.warn(`Can't sign in to community on QSS because the client hasn't connected`)
      return QSSOperationResult.ERROR
    }

    // send a sign in message to QSS for this community and check for a successful response
    this.logger.info(`Signing in to community`, teamId)
    const qssSignInMessage: CommunitySignInMessage = {
      ts: DateTime.utc().toMillis(),
      status: CommunityOperationStatus.SUCCESS,
      payload: {
        userId: (sigChain.context as MemberContext).user.userId,
        teamId,
      },
    }
    const signInResponse = await this.qssClient.sendMessage<CommunitySignInMessage>(
      WebsocketEvents.SIGN_IN_COMMUNITY,
      qssSignInMessage,
      true
    )

    if (signInResponse == null) {
      throw new Error(`Error while signing in to community ${teamId} - Nullish response from QSS`)
    }

    if (signInResponse.status !== CommunityOperationStatus.SUCCESS) {
      const qssError = new Error(signInResponse.reason ?? `Unknown QSS Error`)
      throw new CompoundError(`Error while signing in to community ${teamId} - ${signInResponse.status}`, qssError)
    }

    // start the auth sync connection with QSS now that we've successfully signed in
    this.logger.trace(`Sign in request to QSS was successful, initiating LFA connection`)
    this.emit(QSSEvents.QSS_START_AUTH_CONN, teamId, teamName)
    const community = await this.localDbService.getCurrentCommunity()
    this.localDbService.updateCommunity(community!.id, { qssSetup: true } as any)
    return QSSOperationResult.SUCCESS
  }

  /**
   * Sync an OrbitDB log entry to QSS
   *
   * @param update OrbitDB oplog entry update event
   * @return True if sent successfully, false if send failed, and undefined if the send was skipped
   */
  public async sendLogEntrySyncMessage(update: LogUpdate): Promise<boolean | undefined> {
    if (!this.canConnect) {
      this.logger.info(`Can't send log sync message to QSS because QSS is not enabled for this community`)
      return
    }

    const initStatus = await this.getQssInitStatus()

    if (!initStatus.qssEnabled) {
      this.logger.trace(`Can't sync to QSS because QSS is disabled on this community`)
      return
    }

    let sigChain: SigChain
    try {
      sigChain = this.sigChainService.getChain({ teamId: update.teamId })
    } catch (e) {
      // TODO: when we have multiple teams, we want to check disk for the appropriate sigchain
      // for now these log entries are from stale communities so we can just skip them
      // await this.localDbService.removePendingQssLogSyncMessages({ [update.addr]: [update.hash] })
      this.logger.warn(
        `No sigchain present for team ${update.teamId}, cannot send ${update.hash} log sync message to QSS`
      )
      return
    }

    this.logger.info('Syncing OrbitDB entry to QSS', update.hash)

    this.logger.trace('Encrypting log entry', update.hash)
    const encEntry: EncryptedAndSignedPayload = sigChain.crypto.encryptAndSign(update.entry, {
      type: EncryptionScopeType.ROLE,
      name: RoleName.MEMBER,
    })

    const dataSyncMessage: QSSLogEntrySyncMessage = {
      ts: DateTime.utc().toMillis(),
      status: CommunityOperationStatus.SENDING,
      payload: {
        teamId: update.teamId,
        hash: update.hash,
        hashedDbId: hash('', update.id),
        encEntry,
      },
    }

    return await this._sendLogEntrySyncMessage(dataSyncMessage, update.addr)
  }

  /**
   * Send a data sync message to QSS if connected, otherwise write the message to level DB for later processing
   *
   * @param dataSyncMessage Pending message we want to send to QSS
   * @returns True if sent successfully, false if send failed, and undefined if the send was skipped
   */
  private async _sendLogEntrySyncMessage(
    dataSyncMessage: QSSLogEntrySyncMessage,
    address: string
  ): Promise<boolean | undefined> {
    const hash = dataSyncMessage.payload!.hash
    const teamId = dataSyncMessage.payload?.teamId
    if (!this.connected) {
      this.logger.warn('QSS not connected, writing entry to dead letter queue', hash, teamId)
      try {
        await this.localDbService.addPendingQssLogSyncMessage(address, hash)
      } catch (e) {
        this.logger.error('Failed to write pending QSS log sync message to local DB', e)
      }
      return undefined
    }

    if (this.joinStatus(teamId) !== JoinStatus.JOINED) {
      this.logger.warn('QSS not signed in, writing entry to dead letter queue', hash, teamId)
      try {
        await this.localDbService.addPendingQssLogSyncMessage(address, hash)
      } catch (e) {
        this.logger.error('Failed to write pending QSS log sync message to local DB', e)
      }
      return undefined
    }

    this.logger.trace('Sending log sync message to QSS', hash, teamId)
    const dataSyncAck = await this.qssClient.sendMessage<QSSLogEntrySyncMessage>(
      WebsocketEvents.LOG_ENTRY_SYNC,
      dataSyncMessage,
      true
    )

    let success = false
    if (dataSyncAck == null) {
      this.logger.error('Error while sending a log sync to QSS', hash, teamId)
    } else if (dataSyncAck.status !== CommunityOperationStatus.SUCCESS) {
      this.logger.error(`Error while sending a log sync to QSS - ${dataSyncAck.reason}`, hash, teamId)
    } else {
      this.logger.debug('Successful log sync to QSS')
      success = true
    }

    if (!success) {
      try {
        await this.localDbService.addPendingQssLogSyncMessage(address, hash)
      } catch (e) {
        this.logger.error('Failed to write pending QSS log sync message to local DB', e)
      }
    }

    return success
  }

  /**
   * Close all open auth sync connections and the QSS websocket connection
   */
  public close(): void {
    this.logger.info(`Closing QSS service`)
    clearInterval(this._deadLetterQueueProcessor)
    this.qssAuthConnManager.close()
    this.qssClient.close()
  }
}
