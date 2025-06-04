/**
 * Abstraction of LFA auth sync connection logic for QSS
 */
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
import { randomUUID } from 'crypto'

@Injectable()
export class QSSAuthConnection extends EventEmitter {
  /**
   * LFA auth sync connection instance
   */
  private authConnection: AuthConnection
  /**
   * Status of joining via QSS
   */
  private _joinStatus: JoinStatus = JoinStatus.NOT_STARTED
  /**
   * ID of the team this connection is associated with
   */
  private _teamId: string | undefined = undefined
  /**
   * True when connected and operational
   */
  private _active: boolean = false
  /**
   * Random ID for this connection
   */
  private _id: string

  private logger = createLogger('qss:auth:conn')
  private readonly createLfaLogger = createWinstonQuietLogger('localfirst:qss')

  constructor(
    private readonly sigChainService: SigChainService,
    private readonly qssClient: QSSClient
  ) {
    super()
    this._id = randomUUID()
  }

  public get teamId(): string | undefined {
    return this._teamId
  }

  /**
   * Set the team ID if not yet set
   *
   * NOTE: This is necessary because we generate the QSSAuthConnection instances via the Nest app
   * and can't inject on generation.
   */
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

  public get active(): boolean {
    return this._active
  }

  public get id(): string {
    return this._id
  }

  /**
   * Starts this auth sync connection with QSS
   */
  public async start(): Promise<void> {
    if (this.teamId == null) {
      throw new Error('Must set team ID prior to starting connection!')
    }

    // get the chain by ID and check for an existing auth connection
    const sigChain = this.sigChainService.getChain({ teamId: this._teamId })
    if (this.authConnection != null) {
      // if we have an existing auth connection for this team check if it has been started and is active, if so
      // do nothing
      if (this.authConnection._started && this._active) {
        this.logger.error(`Auth connection already started with QSS for this team`, this.teamId)
        return
      }
      // if the existing connection is inactive just start it later in this method
      this.logger.warn(
        `Existing auth connection with QSS for this team was found but the connection wasn't started, startin now`,
        this.teamId
      )
    } else {
      // create a new auth connection backed by the existing QSS websocket connection
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

    // check if we already have a team and have the member role to determine if we've already fully joined
    if (sigChain.team != null && sigChain.roles.amIMemberOfRole(RoleName.MEMBER)) {
      this._joinStatus = JoinStatus.JOINED
    }

    // pass auth sync messages received on the websocket to the auth connection
    this.qssClient.clientSocket!.on(WebsocketEvents.AUTH_SYNC, async (message: AuthSyncMessage): Promise<void> => {
      try {
        if (message.payload.payload?.message == null) {
          throw new Error(`Missing message`)
        }
        this.authConnection.deliver(uint8arrays.fromString(message.payload.payload.message, 'base64'))
      } catch (e) {
        this.logger.error(`Error handling auth sync message`, e)
        this.authConnection.emit('localError', {
          message: 'Error handling auth sync message',
          type: 'ClientAuthSyncError',
        })
      }
    })

    // handle connected events and update the sigchain/join status
    this.authConnection.on('connected', () => {
      this._active = true
      if (this.sigChainService.activeChainTeamName != null) {
        this.logger.debug(`Sending sync message because our chain is initialized`)
        const sigChain = this.sigChainService.getActiveChain()
        const team = sigChain.team
        const user = sigChain.user
        this.authConnection.emit('sync', { team, user })
        this._joinStatus = JoinStatus.JOINED
      }
    })

    // set the connection to inactive when disconnecting
    this.authConnection.on('disconnected', event => {
      this.logger.info(`LFA Disconnected!`, event)
      this._active = false
    })

    // handle joined events
    this.authConnection.on('joined', async payload => {
      const { team, user } = payload
      const sigChain = this.sigChainService.getActiveChain()
      this.logger.info(`${sigChain.user.userId}: Joined team ${team.teamName} (userid: ${user.userId})!`)
      // if we didn't have a team on the sigchain previously then it is assumed that we haven't connected to a peer yet
      // and thus don't have the member role so our joining is still pending
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
      this.logger.trace(`Auth state change`, payload)
    })

    this.authConnection.on('updated', async head => {
      this.logger.trace('Received sync message, team graph updated', head)
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
    this._active = true
  }

  /**
   * Stop this QSS auth connection and set to inactive
   *
   * @param sendDisconnectToQSS If true send a disconnect message to QSS on closure
   */
  public stop(sendDisconnectToQSS = false): void {
    if (this.authConnection == null) {
      this.logger.warn(`Auth connection not open with QSS for this team`, this.teamId)
      return
    }
    try {
      this.authConnection.stop(sendDisconnectToQSS)
    } catch (e) {
      this.logger.error(`Error while stopping auth connection with QSS for team ID ${this.teamId}`, e)
    } finally {
      this._active = false
    }
  }
}
