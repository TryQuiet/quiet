import {
  ComponentLogger,
  Connection,
  PeerId,
  PeerStore,
  serviceCapabilities,
  Stream,
  Topology,
} from '@libp2p/interface'
import type { ConnectionManager, IncomingStreamData, Registrar } from '@libp2p/interface-internal'
import * as Auth from '../../../../../3rd-party/auth/packages/auth/dist'
import { pipe } from 'it-pipe'
import { encode, decode } from 'it-length-prefixed'

import { SigChainService } from '../auth/sigchain.service'
import { createLogger } from '../common/logger'
import { ConnectionParams } from '../../../../../3rd-party/auth/packages/auth/dist/connection'
import { Libp2pService } from './libp2p.service'
import { Libp2pEvents } from './libp2p.types'
import { abortableAsyncIterable } from '../common/utils'
import { QuietLogger } from '@quiet/logger'
import { createWinstonQuietLogger } from '@quiet/node-common'
import { RoleName } from '../auth/services/roles/roles'
import { QSSService } from '../qss/qss.service'
import { QSSEvents } from '../qss/qss.types'
import { Member } from '../../../../../3rd-party/auth/packages/auth/dist'
import { LFAEvents } from '../auth/types'
import { grantMissingMemberRoleFromConnectedPeer } from './memberRoleGrant'
import { BoundedRetry } from '../common/boundedRetry'

export interface Libp2pAuthComponents {
  peerId: PeerId
  peerStore: PeerStore
  registrar: Registrar
  connectionManager: ConnectionManager
  logger: ComponentLogger
}

export interface Libp2pAuthStatus {
  started: boolean
  joining: boolean
}

/** Everything commitJoin needs to finish, or roll back, a received acceptance. */
type PendingJoin = {
  teamId: string
  userId: string
  peerId: PeerId
  connection: Connection
  joiningNow: boolean
  stagedContext: boolean
  previousContext: Auth.MemberContext | Auth.InviteeMemberContext
  previousJoinStatus: JoinStatus
}

export enum JoinStatus {
  PENDING_MEMBER = 'PENDING_MEMBER',
  PENDING = 'PENDING',
  JOINING = 'JOINING',
  JOINED = 'JOINED',
  NOT_STARTED = 'NOT_STARTED',
}

const createLFALogger = createWinstonQuietLogger('localfirst')

export class Libp2pAuth {
  private readonly protocol: string
  private readonly components: Libp2pAuthComponents
  private registrarId: string
  private sigChainService: SigChainService
  private libp2pService: Libp2pService
  private qssService: QSSService
  private authConnections: Map<string, Auth.Connection>
  private peerConnections: Map<string, Connection>
  private bufferedConnections: { peerId: PeerId; connection: Connection }[]
  private unblockInterval: NodeJS.Timeout
  private joinStatus: JoinStatus
  private logger: QuietLogger = createLogger('libp2p:auth')
  private readonly createLfaLogger = createWinstonQuietLogger('localfirst:libp2p')
  /** Bounded re-attempts for joins that failed on our own persistence. */
  private readonly joinRetry = new BoundedRetry('libp2p:join')
  /**
   * Bounded re-attempts for the local write of an acceptance we already hold.
   * Separate budget from joinRetry, because this one costs no network work.
   */
  private readonly localWriteRetry = new BoundedRetry('libp2p:joinWrite', {
    maxAttempts: 5,
    baseDelayMs: 100,
    maxDelayMs: 2_000,
  })
  /** Re-entrancy guard for handleJoinViaQSS, which no longer uses joinStatus. */
  private joinViaQssInFlight = false
  readonly [serviceCapabilities]: string[] = ['@quiet/auth']
  readonly [Symbol.toStringTag]: string = 'lfaAuth'

