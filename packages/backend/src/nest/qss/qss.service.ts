import { Server } from '../../../../../3rd-party/auth/packages/auth/dist'
import { MemberContext } from '../../../../../3rd-party/auth/packages/auth/dist/connection'
import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
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

@Injectable()
export class QSSService extends EventEmitter implements OnModuleInit {
  private _connecting = false

  private readonly logger = createLogger(`qss:service`)

  constructor(
    @Inject(QSS_ENABLED) private qssEnabled: boolean,
    @Inject(QSS_ENDPOINT) public qssEndpoint: string,
    private readonly qssClient: QSSClient,
    private readonly qssAuthConnManager: QSSAuthConnectionManager
  ) {
    super({ captureRejections: true })
  }

  public async onModuleInit() {
    this.logger.trace('Attempting to connect to QSS')
    await this.connect(this.qssEnabled, this.qssEndpoint)
  }

  public get connected(): boolean {
    return this.enabled && !!this.qssClient.clientSocket?.connected
  }

  public get enabled(): boolean {
    return this.qssEnabled && this.qssEndpoint !== '' && this.qssEndpoint != null
  }

  public joinStatus(teamId: string): JoinStatus {
    const authConnection = this.qssAuthConnManager.getConnection(teamId)
    return authConnection?.joinStatus ?? JoinStatus.NOT_STARTED
  }

  public async connect(qssEnabled: boolean, qssEndpoint: string | undefined): Promise<boolean> {
    if (this._connecting) {
      this.logger.trace('Already connecting to QSS, waiting for results of previous connection attempt')
      const waitTime = DateTime.utc().toMillis() + 15_000
      while (!this.connected && DateTime.utc().toMillis() < waitTime) {
        await sleep(500)
      }
    }

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

  public async createCommunity(community: Community, sigChain: SigChain): Promise<boolean> {
    if (!this.enabled) {
      this.logger.trace(`Can't create community on QSS because QSS is not initialized`)
      return false
    }

    if (sigChain.team == null) {
      throw new Error(`Team on this sigchain is nullish!`)
    }

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

    let host = url.parse(this.qssEndpoint).hostname!
    if (host === '127.0.0.1') {
      host = 'localhost'
    }

    const lfaServer: Server = {
      host,
      keys: generateKeysResponse.payload.payload.keys,
    }

    this.logger.info(`Got a valid keys response from QSS, adding it to the chain`, lfaServer)
    sigChain.server.addServer(lfaServer)

    const serializedSigChain: Uint8Array = sigChain.save()
    const serializedKeyring: Uint8Array = uint8arrays.fromString(JSON.stringify(sigChain.team.teamKeyring()), 'utf8')

    const qssCreateCommunityMessage: CreateCommunity = {
      ts: DateTime.utc().toMillis(),
      payload: {
        userId: (sigChain.context as MemberContext).user.userId,
        community: {
          teamId: sigChain.team.id,
          psk: community.psk!,
          name: community.name!,
          peerList: community.peerList ?? [],
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

    if (createCommunityResponse == null || createCommunityResponse.payload.status !== CreateCommunityStatus.SUCCESS) {
      this.logger.error(
        `Failed to create a community!`,
        createCommunityResponse?.payload.reason ?? 'Response was nullish'
      )
      return false
    }

    await this.qssAuthConnManager.startNewConnection(sigChain.team.id)
    return true
  }

  public async signInToCommunity(teamId: string, sigChain: SigChain): Promise<void> {
    if (!this.enabled) {
      this.logger.trace(`Can't sign in to community on QSS because QSS is not enabled for this community`)
      return
    }

    if (!this.connected) {
      this.logger.trace(`Can't sign in to community on QSS because the client hasn't connected`)
      return
    }

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

    this.logger.trace(`Sign in request to QSS was successful, initiating LFA connection`)
    this.qssAuthConnManager.startNewConnection(teamId)
  }

  public close(): void {
    this.logger.info(`Closing QSS service`)
    this.qssAuthConnManager.close()
    this.qssClient.close()
  }
}
