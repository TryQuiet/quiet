import { Connection as AuthConnection } from '../../../../../3rd-party/auth/packages/auth/dist'
import {
  ConnectionParams as AuthConnectionParams,
  InviteeContext,
  MemberContext,
} from '../../../../../3rd-party/auth/packages/auth/dist/connection'
import { SigChainService } from '../auth/sigchain.service'
import { createLogger } from '../common/logger'
import { AuthSyncMessage, CommunityOperationStatus, QSSEvents, WebsocketEvents } from './qss.types'

import { DateTime } from 'luxon'
import * as uint8arrays from 'uint8arrays'
import { QSSClient } from './qss.client'
import { createWinstonQuietLogger } from '@quiet/node-common'
import { JoinStatus } from '../libp2p/libp2p.auth'
import EventEmitter from 'events'
import { RoleName } from '../auth/services/roles/roles'
import { Injectable } from '@nestjs/common'

@Injectable()
export class QSSAuthConnection extends EventEmitter {
  private authConnection: AuthConnection
  private _joinStatus: JoinStatus = JoinStatus.NOT_STARTED
  private _teamId: string | undefined = undefined

  private logger = createLogger('qss:auth:conn')
  private readonly createLfaLogger = createWinstonQuietLogger('localfirst:qss')

  constructor(
    private readonly sigChainService: SigChainService,
    private readonly qssClient: QSSClient
  ) {
    super()
  }

  public get teamId(): string | undefined {
    return this._teamId
  }

  public set teamId(newTeamId: string | undefined) {
    if (this._teamId != null) {
      throw new Error('Team ID already set!')
    }
    if (newTeamId == null) {
      throw new Error('New team ID must be non-null!')
    }
    this._teamId = newTeamId
  }

  public get joinStatus(): JoinStatus {
    return this._joinStatus
  }

  public async start(): Promise<void> {
    if (this.teamId == null) {
      throw new Error('Must set team ID prior to starting connection!')
    }

    const sigChain = this.sigChainService.getActiveChain()
    if (this.authConnection != null) {
      if (this.authConnection._started) {
        this.logger.error(`Auth connection already started with QSS for this team`, this.teamId)
        return
      }
      this.logger.warn(
        `Existing auth connection with QSS for this team was found but the connection wasn't started, startin now`,
        this.teamId
      )
    } else {
      // Create an auth connection using an ephemeral sendMessage callback.
      this.authConnection = new AuthConnection({
        context: sigChain.context,
        sendMessage: (message: Uint8Array) => {
          const socketMessage: AuthSyncMessage = {
            ts: DateTime.utc().toMillis(),
            payload: {
              status: CommunityOperationStatus.SUCCESS,
              payload: {
                userId: (sigChain.context as MemberContext).user.userId,
                teamId: this.teamId!,
                message: uint8arrays.toString(message, 'base64'),
              },
            },
          }
          this.qssClient.sendMessage(WebsocketEvents.AUTH_SYNC, socketMessage, false)
        },
        createLogger: this.createLfaLogger,
      } as AuthConnectionParams)
    }

    this.logger.info(`Starting auth connection with QSS for syncing`)

    if (sigChain.team != null && sigChain.roles.amIMemberOfRole(RoleName.MEMBER)) {
      this._joinStatus = JoinStatus.JOINED
    }

    this.qssClient.clientSocket!.on(WebsocketEvents.AUTH_SYNC, async (encryptedMessage: string): Promise<void> => {
      try {
        const decryptedMessage = this.qssClient.decryptPayload(encryptedMessage) as AuthSyncMessage
        if (decryptedMessage.payload.payload?.message == null) {
          throw new Error(`Missing message`)
        }
        this.authConnection.deliver(uint8arrays.fromString(decryptedMessage.payload.payload.message, 'base64'))
      } catch (e) {
        this.logger.error(`Error handling auth sync message`, e)
        this.authConnection.emit('localError', {
          message: 'Error handling auth sync message',
          type: 'ClientAuthSyncError',
        })
      }
    })

    // Set up auth connection event handlers.
    this.authConnection.on('connected', () => {
      if (this.sigChainService.activeChainTeamName != null) {
        this.logger.debug(`Sending sync message because our chain is initialized`)
        const sigChain = this.sigChainService.getActiveChain()
        const team = sigChain.team
        const user = sigChain.user
        this.authConnection.emit('sync', { team, user })
        this._joinStatus = JoinStatus.JOINED
      }
    })

    this.authConnection.on('disconnected', event => {
      this.logger.info(`LFA Disconnected!`, event)
    })

    this.authConnection.on('joined', async payload => {
      const { team, user } = payload
      const sigChain = this.sigChainService.getActiveChain()
      this.logger.info(`${sigChain.user.userId}: Joined team ${team.teamName} (userid: ${user.userId})!`)
      if (sigChain.team == null) {
        this.logger.info(
          `${user.userId}: Creating SigChain for user with name ${user.userName} and team name ${team.teamName}`
        )
        sigChain.context = {
          device: (sigChain.context as InviteeContext).device,
          team,
          user,
        } as MemberContext
        this.sigChainService.setActiveChain(team.teamName)
        this._joinStatus = JoinStatus.PENDING_MEMBER
      } else {
        this._joinStatus = JoinStatus.JOINED
      }
      await this.sigChainService.saveChain(team.teamName)
      this.emit(QSSEvents.QSS_AUTH_JOINED) // tell other services that we've joined via QSS
    })

    this.authConnection.on('change', payload => {
      this.logger.info(`Auth state change`, payload)
    })

    this.authConnection.on('updated', async head => {
      this.logger.info('Received sync message, team graph updated', head)
      const sigChain = this.sigChainService.getActiveChain()
      await this.sigChainService.saveChain(sigChain.team!.teamName)
    })

    // Handle errors from local or remote sources.
    this.authConnection.on('localError', error => {
      this.logger.error(`Local LFA error`, error)
    })
    this.authConnection.on('remoteError', error => {
      this.logger.error(`Remote LFA error`, error)
    })

    this.logger.info(`Auth connection established with QSS`)
    this.authConnection.start()
  }

  public stop(sendPeerDisconnect = false): void {
    if (this.authConnection == null) {
      this.logger.warn(`Auth connection not open with QSS for this team`, this.teamId)
      return
    }
    this.authConnection.stop(sendPeerDisconnect)
  }
}