  constructor(
    sigChainService: SigChainService,
    qssService: QSSService,
    libp2pService: Libp2pService,
    components: Libp2pAuthComponents
  ) {
    this.protocol = '/local-first-auth/1.0.0'
    this.components = components
    this.sigChainService = sigChainService
    this.libp2pService = libp2pService
    this.qssService = qssService
    this.authConnections = new Map()
    this.peerConnections = new Map()
    this.bufferedConnections = []

    if (sigChainService.activeChainTeamId == null) {
      this.logger.warn('No active chain found')
      this.joinStatus = JoinStatus.NOT_STARTED
    } else {
      this.logger = this.logger.extend(sigChainService.getActiveChain().username)
      const activeChain = sigChainService.getActiveChain()!
      if (activeChain.team == null) {
        this.joinStatus = JoinStatus.PENDING
      } else if (!activeChain.roles.amIMemberOfRole(RoleName.MEMBER)) {
        this.joinStatus = JoinStatus.PENDING_MEMBER
      } else {
        this.joinStatus = JoinStatus.JOINED
      }
    }

    this.qssService.once(QSSEvents.QSS_AUTH_JOINED, async () => {
      if (this.joinStatus !== JoinStatus.JOINED) {
        this.joinStatus = JoinStatus.PENDING_MEMBER
      }
    })

    this.logger.info('Auth service initialized')
    this.logger.info('sigChainService', sigChainService.activeChainTeamId)

    // Set up a periodic check to process buffered connections
    this.unblockConnections = this.unblockConnections.bind(this)
    this.unblockInterval = setInterval(this.unblockConnections, 5_000, this.bufferedConnections)
  }

  private emit(eventName: string, ...args: any[]) {
    this.libp2pService.emit(eventName, ...args)
  }

  // Process any connections that were buffered because we were waiting for a chain
  private async unblockConnections(conns: { peerId: PeerId; connection: Connection }[]) {
    if (this.joinStatus === JoinStatus.NOT_STARTED && this.sigChainService.activeChainTeamId != null) {
      this.logger.info(`Unblocking ${conns.length} connections now that we have an active chain`)
      this.joinStatus = this.sigChainService.getActiveChain()!.team != null ? JoinStatus.JOINED : JoinStatus.PENDING
    }

    const activeChain = this.sigChainService.getActiveChain(false)
    this.logger.trace(
      'Join status (libp2p, qss)',
      this.joinStatus,
      activeChain != null && activeChain.team != null ? this.qssService.joinStatus(activeChain.team.id) : null
    )
    if (
      conns.length === 0 ||
      (this.joinStatus !== JoinStatus.JOINED && this.joinStatus !== JoinStatus.PENDING_MEMBER)
    ) {
      return
    }

    this.logger.info(`Unblocking ${conns.length} buffered connections now that we've joined the chain`)
    while (conns.length > 0) {
      const conn = conns.pop()
      if (conn != null) {
        await this.onPeerConnected(conn.peerId, conn.connection)
      }
    }
  }

  async start() {
    this.logger.info('Auth service starting')

    this.onPeerConnected = this.onPeerConnected.bind(this)
    this.onPeerDisconnected = this.onPeerDisconnected.bind(this)
    this.onIncomingStream = this.onIncomingStream.bind(this)
    const topology: Topology = {
      onConnect: this.onPeerConnected,
      onDisconnect: this.onPeerDisconnected,
      notifyOnLimitedConnection: false,
    }

    const registrar = this.components.registrar
    this.registrarId = await registrar.register(this.protocol, topology)
    await registrar.handle(this.protocol, this.onIncomingStream, {
      runOnLimitedConnection: false,
    })
  }

  async beforeStop() {
    this.logger.info('beforeStop')
  }

  async stop() {
    this.logger.info('stop')

    // Clear the unblock interval
    clearInterval(this.unblockInterval)
    // Nothing should re-attempt a join against a stopped service
    this.joinRetry.clearAll()
    this.localWriteRetry.clearAll()

    // Close all auth connections
    for (const peerId of this.authConnections.keys()) {
      this.closeAuthConnection(peerId)
    }

    await this.components.registrar.unhandle(this.protocol)
    this.components.registrar.unregister(this.registrarId)

    this.logger.info('Libp2pAuth service stopped')
  }

  async afterStop() {
    this.logger.info('afterStop')
    if (this.sigChainService.activeChainTeamId != null) {
      await this.sigChainService.saveChain(this.sigChainService.activeChainTeamId)
    }
  }

