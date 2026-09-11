import {
  ComponentLogger,
  Connection,
  PeerId,
  PeerStore,
  serviceCapabilities,
  Stream,
  Topology,
  type TypedEventTarget,
  type Libp2pEvents as TransportEvents,
} from '@libp2p/interface'
import type { ConnectionManager, IncomingStreamData, Registrar } from '@libp2p/interface-internal'
import * as Auth from '../../../../../3rd-party/auth/packages/auth/dist'
import { pipe } from 'it-pipe'
import { encode, decode } from 'it-length-prefixed'

import { SigChainService } from '../auth/sigchain.service'
import { createLogger } from '../common/logger'
import { ConnectionParams } from '../../../../../3rd-party/auth/packages/auth/dist/connection'
import type { Libp2pService } from './libp2p.service'
import { Libp2pEvents, Libp2pState } from './libp2p.types'
import { abortableAsyncIterable } from '../common/utils'
import { QuietLogger } from '@quiet/logger'
import { createWinstonQuietLogger } from '@quiet/node-common'
import { RoleName } from '../auth/services/roles/roles'
import { QSSService } from '../qss/qss.service'
import { QSSEvents } from '../qss/qss.types'
import { Member } from '../../../../../3rd-party/auth/packages/auth/dist'
import { LFAEvents } from '../auth/types'
import type { AdmissionAuthContext } from '../admission/admission-auth-context.types'
import { grantMissingMemberRoleFromConnectedPeer } from './memberRoleGrant'
import { BoundedRetry } from '../common/boundedRetry'

export interface Libp2pAuthComponents {
  peerId: PeerId
  peerStore: PeerStore
  registrar: Registrar
  connectionManager: ConnectionManager
  logger: ComponentLogger
  events: TypedEventTarget<TransportEvents>
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
  previousContext: Auth.MemberContext | Auth.InviteeContext
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
  private readonly admissionContexts = new WeakMap<Auth.Connection, AdmissionAuthContext>()
  private readonly protocol: string
  private readonly components: Libp2pAuthComponents
  private registrarId: string
  private sigChainService: SigChainService
  private libp2pService: Libp2pService
  private qssService: QSSService
  /** LFA sessions keyed by transport connection id: one session per physical transport. */
  private authConnections: Map<string, Auth.Connection>
  private peerConnections: Map<string, Connection>
  private bufferedConnections: { peerId: PeerId; connection: Connection }[]
  private failedAdmissionPeers: Set<string>
  private unblockInterval: NodeJS.Timeout
  private unblockConnectionsInFlight: Promise<void> | undefined
  private joinStatus: JoinStatus
  private joiningConnectionId?: string
  private stopped = false
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
    this.failedAdmissionPeers = new Set()

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

    this.qssService.once(QSSEvents.QSS_AUTH_JOINED, () => {
      this.failedAdmissionPeers.clear()
      if (this.joinStatus !== JoinStatus.JOINED) {
        const activeChain = this.sigChainService.getActiveChain(false)
        this.joinStatus =
          activeChain?.team != null && activeChain.roles.amIMemberOfRole(RoleName.MEMBER)
            ? JoinStatus.JOINED
            : JoinStatus.PENDING_MEMBER
      }
      void this.unblockConnections().catch(error => {
        this.logger.error('Failed to resume buffered connections after QSS admission', error)
      })
    })

    this.logger.info('Auth service initialized')
    this.logger.info('sigChainService', sigChainService.activeChainTeamId)

