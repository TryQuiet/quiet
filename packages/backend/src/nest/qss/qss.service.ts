import { Server, Connection as AuthConnection } from '../../../../../3rd-party/auth/packages/auth/dist'
import {
  ConnectionParams as AuthConnectionParams,
  InviteeContext,
  MemberContext,
} from '../../../../../3rd-party/auth/packages/auth/dist/connection'
import { Inject, Injectable } from '@nestjs/common'
import { Community } from '@quiet/types'
import { SigChain } from '../auth/sigchain'
import { createLogger } from '../common/logger'
import { QSS_ENABLED, QSS_ENDPOINT } from '../const'
import { QSSClient } from './qss.client'
import * as uint8arrays from 'uint8arrays'
import {
  AuthSyncMessage,
  CommunityOperationStatus,
  CommunitySignInMessage,
  CreateCommunity,
  CreateCommunityResponse,
  CreateCommunityStatus,
  GeneratePublicKeysMessage,
  GeneratePublicKeysResponse,
  QSSEvents,
  WebsocketEvents,
} from './qss.types'
import { DateTime } from 'luxon'
import * as url from 'node:url'
import { SigChainService } from '../auth/sigchain.service'
import { createWinstonQuietLogger } from '@quiet/node-common'
import EventEmitter from 'node:events'

@Injectable()
export class QSSService extends EventEmitter {
  private readonly logger = createLogger(`qss:service`)
  private readonly createLfaLogger = createWinstonQuietLogger('localfirst')

  constructor(
    @Inject(QSS_ENABLED) private readonly qssEnabled: boolean,
    @Inject(QSS_ENDPOINT) private readonly qssEndpoint: string,
    private readonly qssClient: QSSClient,
    private readonly sigChainService: SigChainService
  ) {
    super({ captureRejections: true })
  }

  public async connect(): Promise<boolean> {
    if (!this.qssEnabled) {
      this.logger.trace(`Can't connect to QSS because QSS is not initialized`)
      return false
    }

    try {
      this.logger.info(`Establishing connection with QSS`)
      await this.qssClient.createSocket()
      this.logger.info(`Connection established`)
      return true
    } catch (e) {
      this.logger.error(`Error while connecting to QSS`, e)
      return false
    }
  }

  public async createCommunity(community: Community, sigChain: SigChain): Promise<boolean> {
    if (!this._qssInitialized()) {
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

    const lfaServer: Server = {
      host: url.parse(this.qssEndpoint).hostname!,
      keys: generateKeysResponse.payload.payload.keys,
    }

    this.logger.info(`Got a valid keys response from QSS, adding it to the chain`)
    sigChain.server.addServer(lfaServer)

    const serializedSigChain: Uint8Array = sigChain.save()
    const serializedKeyring: Uint8Array = uint8arrays.fromString(JSON.stringify(sigChain.team.teamKeyring()), 'utf8')

    const qssCreateCommunityMessage: CreateCommunity = {
      ts: DateTime.utc().toMillis(),
      payload: {
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

    this.startAuthConnection(sigChain.team.id, sigChain)
    return true
  }

  public async signInToCommunity(teamId: string, sigChain: SigChain): Promise<void> {
    if (!this._qssInitialized()) {
      this.logger.trace(`Can't sign in to community on QSS because QSS is not initialized`)
      return
    }

    this.logger.info(`Signing in to community`, teamId)
    const qssSignInMessage: CommunitySignInMessage = {
      ts: DateTime.utc().toMillis(),
      payload: {
        status: CommunityOperationStatus.SUCCESS,
        payload: {
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
    await this.startAuthConnection(teamId, sigChain)
  }

  private async startAuthConnection(teamId: string, sigChain: SigChain): Promise<void> {
    if (!this.qssEnabled) {
      this.logger.warn(`Can't initiate auth connection with QSS because QSS is not enabled`)
      return
    }

    if (!this._qssInitialized()) {
      this.logger.warn(`Can't initiate auth connection with QSS because QSS has not been initialized`)
      return
    }

    this.logger.info(`Starting auth connection with QSS for syncing`)

    // Create an auth connection using an ephemeral sendMessage callback.
    const authConnection = new AuthConnection({
      context: sigChain.context,
      sendMessage: (message: Uint8Array) => {
        const socketMessage: AuthSyncMessage = {
          ts: DateTime.utc().toMillis(),
          payload: {
            status: CommunityOperationStatus.SUCCESS,
            payload: {
              teamId,
              message: uint8arrays.toString(message, 'base64'),
            },
          },
        }
        this.qssClient.sendMessage(WebsocketEvents.AUTH_SYNC, socketMessage, false)
      },
      createLogger: this.createLfaLogger,
    } as AuthConnectionParams)

    this.qssClient.clientSocket!.on(WebsocketEvents.AUTH_SYNC, async (encryptedMessage: string): Promise<void> => {
      try {
        const decryptedMessage = this.qssClient.decryptPayload(encryptedMessage) as AuthSyncMessage
        if (decryptedMessage.payload.payload?.message == null) {
          throw new Error(`Missing message`)
        }
        authConnection.deliver(uint8arrays.fromString(decryptedMessage.payload.payload.message, 'base64'))
      } catch (e) {
        this.logger.error(`Error handling auth sync message`, e)
        authConnection.emit('localError', {
          message: 'Error handling auth sync message',
          type: 'ClientAuthSyncError',
        })
      }
    })

    // Set up auth connection event handlers.
    authConnection.on('connected', () => {
      if (this.sigChainService.activeChainTeamName != null) {
        this.logger.debug(`Sending sync message because our chain is initialized`)
        const sigChain = this.sigChainService.getActiveChain()
        const team = sigChain.team
        const user = sigChain.localUserContext.user
        authConnection.emit('sync', { team, user })
      }
    })

    authConnection.on('disconnected', event => {
      this.logger.info(`LFA Disconnected!`, event)
    })

    authConnection.on('joined', async payload => {
      const { team, user } = payload
      const sigChain = this.sigChainService.getActiveChain()
      this.logger.info(
        `${sigChain.localUserContext.user.userId}: Joined team ${team.teamName} (userid: ${user.userId})!`
      )
      if (sigChain.team == null) {
        this.logger.info(
          `${user.userId}: Creating SigChain for user with name ${user.userName} and team name ${team.teamName}`
        )
        sigChain.context = {
          device: (sigChain.context as InviteeContext).device,
          team,
          user,
        } as MemberContext
        sigChain.team = team
      }
      await this.sigChainService.saveChain(team.teamName)
      this.emit(QSSEvents.QSS_AUTH_JOINED) // tell other services that we've joined via QSS
    })

    authConnection.on('change', payload => {
      this.logger.info(`Auth state change`, payload)
    })

    authConnection.on('updated', async head => {
      this.logger.info('Received sync message, team graph updated', head)
      const sigChain = this.sigChainService.getActiveChain()
      await this.sigChainService.saveChain(sigChain.team!.teamName)
    })

    // Handle errors from local or remote sources.
    authConnection.on('localError', error => {
      this.logger.error(`Local LFA error`, error)
    })
    authConnection.on('remoteError', error => {
      this.logger.error(`Remote LFA error`, error)
    })

    this.logger.info(`Auth connection established with QSS`)
    authConnection.start()
  }

  private _qssInitialized(): boolean {
    if (!this.qssEnabled || this.qssEndpoint == null) {
      this.logger.trace(`QSS is not enabled!`)
      return false
    }

    return !!this.qssClient.clientSocket?.connected
  }
}