  /**
   * Handle an incoming ephemeral stream.
   * Once the stream is processed, it is closed.
   */
  private async onIncomingStream({ stream, connection }: IncomingStreamData) {
    const peerId = connection.remotePeer
    this.logger.trace(`Handling incoming ephemeral stream ${connection.id.toString()} from ${peerId.toString()}`)
    const abortController = new AbortController()

    // Process messages from the stream
    this.handleIncomingMessages(peerId, stream, abortController)
      .catch(err => {
        if (err instanceof Error && err.name === 'AbortError') {
          this.logger.debug(`Incoming stream from ${peerId.toString()} aborted (connection closed)`)
        } else {
          this.logger.error(`Error processing incoming stream from ${peerId.toString()}`, err)
        }
        if (!abortController.signal.aborted) {
          abortController.abort(err)
        }
      })
      .finally(() => {
        stream
          .close()
          .catch(err => this.logger.error(`Error closing incoming ephemeral stream from ${peerId.toString()}`, err))
      })
  }

  /**
   * Process incoming messages by decoding the length-prefixed data and delivering
   * it to the corresponding auth connection.
   */
  private async handleIncomingMessages(peerId: PeerId, stream: Stream, abortController: AbortController) {
    await pipe(
      stream,
      source => decode(source),
      async source => {
        try {
          for await (const data of abortableAsyncIterable(source, abortController.signal)) {
            try {
              const authConn = this.authConnections.get(peerId.toString())
              if (!authConn) {
                this.logger.error(`No auth connection established for ${peerId.toString()}`)
              } else {
                authConn.deliver(data.subarray())
              }
            } catch (e) {
              this.logger.error(`Error while delivering message to ${peerId.toString()}`, e)
              if (!abortController.signal.aborted) {
                abortController.abort(e)
              }
            }
          }
        } catch (e) {
          if (e instanceof Error && e.name === 'AbortError') {
            this.logger.debug(`Stream from ${peerId.toString()} aborted (connection closed)`)
          } else {
            throw e
          }
        }
      }
    )
  }

  /**
   * Send an outgoing message using an ephemeral stream.
   * This method opens a new stream, writes the encoded message, and then closes it.
   */
  private async sendMessage(peerId: PeerId, message: Uint8Array) {
    const connection = this.peerConnections.get(peerId.toString())
    if (!connection) {
      this.logger.warn(`No connection available for ephemeral stream to ${peerId.toString()}`)
      return
    }

    const abortController = new AbortController()
    try {
      this.logger.trace(`Opening ephemeral outbound stream to ${peerId.toString()}`)
      const stream = await connection.newStream(this.protocol, {
        runOnLimitedConnection: false,
        negotiateFully: false,
        signal: abortController.signal,
      })
      this.logger.trace(`Ephemeral stream opened to ${peerId.toString()}, sending message`)
      if (stream.status !== 'open') {
        this.logger.warn(
          `Attempted to send message to ${peerId.toString()} on ephemeral stream that had already closed`
        )
        return
      }
      await pipe([encode.single(message)], stream)
      await stream.close()
      this.logger.trace(`Ephemeral stream closed to ${peerId.toString()}`)
    } catch (e) {
      this.logger.error(`Error sending ephemeral message to ${peerId.toString()}`, e)
      if (!abortController.signal.aborted) {
        abortController.abort(e)
      }
    }
  }