    // Set up a periodic check to process buffered connections
    this.unblockInterval = setInterval(() => {
      void this.unblockConnections().catch(error => {
        this.logger.error('Failed to resume buffered connections during periodic check', error)
      })
    }, 5_000)
  }

  private emit(eventName: string, ...args: any[]) {
    this.libp2pService.emit(eventName, ...args)
  }

  // Process any connections that were buffered because we were waiting for a chain
  private async unblockConnections(): Promise<void> {
    if (this.unblockConnectionsInFlight != null) {
      return this.unblockConnectionsInFlight
    }

    this.unblockConnectionsInFlight = this.drainBufferedConnections()
    try {
      await this.unblockConnectionsInFlight
    } finally {
      this.unblockConnectionsInFlight = undefined
    }
  }

  private async drainBufferedConnections(): Promise<void> {
    if (this.stopped) return
    if (this.joinStatus === JoinStatus.NOT_STARTED && this.sigChainService.activeChainTeamId != null) {
      this.logger.info(`Unblocking ${this.bufferedConnections.length} connections now that we have an active chain`)
      const activeChain = this.sigChainService.getActiveChain()!
      if (activeChain.team == null) {
        this.joinStatus = JoinStatus.PENDING
      } else if (activeChain.roles.amIMemberOfRole(RoleName.MEMBER)) {
        this.joinStatus = JoinStatus.JOINED
      } else {
        this.joinStatus = JoinStatus.PENDING_MEMBER
      }
    }

    const activeChain = this.sigChainService.getActiveChain(false)
    this.logger.trace(
      'Join status (libp2p, qss)',
      this.joinStatus,
      activeChain != null && activeChain.team != null ? this.qssService.joinStatus(activeChain.team.id) : null
    )
    if (
      this.bufferedConnections.length === 0 ||
      ![JoinStatus.JOINED, JoinStatus.PENDING_MEMBER, JoinStatus.PENDING].includes(this.joinStatus)
    ) {
      return
    }

    this.logger.info(
      `Unblocking ${this.bufferedConnections.length} buffered connections now that we've joined the chain`
    )
    // A fresh join can rebuffer the remaining transports. Process a snapshot
    // so that this cannot loop over a just-rebuffered connection indefinitely.
    const connectionsToResume = this.bufferedConnections.splice(0)
    for (const conn of connectionsToResume) {
      if (conn.connection.status !== 'open') {
        this.logger.warn(`Skipping closed buffered connection to ${conn.peerId.toString()}`)
        continue
      }
      try {
        await this.onPeerConnected(conn.peerId, conn.connection)
      } catch (error) {
        this.logger.error(`Failed to resume buffered connection to ${conn.peerId.toString()}`, error)
      }
    }
  }

  async start() {
    this.logger.info('Auth service starting')

    this.onPeerConnected = this.onPeerConnected.bind(this)
    this.onPeerDisconnected = this.onPeerDisconnected.bind(this)
    this.onIncomingStream = this.onIncomingStream.bind(this)
    this.stopped = false
    this.components.events.addEventListener('connection:close', this.onConnectionClosed)
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

    this.stopped = true
    this.components.events.removeEventListener('connection:close', this.onConnectionClosed)
    this.bufferedConnections.splice(0)
    // Clear the unblock interval
    clearInterval(this.unblockInterval)
    // Nothing should re-attempt a join against a stopped service
    this.joinRetry.clearAll()
    this.localWriteRetry.clearAll()

    // Close all auth connections
    for (const connection of this.peerConnections.values()) {
      this.closeTransportAuthConnection(connection, false)
    }

    await this.components.registrar.unhandle(this.protocol)
    this.components.registrar.unregister(this.registrarId)

    this.logger.info('Libp2pAuth service stopped')
  }

  async afterStop() {
    this.logger.info('afterStop')
    if (this.sigChainService.activeChainTeamId != null) {
      if (this.sigChainService.hasAdmissionPersistenceBarrier(this.sigChainService.activeChainTeamId)) {
        this.logger.info('Skipping shutdown persistence while admission persistence is suspended')
        return
      }
      if (this.sigChainService.getActiveChain().isPendingDeviceAdmission) {
        this.logger.info('Skipping persistence for pending device invitation context')
        return
      }
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
    this.handleIncomingMessages(connection, stream, abortController)
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
  private async handleIncomingMessages(connection: Connection, stream: Stream, abortController: AbortController) {
    const peerId = connection.remotePeer
    await pipe(
      stream,
      source => decode(source),
      async source => {
        try {
          for await (const data of abortableAsyncIterable(source, abortController.signal)) {
            try {
              const authConn = this.authConnections.get(connection.id)
              if (!authConn) {
                this.logger.error(`No auth connection established for ${peerId.toString()}`)
              } else {
                const message = data.subarray().slice()
                const admission = this.admissionContexts.get(authConn)
                if (admission != null) admission.gate.deliver(() => authConn.deliver(message))
                else authConn.deliver(message)
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
  private async sendMessage(connection: Connection, message: Uint8Array, admission?: AdmissionAuthContext) {
    const peerId = connection.remotePeer
    if (this.stopped || connection.status !== 'open' || !this.authConnections.has(connection.id)) {
      this.logger.debug(`No live auth transport for ephemeral stream to ${peerId.toString()}`)
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
      if (admission?.gate.closed) {
        await stream.close()
        return
      }
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
    await this.sigChainService.persistAdmittedTeam(team)
  }

  /**
   * Called when a peer connects. If we’re not ready to start (e.g. no active chain),
   * the connection is buffered. Otherwise we create a new auth connection and
   * store the underlying libp2p connection for ephemeral stream use.
   */
  private async onPeerConnected(peerId: PeerId, connection: Connection) {
    if (this.stopped || connection.status !== 'open' || this.authConnections.has(connection.id)) return
    if ([Libp2pState.Paused, Libp2pState.Stopping, Libp2pState.Stopped].includes(this.libp2pService.state)) return
    const peerIdString = peerId.toString()
    if (this.joinStatus !== JoinStatus.JOINED && this.failedAdmissionPeers.has(peerIdString)) {
      this.logger.warn(`Ignoring previously failed admission peer ${peerIdString}`)
      return
    }
    if (this.joinStatus === JoinStatus.JOINING) {
      this.logger.warn(`Connection to ${peerIdString} will be buffered due to a concurrent join`)
      this.bufferedConnections.push({ peerId, connection })
      return
    }
    if (this.sigChainService.activeChainTeamId == null) {
      this.logger.warn(`No active chain found, buffering connection to ${peerIdString}`)
      this.bufferedConnections.push({ peerId, connection })
      return
    }

    this.logger.info(`Peer connected (direction = ${connection.direction})! (status = ${connection.status})`)
    if (connection.status !== 'open') {
      this.logger.warn(`The connection with ${peerId.toString()} was not in an open state!`)
      return
    }

    const activeAdmission = this.libp2pService.admissionContext
    if (activeAdmission?.gate.closed) return
    const admission = activeAdmission?.gate.published ? undefined : activeAdmission
    const context = (admission?.chain ?? this.sigChainService.getActiveChain()).context

    if (this.joinStatus === JoinStatus.PENDING) {
      this.joinStatus = JoinStatus.JOINING
      this.joiningConnectionId = connection.id
    }

    // LFA message numbers belong to a session. Each physical transport owns
    // one session; an overlapping transport must not feed a fresh handshake
    // into an older session or send through that session's closed connection.
    const authConnection = new Auth.Connection({
      context,
      sendMessage: (message: Uint8Array) => {
        // Fire-and-forget: send message using an ephemeral stream.
        const send = () => {
          const operation = () => this.sendMessage(connection, message, admission)
          const sending = admission == null ? operation() : admission.gate.run(operation)
          void sending.catch(err => {
            this.logger.error(`Error in sendMessage callback for ${peerId.toString()}`, err)
          })
        }
        if (admission != null) admission.gate.deliver(send)
        else send()
      },
      createLogger: this.createLfaLogger,
      persistAdmission: this.persistAdmission,
    } as ConnectionParams)

    if (admission != null) this.admissionContexts.set(authConnection, admission)

    // This identity scopes an existing reconnect address; it does not establish
    // ownership of the transport peer ID or grant access to the community.
    const rememberPeerIdentity = () => {
      const { team, peer, theirDevice } = authConnection._context
      if (team && peer && theirDevice) {
        this.libp2pService.rememberAuthenticatedPeer(peerId.toString(), {
          teamId: team.id,
          userId: peer.userId,
          deviceId: theirDevice.deviceId,
        })
      }
    }
    authConnection.on('connectionSecured', () => {
      // A validated invitation checks the expected team before this event. It
      // precedes JOINED, whose listeners initialize storage before profiles
      // necessarily replicate. Established sessions wait for graph sync below.
      if (authConnection._context.invitationAcceptanceResult?.isValid === true) {
        rememberPeerIdentity()
      }
    })

    // Set up auth connection event handlers.
    authConnection.on(LFAEvents.CONNECTED, () => {
      rememberPeerIdentity()
      if (admission != null && !admission.gate.published) {
        if (!admission.gate.frozen && !admission.gate.closed && admission.chain.team != null) {
          authConnection.emit(LFAEvents.JOINED, {
            team: admission.chain.team,
            user: admission.chain.user,
            teamKeyring: admission.chain.team.teamKeyring(),
          })
        }
        return
      }
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
      if (['LOCAL_ERROR', 'REMOTE_ERROR', 'ERROR'].includes(event.type)) {
        void this.advanceAfterAdmissionFailure(authConnection, connection)
      }
    })

    // The graph we just accepted has to be on disk before AUTH_JOINED goes out
    // and before buffered peers are released: everything behind that event
    // assumes we hold a team that survives a restart, and the peer that admitted
    // us has already handed over keys (QSS-006). The write used to be
    // fire-and-forget, so a crash in the gap left us with no team at all.
    authConnection.on(LFAEvents.JOINED, payload => {
      const handler =
        admission != null
          ? this.handleAdmissionCandidate(authConnection, connection, payload, admission)
          : this.handleLfaJoined(payload, peerId, connection)
      void handler.catch(error => {
        this.logger.error('Failed to finalize libp2p admission', error)
      })
    })

    authConnection.on(LFAEvents.CHANGE, payload => {
      this.emit(Libp2pEvents.AUTH_STATE_CHANGED, payload)
    })

    authConnection.on(LFAEvents.UPDATED, payload => {
      if (admission != null && !admission.gate.published) return
      this.emit(Libp2pEvents.AUTH_UPDATED, payload)
      void this.handleJoinViaQSS().catch(err => {
        this.logger.error('Failed to complete QSS join handling on chain update', err)
      })
    })

    // Handle errors from local or remote sources.
    authConnection.on(LFAEvents.LOCAL_ERROR, error => {
      this.emit(Libp2pEvents.AUTH_LOCAL_ERROR, { error, connection })
      void this.advanceAfterAdmissionFailure(authConnection, connection)
    })
    authConnection.on(LFAEvents.REMOTE_ERROR, error => {
      this.emit(Libp2pEvents.AUTH_REMOTE_ERROR, { error, connection })
      void this.advanceAfterAdmissionFailure(authConnection, connection)
    })

    // Store the auth connection and also the underlying libp2p connection
    this.authConnections.set(connection.id, authConnection)
    this.peerConnections.set(connection.id, connection)

    this.logger.info(`Auth connection established with ${peerIdString}`)
    authConnection.start()
  }

  /** Records durable completion without emitting events or unblocking paused connections. */
  public markAdmissionCommitted(): void {
    this.joinStatus = JoinStatus.JOINED
    this.failedAdmissionPeers.clear()
  }

  private async handleAdmissionCandidate(
    authConnection: Auth.Connection,
    connection: Connection,
    payload: { team: Auth.Team; user: Auth.UserWithSecrets },
    admission: AdmissionAuthContext
  ): Promise<void> {
    if (admission.gate.closed || this.authConnections.get(connection.id) !== authConnection) return
    try {
      await admission.joined(payload)
    } catch (error) {
      // The coordinator has selected the outcome and owns teardown; no peer retry here.
      this.logger.warn('Admission candidate was rejected', { attemptId: admission.attemptId })
      return
    }
    admission.gate.deliver(() => {
      this.markAdmissionCommitted()
      this.emit(Libp2pEvents.AUTH_JOINED, {
        teamId: payload.team.id,
        userId: payload.user.userId,
        deviceId: admission.chain.device.deviceId,
        deviceAdmission: admission.request.kind === 'device',
      })
      void this.unblockConnections().catch(error => this.logger.error('Failed to resume buffered peers', error))
    })
  }

  private async advanceAfterAdmissionFailure(authConnection: Auth.Connection, connection: Connection): Promise<void> {
    const admission = this.admissionContexts.get(authConnection)
    if (admission?.gate.closed || admission?.gate.frozen) return
    if (this.joinStatus !== JoinStatus.JOINING) {
      return
    }
    const peerId = connection.remotePeer
    if (this.authConnections.get(connection.id) !== authConnection) {
      return
    }

    this.failedAdmissionPeers.add(peerId.toString())
    this.closeTransportAuthConnection(connection, false)
    const advancedToBufferedPeer = await this.advanceToNextBufferedPeer()
    if (!advancedToBufferedPeer) {
      await this.libp2pService.redialPeers()
    }
  }

  private async advanceToNextBufferedPeer(): Promise<boolean> {
    this.joinStatus = JoinStatus.PENDING
    this.joiningConnectionId = undefined
    while (this.bufferedConnections.length > 0) {
      const next = this.bufferedConnections.shift()!
      if (next.connection.status !== 'open' || this.failedAdmissionPeers.has(next.peerId.toString())) {
        continue
      }
      await this.onPeerConnected(next.peerId, next.connection)
      return true
    }
    return false
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
      sigChain.completeInvitation(team, user)
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
      this.closeTransportAuthConnection(connection, false)
      this.scheduleJoinRetry(peerId, connection)
      return
    }

    this.localWriteRetry.clear(retryKey)
    if (joiningNow) {
      this.logger.info(`Joined team ${teamId} (userid: ${userId})!`)
      this.sigChainService.setActiveChain(teamId)
    }
    this.joinStatus = JoinStatus.JOINED
    this.failedAdmissionPeers.clear()
    this.joinRetry.clear(peerId.toString())
    this.emit(Libp2pEvents.AUTH_JOINED)
    void this.unblockConnections().catch(error => this.logger.error('Failed to resume buffered peers', error))
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

  private hasAuthConnectionWith(peerId: PeerId): boolean {
    const key = peerId.toString()
    for (const connection of this.peerConnections.values()) {
      if (connection.remotePeer.toString() === key) return true
    }
    return false
  }

  private async onPeerDisconnected(peerId: PeerId) {
    if (this.libp2pService.admissionContext?.gate.frozen || this.libp2pService.admissionContext?.gate.closed) return
    // A delayed topology callback can follow a replacement transport's open.
    // Connection-close events already retire individual dead sessions.
    if (this.components.connectionManager.getConnections(peerId).some(connection => connection.status === 'open'))
      return
    const disconnectedAdmissionPeer = this.joinStatus === JoinStatus.JOINING && this.hasAuthConnectionWith(peerId)
    if (this.hasAuthConnectionWith(peerId)) {
      this.logger.warn(`Auth connection with ${peerId.toString()} was disconnected`)
    }
    this.closeAuthConnection(peerId, false)
    if (disconnectedAdmissionPeer) {
      await this.advanceToNextBufferedPeer()
      if (this.joinStatus === JoinStatus.JOINING) {
        return
      }
    }

    // A failed admission peer can disconnect after we've already advanced to a
    // buffered fallback. Do not reset that in-progress fallback to PENDING.
    if (this.joinStatus === JoinStatus.JOINING) {
      return
    }

    if (this.joinStatus === JoinStatus.JOINED) {
      return
    }

    const activeChain = this.sigChainService.getActiveChain(false)
    if (activeChain == null) {
      this.joinStatus = JoinStatus.NOT_STARTED
      return
    }
    if (activeChain.team == null) {
      this.joinStatus = JoinStatus.PENDING
      return
    }
    const id = activeChain.team.id

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
    for (const connection of this.peerConnections.values()) {
      if (connection.remotePeer.toString() === peerId.toString()) {
        this.closeTransportAuthConnection(connection, sendPeerDisconnect)
      }
    }
  }

  public closeTransportAuthConnection(connection: Connection, sendPeerDisconnect = false) {
    const authConnection = this.authConnections.get(connection.id)
    if (!authConnection) return
    try {
      // A requested final disconnect must still use this session's transport.
      authConnection.stop(sendPeerDisconnect)
    } catch (error) {
      this.logger.warn('Failed to stop auth connection', connection.id, error)
    } finally {
      authConnection.removeAllListeners()
      this.authConnections.delete(connection.id)
      this.peerConnections.delete(connection.id)
    }
  }

  private readonly onConnectionClosed = ({ detail: connection }: CustomEvent<Connection>) => {
    this.closeTransportAuthConnection(connection)
    for (let index = this.bufferedConnections.length - 1; index >= 0; index--) {
      if (this.bufferedConnections[index].connection.id === connection.id) this.bufferedConnections.splice(index, 1)
    }
    if (this.joiningConnectionId !== connection.id) return
    this.joiningConnectionId = undefined
    // A coordinated admission that is committing owns the transport; it must
    // not be handed to another buffered peer from here.
    if (this.libp2pService.admissionContext?.gate.frozen || this.libp2pService.admissionContext?.gate.closed) return
    // An accepted graph awaiting its durable local write still owns admission.
    // Only an interrupted handshake releases another buffered transport.
    if (this.joinStatus === JoinStatus.JOINING && !this.sigChainService.getActiveChain(false)?.team) {
      this.joinStatus = JoinStatus.PENDING
      void this.unblockConnections().catch(error =>
        this.logger.error('Failed to start buffered auth transport after disconnect', error)
      )
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
    void this.unblockConnections().catch(error => this.logger.error('Failed to resume buffered peers', error))
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
