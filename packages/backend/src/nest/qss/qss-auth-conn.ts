/**
 * Abstraction of LFA auth sync connection logic for QSS
 */
import { Connection as AuthConnection, Team, type User } from '../../../../../3rd-party/auth/packages/auth/dist'
import {
  ConnectionParams as AuthConnectionParams,
  InviteeContext,
  InviteeMemberContext,
  MemberContext,
} from '../../../../../3rd-party/auth/packages/auth/dist/connection'
import { SigChainService } from '../auth/sigchain.service'
import { createLogger } from '../common/logger'
import { AuthSyncMessage, CommunityOperationStatus, QSSEvents, WebsocketEvents } from './qss.types'

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
import { BoundedRetry } from '../common/boundedRetry'

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
  /** Bounded re-attempts for joins that failed on our own persistence. */
  private readonly _joinRetry = new BoundedRetry('qss:join')
  /**
   * Bounded re-attempts for the local write of an acceptance we already hold.
   * Separate budget from _joinRetry, because this one costs no network work.
   */
  private readonly _localWriteRetry = new BoundedRetry('qss:joinWrite', {
    maxAttempts: 5,
    baseDelayMs: 100,
    maxDelayMs: 2_000,
  })
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
    // create a new auth connection backed by the existing QSS websocket connection
    const authConnection = new AuthConnection({
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
          authConnection.emit('localError', {
            message: 'Error sending auth sync message',
            type: 'ClientAuthSyncError',
          })
        }
      },
      createLogger: this.createLfaLogger,
      persistAdmission: this.persistAdmission,
    } as AuthConnectionParams)

    this.logger.info(`Starting auth connection with QSS for syncing`)

    // check if we already have a team and have the member role to determine if we've already fully joined
    if (sigChain.team != null && sigChain.roles.amIMemberOfRole(RoleName.MEMBER)) {
      this._joinStatus = JoinStatus.JOINED
    }

    // Handle connected events and update the sigchain/join status
    authConnection.on(LFAEvents.CONNECTED, () => {
      this._connStatus = QSSAuthConnStatus.CONNECTED
      if (this.sigChainService.activeChainTeamId != null && this._joinStatus === JoinStatus.NOT_STARTED) {
        const sigChain = this.sigChainService.getActiveChain()
        if (sigChain.team != null && !sigChain.roles.amIMemberOfRole(RoleName.MEMBER)) {
          this._joinStatus = JoinStatus.PENDING_MEMBER
          this.logger.debug(`Restored QSS team is missing ${RoleName.MEMBER}; requesting local invite claim`)
          this.emit(QSSEvents.QSS_SELF_ASSIGN_MEMBER, this.teamId)
          this.emit(QSSEvents.QSS_AUTH_JOINED, this.teamId)
        } else if (sigChain.team != null) {
          this.logger.debug(`Sending sync message because our chain is initialized`)
          authConnection.emit('sync', { team: sigChain.team, user: sigChain.user })
          this._joinStatus = JoinStatus.JOINED
          this.emit(QSSEvents.QSS_AUTH_JOINED, this.teamId)
          this.logger.trace(`Server info`, this.sigChainService.activeChain.server.getServers())
        }
      }
      this.emit(QSSEvents.QSS_AUTH_CONNECTED, this.teamId)
    })

    // set the connection to inactive when disconnecting
    authConnection.on(LFAEvents.DISCONNECTED, event => {
      this.logger.info(`LFA Disconnected!`, event)
      this._markDisconnected()
    })

    // handle joined events
    //
    // The accepted graph has to be on disk before QSS_AUTH_JOINED goes out.
    // Downstream services treat that event as proof that we hold a usable team,
    // and QSS has already seen our acceptance; a crash between the event and the
    // write would bring us back without the graph we are relying on (QSS-006).
    // Both branches persist: the team == null branch previously wrote nothing at
    // all, so a freshly accepted graph lived only in memory until some later
    // chain mutation happened to flush it.
    authConnection.on(LFAEvents.JOINED, payload => {
      void this._handleJoined(payload).catch(error => {
        this.logger.error(`Failed to handle LFA joined event`, error)
      })
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
    })
    authConnection.on(LFAEvents.REMOTE_ERROR, error => {
      this.logger.error(`Remote LFA error`, error)
    })

    this._authConnection = authConnection
  }

  /**
   * Binds membership to its record: nobody may hold this community's keys
   * without a durable record of their admission on the device that admitted
   * them, so the ADMIT_MEMBER / ADMIT_DEVICE link must be on disk before the
   * acceptance that carries the team graph and keyring is released to the peer
   * on the other end of this connection (threat-model C3, option A). The
   * adversary is the joiner: a peer holding a valid invitation is entitled to
   * join but not to join unrecorded, and it is exactly the party that cannot
   * be relied on to report its own admission afterwards.
   *
   * @localfirst/auth calls this after the admission has been appended to the
   * in-memory team and before ACCEPT_INVITATION is queued. Rejecting fails the
   * connection with ADMISSION_NOT_PERSISTED and sends nothing, so a crash can
   * never produce a member with keys but no record (QSS-006 / private#203).
   *
   * @param team The team LFA just appended the admission to
   */
  private persistAdmission = async (team: Team): Promise<void> => {
    this.logger.info(`Persisting admission for team ${team.id} before releasing acceptance`)
    try {
      await this.sigChainService.persistChain(team.id, 'admission')
    } catch (err) {
      // Undo the admission we appended but could not store, so no later write
      // commits it and a retry produces a fresh link. This connection captured
      // the team we are discarding, so it goes too.
      this.logger.error(`Admission write failed for team ${team.id}, rolling back to the stored team`, err)
      try {
        await this.sigChainService.restoreChainToDurableState(team.id)
        this.stop(false)
      } catch (restoreError) {
        this.logger.error(`Could not restore team ${team.id}; writes for it stay blocked`, restoreError)
      }
      // Still fail the gate: the acceptance must not be released.
      throw err
    }
  }

  /**
   * Records a completed LFA join and signals it to the rest of the backend.
   *
   * The persist is awaited and failure is fail-closed: if the chain cannot be
   * written we do not emit QSS_AUTH_JOINED (or ask for a member self-assign),
   * because everything behind those events assumes the team survives a restart.
   *
   * @param payload The LFA joined payload carrying the team and user we joined as
   */
  private async _handleJoined(payload: { team: Team; user: User }): Promise<void> {
    const { team, user } = payload

    const sigChain = this.sigChainService.getActiveChain()
    this.logger.info(`${sigChain.user.userId}: Joined team ${team.id} (userid: ${user.userId})!`)
    // if we didn't have a team on the sigchain previously then it is assumed that we haven't connected to a peer yet
    // and thus don't have the member role so our joining is still pending
    const previousContext = sigChain.context
    const previousJoinStatus = this._joinStatus
    const needsMemberSelfAssign = sigChain.team == null

    // Only the context is staged before the write, because the chain cannot be
    // serialized until it carries the team. The active chain, the join status
    // and both events wait for durability.
    if (needsMemberSelfAssign) {
      this.logger.info(`${user.userId}: Creating SigChain for user with name ${user.userName} and team name ${team.id}`)
      sigChain.context = {
        device: (sigChain.context as InviteeContext).device,
        team,
        user,
      } as MemberContext
    }

    await this._commitJoin({ team, needsMemberSelfAssign, previousContext, previousJoinStatus })
  }

  /**
   * Writes the accepted team and, only once that lands, publishes the join.
   *
   * Re-entered by the local write retry. The acceptance is already validated and
   * in memory, so a write failure here is ours alone; asking QSS for another
   * acceptance would be a fresh handshake we do not need. Only when the local
   * budget is spent do we roll back and go get a new one.
   */
  private async _commitJoin(pending: {
    team: Team
    needsMemberSelfAssign: boolean
    previousContext: MemberContext | InviteeMemberContext
    previousJoinStatus: JoinStatus
  }): Promise<void> {
    const { team, needsMemberSelfAssign, previousContext, previousJoinStatus } = pending

    try {
      await this.sigChainService.persistChain(team.id)
    } catch (error) {
      // Keep the staged context while we retry: it is what the write serializes,
      // and nothing is published from it until the write succeeds.
      const scheduled = this._localWriteRetry.schedule(team.id, async () => this._commitJoin(pending))
      if (scheduled) {
        this.logger.error(`Failed to persist team after QSS auth join, retrying the write`, team.id, error)
        return
      }

      // Roll all of it back. Leaving the staged context and a PENDING_MEMBER or
      // JOINED status behind would look like a completed join to every later
      // guard while nothing had been stored, and this connection is not
      // re-initialized on its own (private#203 L-2).
      this.logger.error(
        `Giving up on writing the joined team locally, rolling back and asking for a new acceptance`,
        team.id,
        error
      )
      if (needsMemberSelfAssign) {
        this.sigChainService.getActiveChain().context = previousContext
      }
      this._joinStatus = previousJoinStatus
      this._scheduleJoinRetry()
      return
    }

    this._localWriteRetry.clear(team.id)
    if (needsMemberSelfAssign) {
      this.sigChainService.setActiveChain(team.id)
      this._joinStatus = JoinStatus.PENDING_MEMBER
    } else {
      this._joinStatus = JoinStatus.JOINED
    }
    this._joinRetry.clear(team.id)

    if (needsMemberSelfAssign) {
      this.logger.debug(`Emitting ${QSSEvents.QSS_SELF_ASSIGN_MEMBER} event`)
      this.emit(QSSEvents.QSS_SELF_ASSIGN_MEMBER, this.teamId)
    }
    this.emit(QSSEvents.QSS_AUTH_JOINED, this.teamId) // tell other services that we've joined via QSS
  }

  /**
   * Re-attempts a QSS join that failed on our own persistence, with backoff.
   *
   * The current LFA connection is dropped first: it has already delivered its
   * joined event and will not deliver another, so a retry has to run a fresh
   * handshake.
   */
  private _scheduleJoinRetry(): void {
    const teamId = this.teamId!
    this.stop(false)
    const scheduled = this._joinRetry.schedule(teamId, async () => {
      this.logger.info(`Retrying the QSS auth join for team ${teamId} after a failed admission write`)
      await this.start()
    })
    if (!scheduled) {
      this.logger.error(
        `Giving up on the QSS auth join for team ${teamId}: the chain could not be persisted after repeated attempts`
      )
    }
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
    // Cancel a queued retry without resetting its budget: _scheduleJoinRetry
    // stops the connection before re-arming, so clearing budgets here would
    // make the bound unreachable.
    this._joinRetry.cancelPending()
    this._localWriteRetry.cancelPending()

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