  /**
   * Makes an admission durable before the acceptance that carries the team keys
   * is released to the invitee.
   *
   * The point is to bind membership to its record. Nobody may hold this
   * community's keys without a durable record of their admission on the device
   * that admitted them, so the ADMIT_MEMBER / ADMIT_DEVICE link must be on disk
   * before the acceptance that carries the team graph and keyring leaves this
   * machine (threat-model C3, option A). The adversary is the joiner, not bad
   * luck: a peer holding a valid invitation is entitled to join but not to
   * join unrecorded, and it is exactly the party that cannot be relied on to
   * report its own admission afterwards.
   *
   * This is the callback shape @localfirst/auth calls after the admission has
   * been appended to the in-memory team and before ACCEPT_INVITATION is queued.
   * Rejecting fails the connection with ADMISSION_NOT_PERSISTED and sends
   * nothing. The failure this rules out is a member with keys but no record:
   * after a crash the admitter has forgotten them and they surface as an
   * unknown device (QSS-006 / private#203).
   *
   * The team LFA hands us is the same object the active SigChain holds, so
   * persisting by team ID serializes exactly the graph carrying the new entry,
   * and persistChain's per-team queue keeps it ordered against other writers.
   */
  private persistAdmission = async (team: Auth.Team): Promise<void> => {
    this.logger.info(`Persisting admission for team ${team.id} before releasing acceptance`)
    try {
      await this.sigChainService.persistChain(team.id, 'admission')
    } catch (err) {
      await this.rollBackFailedAdmission(team.id, err)
      // Still fail the gate: the acceptance must not be released.
      throw err
    }
  }

  /**
   * Undoes an admission this device appended but could not store.
   *
   * Leaving it in memory is not neutral. The link stays in the live team, so the
   * next ordinary write commits it, and the invitee is then treated as admitted
   * by a record we never made. Worse for the invitee, a retry would be served
   * that same link, whose proof belongs to the handshake that already failed, so
   * it could not accept it. Rolling back to the stored team means the retry
   * produces a fresh admission bound to the new handshake.
   *
   * Every auth connection captured the team object we are discarding, so they
   * are dropped too and their peers redial.
   *
   * @param teamId The team whose admission could not be stored
   * @param cause The write failure
   */
  private async rollBackFailedAdmission(teamId: string, cause: unknown): Promise<void> {
    this.logger.error(`Admission write failed for team ${teamId}, rolling back to the stored team`, cause)
    try {
      await this.sigChainService.restoreChainToDurableState(teamId)
    } catch (err) {
      this.logger.error(`Could not restore team ${teamId}; writes for it stay blocked`, err)
      return
    }
    // Drop the connections after this gate has finished failing. Tearing them
    // down inline removes the listeners @localfirst/auth is about to emit
    // ADMISSION_NOT_PERSISTED on, so the failure would go out silently.
    const timer = setTimeout(() => {
      for (const peerId of [...this.authConnections.keys()]) {
        this.closeAuthConnection(peerId, true)
      }
    }, 0)
    timer.unref?.()
  }

