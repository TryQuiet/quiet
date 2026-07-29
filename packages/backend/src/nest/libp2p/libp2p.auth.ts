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
import { ConnectionParams } from '3rd-party/auth/packages/auth/dist/connection/Connection'
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
import { AdmissionCandidate, AdmissionKind, AdmissionTransport } from '../admission/admission.types'

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
  private unblockConnectionsInFlight: Promise<void> | undefined
  private joinStatus: JoinStatus
  private logger: QuietLogger = createLogger('libp2p:auth')
  private readonly createLfaLogger = createWinstonQuietLogger('localfirst:libp2p')
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

    this.qssService.once(QSSEvents.QSS_AUTH_JOINED, () => {
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
    if (this.joinStatus === JoinStatus.NOT_STARTED && this.sigChainService.activeChainTeamId != null) {
      this.logger.info(`Unblocking ${this.bufferedConnections.length} connections now that we have an active chain`)
      this.joinStatus = this.sigChainService.getActiveChain()!.team != null ? JoinStatus.JOINED : JoinStatus.PENDING
    }

    const activeChain = this.sigChainService.getActiveChain(false)
    this.logger.trace(
      'Join status (libp2p, qss)',
      this.joinStatus,
      activeChain != null && activeChain.team != null ? this.qssService.joinStatus(activeChain.team.id) : null
    )
    if (
      this.bufferedConnections.length === 0 ||
      (this.joinStatus !== JoinStatus.JOINED && this.joinStatus !== JoinStatus.PENDING_MEMBER)
    ) {
      return
    }

    this.logger.info(
      `Unblocking ${this.bufferedConnections.length} buffered connections now that we've joined the chain`
    )
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
    } as ConnectionParams)

    // Set up auth connection event handlers.
    authConnection.on(LFAEvents.CONNECTED, () => {
      if (this.sigChainService.activeChainTeamId != null) {
        this.logger.debug(`Sending sync message because our chain is initialized`)
        const team = this.sigChainService.team
        const user = this.sigChainService.user
        if (team) {
          authConnection.emit('sync', { team, user })
          if (
            authConnection._context.peer != null &&
            !(authConnection._context.peer as Member).roles.includes(RoleName.MEMBER)
          ) {
            this.sigChainService.roles.addMember((authConnection._context.peer as Member).userId, RoleName.MEMBER)
          }
          this.handleJoinViaQSS()
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

    authConnection.on(LFAEvents.JOINED, payload => {
      void this.handleAdmissionCandidate(authConnection, connection, payload).catch(error => {
        this.logger.error('Failed to finalize libp2p admission candidate', error)
      })
    })

    authConnection.on(LFAEvents.CHANGE, payload => {
      this.emit(Libp2pEvents.AUTH_STATE_CHANGED, payload)
    })

    authConnection.on(LFAEvents.UPDATED, payload => {
      this.emit(Libp2pEvents.AUTH_UPDATED, payload)
      this.handleJoinViaQSS()
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
    this.authConnections.set(peerId.toString(), authConnection)
    this.peerConnections.set(peerId.toString(), connection)

    this.logger.info(`Auth connection established with ${peerId.toString()}`)
    authConnection.start()
  }

  private async handleAdmissionCandidate(
    authConnection: Auth.Connection,
    connection: Connection,
    payload: { team: Auth.Team; user: Auth.UserWithSecrets }
  ): Promise<void> {
    if (this.authConnections.get(connection.remotePeer.toString()) !== authConnection) {
      this.logger.warn('Ignoring stale admission success from an inactive peer', connection.remotePeer.toString())
      return
    }
    const { team, user } = payload
    const sigChain = this.sigChainService.getActiveChain()
    const wasPendingDeviceAdmission = sigChain.isPendingDeviceAdmission
    if (sigChain.team == null) {
      try {
        sigChain.completeInvitation(team, user)
      } catch (error) {
        this.joinStatus = JoinStatus.PENDING
        this.logger.error('Rejected invited device admission', error)
        this.emit(Libp2pEvents.AUTH_LOCAL_ERROR, { error, connection })
        await this.advanceAfterAdmissionFailure(authConnection, connection)
        return
      }

      this.logger.info(`${user.userId}: Created SigChain for user with name ${user.userName} and team ${team.id}`)
      this.logger.info(`Joined team ${team.id} (userid: ${user.userId})!`)
      this.sigChainService.setActiveChain(sigChain.teamId!)
    }
    const candidate: AdmissionCandidate = {
      transport: AdmissionTransport.P2P,
      teamId: team.id,
      userId: user.userId,
      deviceId: sigChain.device.deviceId,
      kind: wasPendingDeviceAdmission ? AdmissionKind.DEVICE : AdmissionKind.MEMBER,
    }
    try {
      await this.libp2pService.completeAdmission(candidate)
    } catch (error) {
      this.joinStatus = JoinStatus.PENDING
      this.emit(Libp2pEvents.AUTH_LOCAL_ERROR, { error, connection })
      return
    }
    this.joinStatus = JoinStatus.JOINED
    this.emit(Libp2pEvents.AUTH_JOINED, {
      teamId: team.id,
      userId: user.userId,
      deviceId: sigChain.device.deviceId,
      deviceAdmission: wasPendingDeviceAdmission,
    })
    void this.unblockConnections().catch(error => {
      this.logger.error('Failed to resume buffered connections after libp2p admission', error)
    })
  }

  private async advanceAfterAdmissionFailure(authConnection: Auth.Connection, connection: Connection): Promise<void> {
    if (this.joinStatus !== JoinStatus.JOINING) {
      return
    }
    const peerId = connection.remotePeer
    if (this.authConnections.get(peerId.toString()) !== authConnection) {
      return
    }

    this.closeAuthConnection(peerId, false)
    await this.advanceToNextBufferedPeer()
  }

  private async advanceToNextBufferedPeer(): Promise<void> {
    this.joinStatus = JoinStatus.PENDING
    while (this.bufferedConnections.length > 0) {
      const next = this.bufferedConnections.shift()!
      if (next.connection.status !== 'open') {
        continue
      }
      await this.onPeerConnected(next.peerId, next.connection)
      return
    }
  }

  private async onPeerDisconnected(peerId: PeerId) {
    const disconnectedAdmissionPeer =
      this.joinStatus === JoinStatus.JOINING && this.authConnections.has(peerId.toString())
    if (this.authConnections.has(peerId.toString())) {
      this.logger.warn(`Auth connection with ${peerId.toString()} was disconnected`)
      this.closeAuthConnection(peerId, false)
    }
    if (disconnectedAdmissionPeer) {
      await this.advanceToNextBufferedPeer()
      if (this.joinStatus === JoinStatus.JOINING) {
        return
      }
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
      this.joinedViaQSS(this.sigChainService.team.id) &&
      this.joinStatus !== JoinStatus.JOINED &&
      this.sigChainService.roles.amIMemberOfRole(RoleName.MEMBER)
    ) {
      this.joinStatus = JoinStatus.JOINED
      await this.unblockConnections()
      this.emit(Libp2pEvents.AUTH_JOINED)
      await this.sigChainService.saveChain(this.sigChainService.activeTeamId!)
    }
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
