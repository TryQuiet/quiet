/**
 * Abstraction layer for interacting with QSS
 */
import { Server } from '../../../../../3rd-party/auth/packages/auth/dist'
import { MemberContext } from '../../../../../3rd-party/auth/packages/auth/dist/connection'
import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common'
import { Community } from '@quiet/types'
import { SigChain } from '../auth/sigchain'
import { createLogger } from '../common/logger'
import { QSS_ENABLED, QSS_ENDPOINT } from '../const'
import { QSSClient } from './qss.client'
import * as uint8arrays from 'uint8arrays'
import {
  CommunityOperationStatus,
  CommunitySignInMessage,
  CreateCommunity,
  CreateCommunityResponse,
  CreateCommunityStatus,
  QSSDataSyncMessage,
  GeneratePublicKeysMessage,
  GeneratePublicKeysResponse,
  WebsocketEvents,
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
import { hash } from '../../../../../3rd-party/auth/packages/crypto/dist'

@Injectable()
export class QSSService extends EventEmitter implements OnModuleDestroy {
  /**
   * True while waiting for websocket connection to finish connecting
   */
  private _connecting = false

  private readonly logger = createLogger(`qss:service`)

  constructor(
    @Inject(QSS_ENABLED) private qssEnabled: boolean,
    @Inject(QSS_ENDPOINT) public qssEndpoint: string,
    private readonly qssClient: QSSClient,
    private readonly qssAuthConnManager: QSSAuthConnectionManager,
    private readonly sigChainService: SigChainService
  ) {
    super({ captureRejections: true })
  }

  public onModuleDestroy() {
    this.close()
  }

  /**
   * Check if QSS is enabled and our websocket connection is active
   */
  public get connected(): boolean {
    return this.enabled && !!this.qssClient.clientSocket?.connected
  }

  /**
   * Check if QSS is enabled and we have a valid endpoint string
   */
  public get enabled(): boolean {
    return this.qssEnabled && this.qssEndpoint !== '' && this.qssEndpoint != null
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

  /**
   * Connect the QSS client if enabled
   *
   * @param qssEnabled Determined by the QSS_ENABLED env variable and data stored in community metadata and V3 invites
   * @param qssEndpoint Determined by the QSS_ENDPOINT env variable and data stored in community metadata and V3 invites
   * @returns True if connection was successful
   */
  public async connect(qssEnabled: boolean, qssEndpoint: string | undefined): Promise<boolean> {
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
      return true
    }

    this._connecting = true

    this.qssEnabled = this.qssEnabled || qssEnabled
    this.qssEndpoint = qssEndpoint ?? this.qssEndpoint
    if (!this.enabled) {
      this.logger.trace(`Can't connect to QSS because QSS is not initialized`)
      return false
    }

    // wait for our socket to finish connecting
    let connected = false
    try {
      this.logger.info(`Establishing connection with QSS`)
      await this.qssClient.createSocket(this.qssEnabled, this.qssEndpoint)
      this.logger.info(`Connection established`)
      connected = true
    } catch (e) {
      this.logger.error(`Error while connecting to QSS`, e)
      connected = false
    }

    this._connecting = false
    return connected
  }

  /**
   * Add a community to QSS and start syncing our chain with QSS
   *
   * @param community Metadata for community we are adding to QSS
   * @param sigChain Sigchain for this community
   * @returns True if successfully created
   */
  public async createCommunity(community: Community, sigChain: SigChain): Promise<boolean> {
    if (!this.enabled) {
      this.logger.trace(`Can't create community on QSS because QSS is not initialized`)
      return false
    }

    if (sigChain.team == null) {
      throw new Error(`Team on this sigchain is nullish!`)
    }

    // Generating the QSS LFA keyset for this community
    this.logger.info(`Getting server keys for this team`)
    const qssGeneratePublicKeysMessage: GeneratePublicKeysMessage = {
      ts: DateTime.utc().toMillis(),
      payload: {
        teamId: sigChain.team.id,
      },
    }
    const generateKeysResponse = await this.qssClient.sendMessage<GeneratePublicKeysResponse>(
      WebsocketEvents.GEN_PUB_KEYS,
      qssGeneratePublicKeysMessage,
      true
    )

    // if we couldn't create QSS' LFA keys for this community we should eject
    if (
      generateKeysResponse == null ||
      generateKeysResponse.payload.status !== CommunityOperationStatus.SUCCESS ||
      generateKeysResponse.payload.payload == null ||
      generateKeysResponse.payload.payload.teamId != sigChain.team.id
    ) {
      this.logger.error(
        `Failed to generate server keys!`,
        generateKeysResponse?.payload.reason ?? 'Response was nullish'
      )
      return false
    }

    // we need to normalize the hostname for QSS when running locally before adding the server to the chain
    let host = url.parse(this.qssEndpoint).hostname!
    if (host === '127.0.0.1') {
      host = 'localhost'
    }

    const lfaServer: Server = {
      host,
      keys: generateKeysResponse.payload.payload.keys,
    }

    // add this QSS server/cluster to our chain using the keys we generated earlier
    this.logger.info(`Got a valid keys response from QSS, adding it to the chain`, lfaServer)
    sigChain.server.addServer(lfaServer)

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
    if (createCommunityResponse == null || createCommunityResponse.payload.status !== CreateCommunityStatus.SUCCESS) {
      this.logger.error(
        `Failed to create a community!`,
        createCommunityResponse?.payload.reason ?? 'Response was nullish'
      )
      return false
    }

    // start the auth sync connection with QSS now that we've successfully added the community
    await this.qssAuthConnManager.startNewConnection(sigChain.team.id)
    return true
  }

  /**
   * Send a sign in message to QSS and start the auth sync connection with QSS for this community
   *
   * @param teamId ID of the team we are signing in to
   * @param sigChain Sigchain for this team
   * @param teamName Optional team name to pass in for filtering purposes
   */
  public async signInToCommunity(teamId: string, sigChain: SigChain, teamName?: string): Promise<void> {
    if (!this.enabled) {
      this.logger.info(`Can't sign in to community on QSS because QSS is not enabled for this community`)
      return
    }

    if (!this.connected) {
      this.logger.info(`Can't sign in to community on QSS because the client hasn't connected`)
      return
    }

    // send a sign in message to QSS for this community and check for a successful response
    this.logger.info(`Signing in to community`, teamId)
    const qssSignInMessage: CommunitySignInMessage = {
      ts: DateTime.utc().toMillis(),
      payload: {
        status: CommunityOperationStatus.SUCCESS,
        payload: {
          userId: (sigChain.context as MemberContext).user.userId,
          teamId,
        },
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

    if (signInResponse.payload.status !== CommunityOperationStatus.SUCCESS) {
      throw new Error(
        `Error while signing in to community ${teamId} - ${signInResponse.payload.status}: ${signInResponse.payload.reason ?? `Unknown QSS Error`}`
      )
    }

    // start the auth sync connection with QSS now that we've successfully signed in
    this.logger.trace(`Sign in request to QSS was successful, initiating LFA connection`)
    this.qssAuthConnManager.startNewConnection(teamId, teamName)
  }

  public async sendDataSyncMessage(entry: LogEntry<unknown>): Promise<void> {
    this.logger.info('Sending data sync to QSS', entry.hash)
    const encEntry: EncryptedAndSignedPayload = this.sigChainService.activeChain.crypto.encryptAndSign(entry, {
      type: EncryptionScopeType.ROLE,
      name: RoleName.MEMBER,
    })
    const dataSyncMessage: QSSDataSyncMessage = {
      ts: DateTime.utc().toMillis(),
      payload: {
        status: CommunityOperationStatus.SENDING,
        payload: {
          teamId: this.sigChainService.team.id,
          hash: entry.hash,
          hashedDbId: hash('', entry.id),
          encEntry,
        },
      },
    }
    const dataSyncAck = await this.qssClient.sendMessage<QSSDataSyncMessage>(
      WebsocketEvents.DATA_SYNC,
      dataSyncMessage,
      true
    )

    if (dataSyncAck == null) {
      this.logger.error('Error while sending a data sync to QSS', entry.hash, entry.id)
      // TODO: add dead letter queue for failed syncs
    } else if (dataSyncAck.payload.status !== CommunityOperationStatus.SUCCESS) {
      this.logger.error(`Error while sending a data sync to QSS - ${dataSyncAck.payload.reason}`, entry.hash, entry.id)
      // TODO: add dead letter queue for failed syncs
    } else {
      this.logger.info('Successful data sync to QSS')
    }
  }

  /**
   * Close all open auth sync connections and the QSS websocket connection
   */
  public close(): void {
    this.logger.info(`Closing QSS service`)
    this.qssAuthConnManager.close()
    this.qssClient.close()
  }
}