  /**
   * Called when a peer connects. If we’re not ready to start (e.g. no active chain),
   * the connection is buffered. Otherwise we create a new auth connection and
   * store the underlying libp2p connection for ephemeral stream use.
   */
  private async onPeerConnected(peerId: PeerId, connection: Connection) {
    if (this.authConnections.has(peerId.toString())) {
      this.logger.info(`Auth connection with ${peerId.toString()} already exists`)
      return
    }
    if (this.joinStatus === JoinStatus.JOINING) {
      this.logger.warn(`Connection to ${peerId.toString()} will be buffered due to a concurrent join`)
      this.bufferedConnections.push({ peerId, connection })
      return
    }
    if (this.sigChainService.activeChainTeamId == null) {
      this.logger.warn(`No active chain found, buffering connection to ${peerId.toString()}`)
      this.bufferedConnections.push({ peerId, connection })
      return
    }

    if (this.joinStatus === JoinStatus.PENDING) {
      this.joinStatus = JoinStatus.JOINING
    }

    this.logger.info(`Peer connected (direction = ${connection.direction})! (status = ${connection.status})`)
    if (connection.status !== 'open') {
      this.logger.warn(`The connection with ${peerId.toString()} was not in an open state!`)
      return
    }

    const context = this.sigChainService.getActiveChain().context

    if (this.authConnections.has(peerId.toString())) {
      const oldAuthConnection = this.authConnections.get(peerId.toString())!
      const oldPeerConnection = this.peerConnections.get(peerId.toString())
      if (oldPeerConnection != null && oldPeerConnection.status === 'open') {
        this.logger.warn(
          `A connection with ${peerId.toString()} was already available, skipping connection initialization!`
        )
        return
      }
      this.logger.warn('Replacing closed auth connection with a new one', oldPeerConnection?.remotePeer)
      oldAuthConnection.stop()
      this.authConnections.delete(peerId.toString())
      this.peerConnections.delete(peerId.toString())
    }

    // Create an auth connection using an ephemeral sendMessage callback.
    const authConnection = new Auth.Connection({
      context,
      sendMessage: (message: Uint8Array) => {
        // Fire-and-forget: send message using an ephemeral stream.
        this.sendMessage(peerId, message).catch(err => {
          this.logger.error(`Error in sendMessage callback for ${peerId.toString()}`, err)
        })
      },
      createLogger: this.createLfaLogger,
      persistAdmission: this.persistAdmission,
    } as ConnectionParams)

    // Set up auth connection event handlers.
    authConnection.on(LFAEvents.CONNECTED, () => {
      if (this.sigChainService.activeChainTeamId != null) {
        this.logger.debug(`Sending sync message because our chain is initialized`)
        const team = this.sigChainService.team
        const user = this.sigChainService.user
        if (team) {
          authConnection.emit('sync', { team, user })
          grantMissingMemberRoleFromConnectedPeer(
            this.sigChainService.roles,
            authConnection._context.peer as Member | undefined
          )
          void this.handleJoinViaQSS().catch(err => {
            this.logger.error('Failed to complete QSS join handling on connect', err)
          })
        } else {
          this.logger.error('Cannot emit sync event, team is null')
        }
        this.emit(Libp2pEvents.AUTH_CONNECTED)
      }
    })

    authConnection.on(LFAEvents.DISCONNECTED, event => {
      this.logger.info(`LFA Disconnected!`, event)
      this.libp2pService.emit(Libp2pEvents.AUTH_DISCONNECTED, {
        event,
        connection,
      })
    })

    // The graph we just accepted has to be on disk before AUTH_JOINED goes out
    // and before buffered peers are released: everything behind that event
    // assumes we hold a team that survives a restart, and the peer that admitted
    // us has already handed over keys (QSS-006). The write used to be
    // fire-and-forget, so a crash in the gap left us with no team at all.
    authConnection.on(LFAEvents.JOINED, payload => {
      void this.handleLfaJoined(payload, peerId, connection).catch(err => {
        this.logger.error(`Failed to handle LFA joined event from ${peerId.toString()}`, err)
      })
    })

    authConnection.on(LFAEvents.CHANGE, payload => {
      this.emit(Libp2pEvents.AUTH_STATE_CHANGED, payload)
    })

    authConnection.on(LFAEvents.UPDATED, payload => {
      this.emit(Libp2pEvents.AUTH_UPDATED, payload)
      void this.handleJoinViaQSS().catch(err => {
        this.logger.error('Failed to complete QSS join handling on chain update', err)
      })
    })

    // Handle errors from local or remote sources.
    authConnection.on(LFAEvents.LOCAL_ERROR, error => {
      this.emit(Libp2pEvents.AUTH_LOCAL_ERROR, { error, connection })
    })
    authConnection.on(LFAEvents.REMOTE_ERROR, error => {
      this.emit(Libp2pEvents.AUTH_REMOTE_ERROR, { error, connection })
    })

    // Store the auth connection and also the underlying libp2p connection
    this.authConnections.set(peerId.toString(), authConnection)
    this.peerConnections.set(peerId.toString(), connection)

    this.logger.info(`Auth connection established with ${peerId.toString()}`)
    authConnection.start()
  }

