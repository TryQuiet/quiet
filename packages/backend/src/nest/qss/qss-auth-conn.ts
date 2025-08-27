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
import { SigChain } from '../auth/sigchain'

@Injectable()
export class QSSAuthConnection extends EventEmitter {
  /**
   * LFA auth sync connection instance
   */
  private _authConnection: AuthConnection | undefined = undefined
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
    this._setupEventHandlers()
  }

  private _setupEventHandlers(): void {
    this.qssClient.on(QSSEvents.QSS_DISCONNECTED, async () => {
      this.logger.warn('QSS disconnected, closing auth connection', this.teamId)
      this.stop(true)
      this._authConnection = undefined
    })
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
   * Starts this auth sync connection with QSS.  If an existing connection is present we will either bypass this operation
   * if it is active or attempt to restart.
   *
   * @param teamName Optional team name to pass in for filtering purposes
   */
  public async start(teamName?: string): Promise<void> {
    if (this.teamId == null) {
      throw new Error('Must set team ID prior to starting connection!')
    }

    // get the chain by ID and check for an existing auth connection
    let sigChain: SigChain | undefined = undefined
    try {
      sigChain = this.sigChainService.getChain({ teamId: this._teamId })
    } catch (e) {
      if (!(e as Error).message.includes('No chain found') || teamName == null) {
        throw e
      }
      sigChain = this.sigChainService.getChain({ teamName })
    }

    if (this._authConnection != null) {
      // if we have an existing auth connection for this team check if it has been started and is active, if so
      // do nothing
      if (this._authConnection._started && this._active) {
        this.logger.error(`Auth connection already started with QSS for this team`, this.teamId)
        return
      }
      // if the existing connection is inactive we should replace it
      this.logger.warn(`Replacing existing auth connection with QSS`, this.teamId)
      this._authConnection = undefined
    }

    await this._initNewConn(sigChain)

    this.logger.info(`Auth connection established with QSS`)
    this._authConnection!.start()
    this._active = true
  }

  /**
   * Starts a new auth sync connection with QSS
   *
   * @param sigChain Sigchain associated with this connection
   */
  private async _initNewConn(sigChain: SigChain): Promise<void> {
    this.logger.info('Initializing new auth connection with QSS')
    // create a new auth connection backed by the existing QSS websocket connection
    this._authConnection = new AuthConnection({
      context: sigChain.context,
      sendMessage: (message: Uint8Array) => {
        try {
          const socketMessage: AuthSyncMessage = {
            ts: DateTime.utc().toMillis(),
            status: CommunityOperationStatus.SUCCESS,
            payload: {
              userId: (sigChain!.context as MemberContext).user.userId,
              teamId: this.teamId!,
              message: uint8arrays.toString(message, 'base64'),
            },
          }
          this.qssClient.sendMessage(WebsocketEvents.AUTH_SYNC, socketMessage, false)
        } catch (e) {
          this.logger.error('Error while sending auth sync message to QSS on LFA connection', e)
          this._authConnection?.emit('localError', {
            message: 'Error sending auth sync message',
            type: 'ClientAuthSyncError',
          })
        }
      },
      createLogger: this.createLfaLogger,
    } as AuthConnectionParams)

    this.logger.info(`Starting auth connection with QSS for syncing`)

    // check if we already have a team and have the member role to determine if we've already fully joined
    if (sigChain.team != null && sigChain.roles.amIMemberOfRole(RoleName.MEMBER)) {
      this._joinStatus = JoinStatus.JOINED
    }

    // handle connected events and update the sigchain/join status
    this._authConnection.on('connected', () => {
      this._active = true
      if (this.sigChainService.activeChainTeamName != null) {
        this.logger.debug(`Sending sync message because our chain is initialized`)
        const sigChain = this.sigChainService.getActiveChain()
        const team = sigChain.team!
        const user = sigChain.user
        this._authConnection!.emit('sync', { team, user })
        this._joinStatus = JoinStatus.JOINED
      }
    })

    // set the connection to inactive when disconnecting
    this._authConnection.on('disconnected', event => {
      this.logger.info(`LFA Disconnected!`, event)
      this._active = false
    })

    // handle joined events
    this._authConnection.on('joined', async payload => {
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

    this._authConnection.on('change', payload => {
      this.logger.trace(`Auth state change`, payload)
    })

    this._authConnection.on('updated', async head => {
      this.logger.trace('Received sync message, team graph updated', head)
    })

    // Handle errors from local or remote sources.
    this._authConnection.on('localError', error => {
      this.logger.error(`Local LFA error`, error)
    })
    this._authConnection.on('remoteError', error => {
      this.logger.error(`Remote LFA error`, error)
    })
  }

  public deliver(message: Uint8Array): void {
    if (this._authConnection == null || !this.active) {
      throw new Error(`Auth connection with QSS for team ${this.teamId} needs to be initialized!`)
    }

    try {
      this._authConnection.deliver(message)
    } catch (e) {
      this.logger.error(`Error handling auth sync message`, e)
      this._authConnection?.emit('localError', {
        message: 'Error handling auth sync message',
        type: 'ClientAuthSyncError',
      })
    }
  }

  /**
   * Stop this QSS auth connection and set to inactive
   *
   * @param sendDisconnectToQSS If true send a disconnect message to QSS on closure
   */
  public stop(sendDisconnectToQSS = false): void {
    if (this._authConnection == null) {
      this.logger.warn(`Auth connection not open with QSS for this team`, this.teamId)
      return
    }
    try {
      this._authConnection.stop(sendDisconnectToQSS)
    } catch (e) {
      this.logger.error(`Error while stopping auth connection with QSS for team ID ${this.teamId}`, e)
    } finally {
      this._active = false
    }
  }
}
