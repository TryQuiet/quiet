/**
 * Abstraction of LFA auth sync connection logic for QSS
 */
import { Connection as AuthConnection } from '../../../../../3rd-party/auth/packages/auth/dist'
import { ConnectionParams as AuthConnectionParams } from '../../../../../3rd-party/auth/packages/auth/dist/connection'
import { SigChainService } from '../auth/sigchain.service'
import { createLogger } from '../common/logger'
import {
  AuthSyncMessage,
  CommunityOperationStatus,
  QSSAuthAttemptFailurePayload,
  QSSAuthFailureSource,
  QSSEvents,
  WebsocketEvents,
} from './qss.types'

import { DateTime } from 'luxon'
import * as uint8arrays from 'uint8arrays'
import { type Socket as ClientSocket } from 'socket.io-client'
import { QSSClient } from './qss.client'
import { createWinstonQuietLogger } from '@quiet/node-common'
import { JoinStatus } from '../libp2p/libp2p.auth'
import EventEmitter from 'events'
import { RoleName } from '../auth/services/roles/roles'
import { Injectable } from '@nestjs/common'
import { randomUUID } from 'crypto'
import { SigChain } from '../auth/sigchain'
import { QSSAuthConnStatus } from './qss.const'
import { LFAEvents } from '../auth/types'

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
   * Status of LFA connection
   *
   *  NOT_STARTED = Connection has been created but hasn't been started
   *  STARTING = Connection is in use but hasn't finished identity handshake
   *  ACTIVE = Connection is in use and the identity handshake was successful
   *  INACTIVE = Connection was stopped/disconnected
   */
  private _connStatus: QSSAuthConnStatus = QSSAuthConnStatus.NOT_STARTED
  /**
   * QSS websocket this auth sync connection was created against.
   */
  private _clientSocket: ClientSocket | undefined = undefined
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

  private _onQssDisconnected = (): void => {
    this.logger.warn('QSS disconnected, closing auth connection', this.teamId)
    this.stop(false)
  }

  private _normalizeAuthError(error: unknown): Error {
    return error instanceof Error
      ? error
      : new Error(
          typeof error === 'object' &&
            error != null &&
            'message' in error &&
            typeof (error as { message?: unknown }).message === 'string'
            ? (error as { message: string }).message
            : 'QSS authentication failed'
        )
  }

  private _authErrorCode(error: unknown): string {
    return typeof error === 'object' &&
      error != null &&
      'type' in error &&
      typeof (error as { type?: unknown }).type === 'string'
      ? (error as { type: string }).type
      : 'UNKNOWN_AUTH_ERROR'
  }

  private _emitAuthAttemptFailure(
    error: unknown,
    source: QSSAuthFailureSource,
    deviceAdmission: boolean,
    code = this._authErrorCode(error)
  ): void {
    const payload: QSSAuthAttemptFailurePayload = {
      teamId: this.teamId!,
      code,
      error: this._normalizeAuthError(error),
      source,
      deviceAdmission,
    }
    this.emit(QSSEvents.QSS_AUTH_ATTEMPT_FAILED, payload)
  }

  private _setupEventHandlers(): void {
    this.qssClient.off(QSSEvents.QSS_DISCONNECTED, this._onQssDisconnected)
    this.qssClient.on(QSSEvents.QSS_DISCONNECTED, this._onQssDisconnected)
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

  public markMemberRoleReady(): void {
    if (this._joinStatus !== JoinStatus.PENDING_MEMBER) {
      return
    }

    this.logger.debug(`QSS member role is ready, marking auth join complete`, this.teamId)
    this._joinStatus = JoinStatus.JOINED
  }

  public get connStatus(): QSSAuthConnStatus {
    return this._connStatus
  }

  /**
   * This is true when the connection is starting up or has successfully completed the identity handshake
   * and is actively syncing sigchain updates with QSS
   */
  public get active(): boolean {
    return [QSSAuthConnStatus.STARTING, QSSAuthConnStatus.CONNECTED].includes(this.connStatus)
  }

  public get id(): string {
    return this._id
  }

  public isForClientSocket(socket: ClientSocket | undefined): boolean {
    return this._clientSocket != null && socket != null && this._clientSocket === socket
  }

  private _markDisconnected(): void {
    const shouldEmit = [QSSAuthConnStatus.STARTING, QSSAuthConnStatus.CONNECTED].includes(this._connStatus)
    this._connStatus = QSSAuthConnStatus.INACTIVE
    if (shouldEmit) {
      this.emit(QSSEvents.QSS_DISCONNECTED, this.teamId)
    }
  }

  public emit(event: string | symbol, ...args: any[]): boolean {
    this.logger.debug(`Emitting event: ${event.toString()}`, args)
    return super.emit(event, ...args)
  }

  /**
   * Starts this auth sync connection with QSS.  If an existing connection is present we will either bypass this operation
   * if it is active or attempt to restart.
   */
  public async start(): Promise<void> {
    if (this.teamId == null) {
      throw new Error('Must set team ID prior to starting connection!')
    }

    const clientSocket = this.qssClient.getClientSocket()
    if (clientSocket == null || !clientSocket.connected || !clientSocket.active) {
      throw new Error('Must have an active QSS client socket prior to starting an auth connection!')
    }
    this._setupEventHandlers()

    // get the chain by ID and check for an existing auth connection
    let sigChain: SigChain | undefined = undefined
    try {
      sigChain = this.sigChainService.getChain(this.teamId)
    } catch (e) {
      this.logger.error('No chain found', e)
      throw e
    }

    if (this._authConnection != null) {
      // if we have an existing auth connection for this team check if it has been started and is active, if so
      // do nothing
      if (this._authConnection._started && this.active) {
        this.logger.error(`Auth connection already started with QSS for this team`, this.teamId)
        return
      }
      // if the existing connection is inactive we should replace it
      this.logger.warn(`Replacing existing auth connection with QSS`, this.teamId)
      this._authConnection = undefined
    }

    this._clientSocket = clientSocket
    this.logger.info(`Auth connection established with QSS`)
    this._connStatus = QSSAuthConnStatus.STARTING
    await this._initNewConn(sigChain)
    this._authConnection!.start()
  }

  /**
   * Starts a new auth sync connection with QSS
   *
   * @param sigChain Sigchain associated with this connection
   */
  private async _initNewConn(sigChain: SigChain): Promise<void> {
    this.logger.info('Initializing new auth connection with QSS')
    const startedAsPendingDeviceAdmission = sigChain.isPendingDeviceAdmission
    let authAttemptSettled = false
    const emitAttemptFailure = (
      error: unknown,
      source: QSSAuthFailureSource,
      code = this._authErrorCode(error)
    ): void => {
      if (authAttemptSettled) return
      authAttemptSettled = true
      this._emitAuthAttemptFailure(error, source, startedAsPendingDeviceAdmission, code)
    }
    // create a new auth connection backed by the existing QSS websocket connection
    const authConnection = new AuthConnection({
      context: sigChain.context,
      sendMessage: (message: Uint8Array) => {
        try {
          const socketMessage: AuthSyncMessage = {
            ts: DateTime.utc().toMillis(),
            status: CommunityOperationStatus.SUCCESS,
            payload: {
              userId: sigChain.userId,
              deviceId: sigChain.device.deviceId,
              teamId: this.teamId!,
              message: uint8arrays.toString(message, 'base64'),
            },
          }
          this.qssClient.sendMessage(WebsocketEvents.AUTH_SYNC, socketMessage, false)
        } catch (e) {
          this.logger.error('Error while sending auth sync message to QSS on LFA connection', e)
          authConnection.emit('localError', {
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

    // Handle connected events and update the sigchain/join status
    authConnection.on(LFAEvents.CONNECTED, () => {
      this._connStatus = QSSAuthConnStatus.CONNECTED
      if (this.sigChainService.activeChainTeamId != null && this._joinStatus !== JoinStatus.JOINED) {
        this.logger.debug(`Sending sync message because our chain is initialized`)
        const sigChain = this.sigChainService.getActiveChain()
        const team = sigChain.team!
        const user = sigChain.user
        authConnection.emit('sync', { team, user })
        this._joinStatus = JoinStatus.JOINED
        authAttemptSettled = true
        this.emit(QSSEvents.QSS_AUTH_JOINED, this.teamId)
        this.logger.trace(`Server info`, this.sigChainService.activeChain.server.getServers())
      }
      this.emit(QSSEvents.QSS_AUTH_CONNECTED, this.teamId)
    })

    // set the connection to inactive when disconnecting
    authConnection.on(LFAEvents.DISCONNECTED, event => {
      this.logger.info(`LFA Disconnected!`, event)
      this._markDisconnected()
    })

    // handle joined events
    authConnection.on(LFAEvents.JOINED, payload => {
      const { team, user } = payload

      const sigChain = this.sigChainService.getActiveChain()
      const wasPendingDeviceAdmission = sigChain.isPendingDeviceAdmission
      this.logger.info(`${sigChain.userId}: Joined team ${team.id} (userid: ${user.userId})!`)
      // Complete invitation contexts from the QSS-delivered team graph. New users still need to self-assign the
      // member role, while a linked device inherits its existing user's membership immediately.
      if (sigChain.team == null) {
        try {
          sigChain.completeInvitation(team, user)
        } catch (error) {
          this._joinStatus = JoinStatus.PENDING
          this.logger.error('Rejected QSS invitation admission', error)
          emitAttemptFailure(error, 'client-validation', 'CLIENT_ADMISSION_VALIDATION_FAILED')
          this.stop(true)
          return
        }

        this.logger.info(`${user.userId}: Created SigChain for user with name ${user.userName} and team ${team.id}`)
        this.sigChainService.setActiveChain(sigChain.teamId!)

        if (wasPendingDeviceAdmission) {
          this._joinStatus = JoinStatus.JOINED
        } else {
          this._joinStatus = JoinStatus.PENDING_MEMBER
          this.logger.debug(`Emitting ${QSSEvents.QSS_SELF_ASSIGN_MEMBER} event`)
          this.emit(QSSEvents.QSS_SELF_ASSIGN_MEMBER, this.teamId)
        }
      } else {
        this._joinStatus = JoinStatus.JOINED
      }
      authAttemptSettled = true
      this.emit(QSSEvents.QSS_AUTH_JOINED, this.teamId) // tell other services that we've joined via QSS
    })

    authConnection.on(LFAEvents.CHANGE, payload => {
      this.logger.trace(`Auth state change`, payload)
    })

    authConnection.on(LFAEvents.UPDATED, head => {
      this.logger.trace('Received sync message, team graph updated', head)
    })

    // Handle errors from local or remote sources.
    authConnection.on(LFAEvents.LOCAL_ERROR, error => {
      this.logger.error(`Local LFA error`, error)
      emitAttemptFailure(error, 'local')
    })
    authConnection.on(LFAEvents.REMOTE_ERROR, error => {
      this.logger.error(`Remote LFA error`, error)
      emitAttemptFailure(error, 'remote')
    })

    this._authConnection = authConnection
  }

  public deliver(message: Uint8Array): void {
    if (this._authConnection == null) {
      throw new Error(`Auth connection with QSS for team ${this.teamId} needs to be initialized!`)
    }

    try {
      this._authConnection.deliver(message)
    } catch (e) {
      this.logger.error(`Error handling auth sync message`, e)
      this._authConnection.emit('localError', {
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
    this.qssClient.off(QSSEvents.QSS_DISCONNECTED, this._onQssDisconnected)

    if (this._authConnection == null) {
      this.logger.warn(`Auth connection not open with QSS for this team`, this.teamId)
      this._clientSocket = undefined
      this._markDisconnected()
      return
    }

    try {
      this._authConnection.stop(sendDisconnectToQSS)
    } catch (e) {
      this.logger.error(`Error while stopping auth connection with QSS for team ID ${this.teamId}`, e)
    } finally {
      this._authConnection = undefined
      this._clientSocket = undefined
      this._markDisconnected()
    }
  }
}