  /**
   * Records a completed join and publishes it, but only once the accepted graph
   * is on disk.
   *
   * Nothing another code path can read as "we have joined" is published before
   * the write: not the join status, not the active chain, not AUTH_JOINED, and
   * not the release of buffered peers. The context is the one exception, since
   * the chain cannot be serialized until it carries the team, so it is staged
   * first and rolled back if the write fails.
   *
   * Rolling back matters because the failure is local and usually transient. If
   * we left JOINED behind, every later guard would read it as success while no
   * team had been stored, buffered peers would stay blocked and nothing would
   * re-enter this path (private#203 L-2). Instead the status returns to a
   * retryable one and the join is re-attempted against the same peer with
   * backoff, up to a bound.
   *
   * @param payload The team and user @localfirst/auth admitted us as
   * @param peerId The peer that admitted us, and that a retry would go back to
   * @param connection The underlying libp2p connection, reused by a retry
   */
  private async handleLfaJoined(
    payload: { team: Auth.Team; user: Auth.UserWithSecrets },
    peerId: PeerId,
    connection: Connection
  ): Promise<void> {
    const { team, user } = payload
    const sigChain = this.sigChainService.getActiveChain()
    const previousContext = sigChain.context
    const previousJoinStatus = this.joinStatus
    const joiningNow = sigChain.team == null
    let stagedContext = false

    if (joiningNow && !('team' in sigChain.context)) {
      this.logger.info(`${user.userId}: Creating SigChain for user with name ${user.userName} and team name ${team.id}`)
      sigChain.context = {
        device: (sigChain.context as Auth.InviteeContext).device,
        team,
        user,
      } as Auth.MemberContext
      stagedContext = true
    }

    await this.commitJoin({
      teamId: sigChain.teamId!,
      userId: user.userId,
      peerId,
      connection,
      joiningNow,
      stagedContext,
      previousContext,
      previousJoinStatus,
    })
  }

  /**
   * Writes the accepted team and, only once that lands, publishes the join.
   *
   * Re-entered by the local write retry. The acceptance has already been
   * validated and is held in memory, so a failure here is ours alone: nothing
   * about it needs the network again, and asking the admitter for a second
   * acceptance would be both slower and a fresh handshake we do not need.
   * The local write is therefore retried on its own budget, and only when that
   * is spent do we roll back and go get a new acceptance.
   */
  private async commitJoin(pending: PendingJoin): Promise<void> {
    const { teamId, userId, peerId, connection, joiningNow, stagedContext, previousContext, previousJoinStatus } =
      pending
    const retryKey = `${teamId}:${peerId.toString()}`

    try {
      await this.sigChainService.persistChain(teamId)
    } catch (err) {
      // Keep the staged context while we retry: it is what the write serializes,
      // and nothing is published from it until the write succeeds.
      const scheduled = this.localWriteRetry.schedule(retryKey, async () => this.commitJoin(pending))
      if (scheduled) {
        this.logger.error(`Failed to persist chain after joining team ${teamId}, retrying the write`, err)
        return
      }

      this.logger.error(
        `Giving up on writing the joined team ${teamId} locally, rolling back and asking for a new acceptance`,
        err
      )
      if (stagedContext) {
        this.sigChainService.getActiveChain().context = previousContext
      }
      // JOINING would make the retry buffer the peer instead of re-admitting us,
      // so hand back a status the join path will actually act on.
      this.joinStatus = previousJoinStatus === JoinStatus.JOINING ? JoinStatus.PENDING : previousJoinStatus
      this.closeAuthConnection(peerId, false)
      this.scheduleJoinRetry(peerId, connection)
      return
    }

    this.localWriteRetry.clear(retryKey)
    if (joiningNow) {
      this.logger.info(`Joined team ${teamId} (userid: ${userId})!`)
      this.sigChainService.setActiveChain(teamId)
    }
    this.joinStatus = JoinStatus.JOINED
    this.joinRetry.clear(peerId.toString())
    this.emit(Libp2pEvents.AUTH_JOINED)
    this.unblockConnections(this.bufferedConnections)
  }

  /**
   * Re-attempts a join that failed on our own persistence, with backoff.
   *
   * @param peerId The admitting peer to go back to
   * @param connection The libp2p connection to reuse, if it is still open
   */
  private scheduleJoinRetry(peerId: PeerId, connection: Connection): void {
    const remoteAddr = connection.remoteAddr.toString()
    const scheduled = this.joinRetry.schedule(peerId.toString(), async () => {
      this.logger.info(`Retrying the join with ${peerId.toString()} after a failed admission write`)
      // Both halves of the handshake have to be rebuilt. Ours is already gone,
      // but the admitting peer keeps its half for as long as the underlying
      // libp2p connection is open, and it will not re-admit us over that stale
      // connection - a fresh auth connection talking into it just sits there
      // until the 30s protocol timeout. Dropping the transport connection makes
      // the peer discard its auth connection too, so the reconnect runs a clean
      // handshake on both sides.
      try {
        await connection.close()
      } catch (err) {
        this.logger.warn(`Failed to close the connection to ${peerId.toString()} before retrying`, err)
      }
      // Let the disconnect propagate before dialing, or the dial is skipped as
      // already-connected.
      await new Promise(resolve => setTimeout(resolve, 250))
      await this.libp2pService.dialPeer(remoteAddr)
    })
    if (!scheduled) {
      this.logger.error(
        `Giving up on joining via ${peerId.toString()}: the chain could not be persisted after repeated attempts`
      )
    }
  }

