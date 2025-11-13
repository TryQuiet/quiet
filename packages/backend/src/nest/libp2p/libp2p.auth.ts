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
import { ServerIoProviderTypes } from '../types'
import { RoleName } from '../auth/services/roles/roles'
import { QSSService } from '../qss/qss.service'
import { QSSEvents } from '../qss/qss.types'
import { ConnectionContext, Member } from '../../../../../3rd-party/auth/packages/auth/dist'
import { SigChain } from '../auth/sigchain'

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
  private joinStatus: JoinStatus
  private logger: QuietLogger = createLogger('libp2p:auth')
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

    if (sigChainService.activeChainTeamName == null) {
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
    this.logger.info('sigChainService', sigChainService.activeChainTeamName)

    // Set up a periodic check to process buffered connections
    this.unblockConnections = this.unblockConnections.bind(this)
    this.unblockInterval = setInterval(this.unblockConnections, 5_000, this.bufferedConnections)
  }

  private emit(eventName: string, ...args: any[]) {
    this.libp2pService.emit(eventName, ...args)
  }

  // Process any connections that were buffered because we were waiting for a chain
  private async unblockConnections(conns: { peerId: PeerId; connection: Connection }[]) {
    if (this.joinStatus === JoinStatus.NOT_STARTED && this.sigChainService.activeChainTeamName != null) {
      this.logger.info(`Unblocking ${conns.length} connections now that we have an active chain`)
      this.joinStatus = this.sigChainService.getActiveChain()!.team != null ? JoinStatus.JOINED : JoinStatus.PENDING
    } else if (this.joinStatus !== JoinStatus.JOINED && this.joinStatus !== JoinStatus.PENDING_MEMBER) {
      return
    }

    if (conns.length === 0) {
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
    if (this.sigChainService.activeChainTeamName != null) {
      await this.sigChainService.saveChain(this.sigChainService.activeChainTeamName)
    }
  }

  /**
   * Handle an incoming ephemeral stream.
   * Once the stream is processed, it is closed.
   */
  private async onIncomingStream({ stream, connection }: IncomingStreamData) {
    const peerId = connection.remotePeer
    this.logger.info(`Handling incoming ephemeral stream ${connection.id.toString()} from ${peerId.toString()}`)
    const abortController = new AbortController()

    // Process messages from the stream
    this.handleIncomingMessages(peerId, stream, abortController)
      .catch(err => {
        this.logger.error(`Error processing incoming stream from ${peerId.toString()}`, err)
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
      this.logger.info(`Opening ephemeral outbound stream to ${peerId.toString()}`)
      const stream = await connection.newStream(this.protocol, {
        runOnLimitedConnection: false,
        negotiateFully: false,
        signal: abortController.signal,
      })
      this.logger.info(`Ephemeral stream opened to ${peerId.toString()}, sending message`)
      if (stream.status !== 'open') {
        this.logger.warn(
          `Attempted to send message to ${peerId.toString()} on ephemeral stream that had already closed`
        )
        return
      }
      await pipe([encode.single(message)], stream)
      await stream.close()
      this.logger.info(`Ephemeral stream closed to ${peerId.toString()}`)
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
    if (this.sigChainService.activeChainTeamName == null) {
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
    } as ConnectionParams)

    // Set up auth connection event handlers.
    authConnection.on('connected', () => {
      if (this.sigChainService.activeChainTeamName != null) {
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

    authConnection.on('disconnected', event => {
      this.logger.info(`LFA Disconnected!`, event)
      this.libp2pService.emit(Libp2pEvents.AUTH_DISCONNECTED, {
        event,
        connection,
      })
    })

    authConnection.on('joined', payload => {
      const { team, user } = payload
      const sigChain = this.sigChainService.getActiveChain()
      this.logger.info(`Joined team ${team.teamName} (userid: ${user.userId})!`)
      if (sigChain.team == null) {
        this.logger.info(
          `${user.userId}: Creating SigChain for user with name ${user.userName} and team name ${team.teamName}`
        )
        if (!('team' in sigChain.context)) {
          sigChain.context = {
            device: (sigChain.context as Auth.InviteeContext).device,
            team,
            user,
          } as Auth.MemberContext
        }
        this.sigChainService.setActiveChain(team.teamName)
      }
      this.joinStatus = JoinStatus.JOINED
      this.sigChainService.saveChain(team.teamName)
      this.emit(Libp2pEvents.AUTH_JOINED)
      this.unblockConnections(this.bufferedConnections)
    })

    authConnection.on('change', payload => {
      this.emit(Libp2pEvents.AUTH_STATE_CHANGED, payload)
    })

    authConnection.on('updated', payload => {
      this.emit(Libp2pEvents.AUTH_UPDATED, payload)
      this.handleJoinViaQSS()
    })

    // Handle errors from local or remote sources.
    authConnection.on('localError', error => {
      this.emit(Libp2pEvents.AUTH_LOCAL_ERROR, { error, connection })
    })
    authConnection.on('remoteError', error => {
      this.emit(Libp2pEvents.AUTH_REMOTE_ERROR, { error, connection })
    })

    // Store the auth connection and also the underlying libp2p connection
    this.authConnections.set(peerId.toString(), authConnection)
    this.peerConnections.set(peerId.toString(), connection)

    this.logger.info(`Auth connection established with ${peerId.toString()}`)
    authConnection.start()
  }

  private async onPeerDisconnected(peerId: PeerId) {
    if (this.authConnections.has(peerId.toString())) {
      this.logger.warn(`Auth connection with ${peerId.toString()} was disconnected`)
      this.closeAuthConnection(peerId, false)
    }

    if (this.joinStatus === JoinStatus.JOINED) {
      return
    }

    /**
     * We need to manually reset the join status in the case where the status is stuck on an intermediate state like
     * JOINING when disconnecting (for example this can happen when the user you are connecting to doesn't have your
     * information in their chain yet resulting in an invalid device error)
     */
    const oldJoinStatus = this.joinStatus
    if (this.sigChainService.activeChainTeamName == null) {
      this.joinStatus = JoinStatus.NOT_STARTED
    } else if (this.joinedViaQSS(this.sigChainService.team.id)) {
      this.joinStatus = JoinStatus.PENDING_MEMBER
    } else {
      this.joinStatus = JoinStatus.PENDING
    }
    this.logger.debug('Reset join status on disconnect', oldJoinStatus, this.joinStatus)
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
      this.unblockConnections(this.bufferedConnections)
      this.emit(Libp2pEvents.AUTH_JOINED)
      await this.sigChainService.saveChain(this.sigChainService.team.teamName)
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