  private async onPeerDisconnected(peerId: PeerId) {
    if (this.authConnections.has(peerId.toString())) {
      this.logger.warn(`Auth connection with ${peerId.toString()} was disconnected`)
      this.closeAuthConnection(peerId, false)
    }

    if (this.joinStatus === JoinStatus.JOINED) {
      return
    }

    let id: string
    try {
      this.sigChainService.getActiveChain()
      id = this.sigChainService.team.id
    } catch (e) {
      this.joinStatus = JoinStatus.NOT_STARTED
      return
    }

    /**
     * We need to manually reset the join status in the case where the status is stuck on an intermediate state like
     * JOINING when disconnecting (for example this can happen when the user you are connecting to doesn't have your
     * information in their chain yet resulting in an invalid device error)
     */
    const oldJoinStatus = this.joinStatus
    if (this.joinedViaQSS(id)) {
      this.joinStatus = JoinStatus.PENDING_MEMBER
    } else {
      this.joinStatus = JoinStatus.PENDING
    }
    this.logger.info('Reset join status on disconnect', oldJoinStatus, this.joinStatus)
  }

  public closeAuthConnection(peerId: PeerId | string, sendPeerDisconnect = true) {
    this.logger.info(`Attempting to close auth connection with ${peerId.toString()}`)
    const key = peerId.toString()

    // Remove the stored connection (ephemeral streams are used for each message)
    if (this.peerConnections.has(key)) {
      this.peerConnections.delete(key)
    }

    if (this.authConnections.has(key)) {
      try {
        this.authConnections.get(key)?.stop(sendPeerDisconnect)
      } catch (e) {
        // do nothing
      }
      this.authConnections.delete(key)
    }
  }

  private async handleJoinViaQSS(): Promise<void> {
    if (this.sigChainService.team == null) {
      throw new Error('Team is undefined')
    }

    if (
      this.joinViaQssInFlight ||
      !this.joinedViaQSS(this.sigChainService.team.id) ||
      this.joinStatus === JoinStatus.JOINED ||
      !this.sigChainService.roles.amIMemberOfRole(RoleName.MEMBER)
    ) {
      return
    }

    // Publish nothing before the write. The status used to be set first, which
    // both signalled a membership we had not stored and, on failure, left a
    // terminal JOINED that this guard would never let us past again
    // (QSS-006, private#203 L-2). A separate in-flight flag now keeps concurrent
    // callers out, so a failed write leaves the join retryable: this runs again
    // on the next auth connect or chain update.
    this.joinViaQssInFlight = true
    try {
      await this.sigChainService.persistChain(this.sigChainService.activeTeamId!)
    } catch (err) {
      this.logger.error(`Failed to persist chain while joining via QSS, leaving the join retryable`, err)
      return
    } finally {
      this.joinViaQssInFlight = false
    }

    this.joinStatus = JoinStatus.JOINED
    this.unblockConnections(this.bufferedConnections)
    this.emit(Libp2pEvents.AUTH_JOINED)
  }

  private joinedViaQSS(teamId: string): boolean {
    return [JoinStatus.JOINED, JoinStatus.PENDING_MEMBER].includes(this.qssService?.joinStatus(teamId))
  }
}

export const libp2pAuth = (
  sigChainService: SigChainService,
  qssService: QSSService,
  libp2pService: Libp2pService
): ((components: Libp2pAuthComponents) => Libp2pAuth) => {
  return (components: Libp2pAuthComponents) => new Libp2pAuth(sigChainService, qssService, libp2pService, components)
}
