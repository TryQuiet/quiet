import { Libp2pState } from './libp2p.service'
import { jest } from '@jest/globals'
import EventEmitter from 'node:events'
import waitForExpect from 'wait-for-expect'
import type { Connection, PeerId } from '@libp2p/interface'

import type { UserWithSecrets } from '../../../../../3rd-party/auth/packages/auth/dist'
import { SigChain } from '../auth/sigchain'
import type { SigChainService } from '../auth/sigchain.service'
import type { QSSService } from '../qss/qss.service'
import { QSSEvents } from '../qss/qss.types'
import { JoinStatus, Libp2pAuth, type Libp2pAuthComponents } from './libp2p.auth'
import type { Libp2pService } from './libp2p.service'
import { LFAEvents } from '../auth/types'
import { Libp2pEvents } from './libp2p.types'
import { AdmissionKind, AdmissionTransport } from '../admission/admission.types'
import { createAdmissionAuthContext } from '../admission/admission-auth-context'
import { AdmissionResourceScope } from '../admission/admission-resource-scope'
import { AUTH_STREAM_TIMEOUT_MS } from './libp2p.const'

describe('Libp2pAuth buffered connections', () => {
  const teamId = 'pending-device-team'
  const userId = 'pending-device-user'
  let auth: Libp2pAuth
  let pendingChain: SigChain
  let sigChainService: SigChainService
  let qssService: QSSService
  let libp2pEvents: EventEmitter
  let redialPeers: jest.Mock<() => Promise<void>>

  const peerId = (id: string): PeerId =>
    ({
      toString: () => id,
    }) as PeerId

  // Auth sessions are keyed per transport, so every connection needs its own id.
  let authEvents: EventTarget
  let connectionSequence = 0
  const connection = (id: string, status: Connection['status'] = 'open'): Connection =>
    ({
      id: `${id}#${++connectionSequence}`,
      direction: 'inbound',
      remotePeer: peerId(id),
      status,
      newStream: jest
        .fn<() => Promise<never>>()
        .mockRejectedValue(new Error('No transport needed for state-machine test')),
    }) as unknown as Connection

  /** The session for a peer's current transport. */
  const authFor = (peer: PeerId | string) => {
    const target = peer.toString()
    for (const [id, conn] of auth['peerConnections'].entries()) {
      if (conn.remotePeer.toString() === target) return auth['authConnections'].get(id)
    }
    return undefined
  }
  const hasAuthFor = (peer: PeerId | string) => authFor(peer) != null

  beforeEach(() => {
    pendingChain = SigChain.createFromDeviceInvite({
      seed: 'pending-device-seed',
      userName: 'alice',
      deviceName: 'phone',
      expectedTeamId: teamId,
      expectedUserId: userId,
    })
    sigChainService = {
      activeChainTeamId: teamId,
      getActiveChain: () => pendingChain,
      setActiveChain: jest.fn(),
      saveChain: jest.fn<() => Promise<void>>().mockResolvedValue(),
      hasAdmissionPersistenceBarrier: jest.fn().mockReturnValue(false),
    } as unknown as SigChainService
    qssService = Object.assign(new EventEmitter(), {
      joinStatus: jest.fn().mockReturnValue(JoinStatus.NOT_STARTED),
    }) as unknown as QSSService
    redialPeers = jest.fn<() => Promise<void>>().mockResolvedValue()
    libp2pEvents = Object.assign(new EventEmitter(), {
      redialPeers,
    })
    authEvents = new EventTarget()
    const components = {
      registrar: {
        unhandle: jest.fn<() => Promise<void>>().mockResolvedValue(),
        unregister: jest.fn(),
      },
      // 10.0.0 retires auth sessions from libp2p 'connection:close' events.
      events: authEvents,
      connectionManager: {
        getConnections: jest.fn(() => []),
      },
    } as unknown as Libp2pAuthComponents

    auth = new Libp2pAuth(sigChainService, qssService, libp2pEvents as unknown as Libp2pService, components)
  })

  afterEach(async () => {
    await auth.stop()
    jest.useRealTimers()
  })

  it.each(['open', 'write', 'close'] as const)(
    'bounds a stalled authentication stream %s and drains its scope',
    async phase => {
      jest.useFakeTimers()
      const scope = new AdmissionResourceScope()
      const fail = jest.fn()
      const { context } = createAdmissionAuthContext({
        attemptId: 1,
        request: {} as any,
        transport: AdmissionTransport.P2P,
        chain: pendingChain,
        submit: jest.fn() as any,
        fail,
        scope,
      })
      let finishOpen!: (stream: any) => void
      const stream = {
        status: 'open',
        sink: jest.fn(async () => (phase === 'write' ? await new Promise<void>(() => {}) : undefined)),
        close: jest.fn(async () => (phase === 'close' ? await new Promise<void>(() => {}) : undefined)),
        abort: jest.fn(),
      }
      const peer = peerId('stalled-peer')
      const connection = {
        id: 'stalled-connection',
        remotePeer: peer,
        status: 'open',
        newStream: jest.fn(async () =>
          phase === 'open'
            ? await new Promise(resolve => {
                finishOpen = resolve
              })
            : stream
        ),
      } as any
      auth['peerConnections'].set(connection.id, connection)
      auth['authConnections'].set(connection.id, { stop: jest.fn(), removeAllListeners: jest.fn() } as any)
      const sending = context.gate.run(() => auth['sendMessage'](connection, new Uint8Array([1]), context))
      for (let i = 0; i < 20; i++) await Promise.resolve()
      jest.advanceTimersByTime(AUTH_STREAM_TIMEOUT_MS)
      await sending
      await scope.drain(new Error('finished'))
      expect(fail).toHaveBeenCalledWith(expect.objectContaining({ kind: 'transport' }))
      if (phase === 'open') {
        finishOpen(stream)
        for (let i = 0; i < 5; i++) await Promise.resolve()
        expect(stream.sink).not.toHaveBeenCalled()
      }
      expect(stream.abort).toHaveBeenCalledTimes(1)
    }
  )

  it('aborts a pending stream allocation when its admission scope is revoked', async () => {
    const scope = new AdmissionResourceScope()
    const fail = jest.fn()
    const { context } = createAdmissionAuthContext({
      attemptId: 1,
      request: {} as any,
      transport: AdmissionTransport.P2P,
      chain: pendingChain,
      submit: jest.fn() as any,
      fail,
      scope,
    })
    let signal!: AbortSignal
    const peer = peerId('cancelled-peer')
    const connection = {
      id: 'cancelled-connection',
      remotePeer: peer,
      status: 'open',
      newStream: jest.fn((_protocol: string, options: { signal: AbortSignal }) => {
        signal = options.signal
        return new Promise(() => {})
      }),
    } as any
    auth['peerConnections'].set(connection.id, connection)
    auth['authConnections'].set(connection.id, { stop: jest.fn(), removeAllListeners: jest.fn() } as any)
    const sending = context.gate.run(() => auth['sendMessage'](connection, new Uint8Array([1]), context))
    for (let i = 0; i < 5; i++) await Promise.resolve()
    await scope.drain(new Error('cancel admission'))
    await sending
    expect(signal.aborted).toBe(true)
    expect(fail).not.toHaveBeenCalled()
  })

  it('restores PENDING_MEMBER when an active chain appears without the member role', async () => {
    auth['joinStatus'] = JoinStatus.NOT_STARTED
    jest.spyOn(sigChainService, 'getActiveChain').mockReturnValue({
      team: { id: teamId },
      roles: { amIMemberOfRole: jest.fn().mockReturnValue(false) },
    } as any)

    await auth['drainBufferedConnections']()

    expect(auth['joinStatus']).toBe(JoinStatus.PENDING_MEMBER)
  })

  it.each([Libp2pState.Paused, Libp2pState.Stopping, Libp2pState.Stopped])(
    'does not allocate auth connections while the service is %s',
    async state => {
      ;(libp2pEvents as any).state = state
      const peer = peerId('late-peer')
      await auth['onPeerConnected'](peer, connection(peer.toString()))
      expect(auth['authConnections'].size).toBe(0)
    }
  )

  it('does not start joining through a closed peer connection', async () => {
    const closedPeer = peerId('closed-peer')

    await auth['onPeerConnected'](closedPeer, connection(closedPeer.toString(), 'closed'))

    expect(auth['joinStatus']).toBe(JoinStatus.PENDING)
    expect(hasAuthFor(closedPeer)).toBe(false)
  })

  it('resumes every open buffered peer immediately after QSS admission', async () => {
    const admittingPeer = peerId('admitting-peer')
    const bufferedPeerA = peerId('buffered-peer-a')
    const closedBufferedPeer = peerId('closed-buffered-peer')
    const bufferedPeerB = peerId('buffered-peer-b')

    await auth['onPeerConnected'](admittingPeer, connection(admittingPeer.toString()))
    await auth['onPeerConnected'](bufferedPeerA, connection(bufferedPeerA.toString()))
    await auth['onPeerConnected'](closedBufferedPeer, connection(closedBufferedPeer.toString(), 'closed'))
    await auth['onPeerConnected'](bufferedPeerB, connection(bufferedPeerB.toString()))

    expect(auth['joinStatus']).toBe(JoinStatus.JOINING)
    // The closed transport is refused outright, so only the two open ones buffer.
    expect(auth['bufferedConnections']).toHaveLength(2)

    const admittedTeam = {
      id: teamId,
      hasDevice: jest.fn().mockReturnValue(true),
      memberHasRole: jest.fn().mockReturnValue(true),
      on: jest.fn(),
      removeListener: jest.fn(),
    }
    pendingChain.completeInvitation(
      admittedTeam as any,
      {
        userId,
        userName: 'alice',
      } as UserWithSecrets
    )
    qssService.emit(QSSEvents.QSS_AUTH_JOINED, teamId)

    await waitForExpect(() => {
      expect(auth['bufferedConnections']).toHaveLength(0)
      expect(hasAuthFor(admittingPeer)).toBe(true)
      expect(hasAuthFor(bufferedPeerA)).toBe(true)
      expect(hasAuthFor(bufferedPeerB)).toBe(true)
      expect(hasAuthFor(closedBufferedPeer)).toBe(false)
      expect(auth['joinStatus']).toBe(JoinStatus.JOINED)
    })
  })

  it('advances to the next buffered peer after the active admission peer fails', async () => {
    const failingPeer = peerId('failing-peer')
    const fallbackPeer = peerId('fallback-peer')
    const failingConnection = connection(failingPeer.toString())

    await auth['onPeerConnected'](failingPeer, failingConnection)
    await auth['onPeerConnected'](fallbackPeer, connection(fallbackPeer.toString()))
    const failingAuth = authFor(failingPeer)!

    failingAuth.emit(LFAEvents.LOCAL_ERROR, new Error('peer failed') as any)

    await waitForExpect(() => {
      expect(hasAuthFor(failingPeer)).toBe(false)
      expect(hasAuthFor(fallbackPeer)).toBe(true)
      expect(auth['bufferedConnections']).toHaveLength(0)
      expect(auth['joinStatus']).toBe(JoinStatus.JOINING)
    })

    failingAuth.emit(LFAEvents.JOINED, {
      team: { id: teamId },
      user: { userId, userName: 'alice' },
    } as any)
    await new Promise<void>(resolve => setImmediate(resolve))
    expect(pendingChain.team).toBeNull()
  })

  it.each(['invalid candidate', 'persistence failed'])(
    'leaves %s settlement and teardown to the coordinator',
    async error => {
      const admittingPeer = peerId('admitting-peer')
      const submit = jest.fn(async () => {
        throw new Error(error)
      })
      const { context } = createAdmissionAuthContext({
        attemptId: 1,
        request: { kind: AdmissionKind.DEVICE } as any,
        transport: AdmissionTransport.P2P,
        chain: pendingChain.forkForAdmission(),
        submit,
        fail: jest.fn(),
        scope: new AdmissionResourceScope(),
      })
      ;(libp2pEvents as any).admissionContext = context
      await auth['onPeerConnected'](admittingPeer, connection(admittingPeer.toString()))
      const admittingAuth = authFor(admittingPeer)!
      admittingAuth.emit(LFAEvents.JOINED, { team: { id: teamId }, user: { userId } } as any)
      await new Promise<void>(resolve => setImmediate(resolve))
      expect(submit).toHaveBeenCalledTimes(1)
      expect(pendingChain.team).toBeNull()
      expect(redialPeers).not.toHaveBeenCalled()
      expect(auth['joinStatus']).not.toBe(JoinStatus.JOINED)
    }
  )

  it('advances to the next buffered peer when minimal auth disconnects with a remote error', async () => {
    const failingPeer = peerId('failing-peer')
    const fallbackPeer = peerId('fallback-peer')

    await auth['onPeerConnected'](failingPeer, connection(failingPeer.toString()))
    await auth['onPeerConnected'](fallbackPeer, connection(fallbackPeer.toString()))
    const failingAuth = authFor(failingPeer)!

    failingAuth.emit(LFAEvents.DISCONNECTED, {
      type: 'ERROR',
      payload: {
        type: 'INVITATION_PROOF_INVALID',
        message: 'Invitation was not accepted',
      },
    } as any)

    await waitForExpect(() => {
      expect(hasAuthFor(failingPeer)).toBe(false)
      expect(hasAuthFor(fallbackPeer)).toBe(true)
      expect(auth['bufferedConnections']).toHaveLength(0)
      expect(auth['joinStatus']).toBe(JoinStatus.JOINING)
    })
  })

  it('keeps advancing when an earlier failed peer disconnects during a fallback attempt', async () => {
    const firstFailingPeer = peerId('first-failing-peer')
    const secondFailingPeer = peerId('second-failing-peer')
    const admittingPeer = peerId('admitting-peer')

    await auth['onPeerConnected'](firstFailingPeer, connection(firstFailingPeer.toString()))
    await auth['onPeerConnected'](secondFailingPeer, connection(secondFailingPeer.toString()))
    await auth['onPeerConnected'](admittingPeer, connection(admittingPeer.toString()))
    const firstFailingAuth = authFor(firstFailingPeer)!

    firstFailingAuth.emit(LFAEvents.DISCONNECTED, {
      type: 'ERROR',
      payload: { type: 'INVITATION_PROOF_INVALID', message: 'Invitation was not accepted' },
    } as any)

    await waitForExpect(() => {
      expect(hasAuthFor(secondFailingPeer)).toBe(true)
      expect(auth['joinStatus']).toBe(JoinStatus.JOINING)
    })

    await auth['onPeerDisconnected'](firstFailingPeer)
    expect(auth['joinStatus']).toBe(JoinStatus.JOINING)

    const secondFailingAuth = authFor(secondFailingPeer)!
    secondFailingAuth.emit(LFAEvents.DISCONNECTED, {
      type: 'ERROR',
      payload: { type: 'INVITATION_PROOF_INVALID', message: 'Invitation was not accepted' },
    } as any)

    await waitForExpect(() => {
      expect(hasAuthFor(secondFailingPeer)).toBe(false)
      expect(hasAuthFor(admittingPeer)).toBe(true)
      expect(auth['bufferedConnections']).toHaveLength(0)
      expect(auth['joinStatus']).toBe(JoinStatus.JOINING)
    })
  })

  it.each(['error', 'disconnect'])('retries failed peers only after the round ends with %s', async ending => {
    const failingPeer = peerId('failing-peer')
    const fallbackPeer = peerId('fallback-peer')

    await auth['onPeerConnected'](failingPeer, connection(failingPeer.toString()))
    await auth['onPeerConnected'](fallbackPeer, connection(fallbackPeer.toString()))
    await auth['onPeerConnected'](peerId('closed-peer'), connection('closed-peer', 'closed'))
    const failingAuth = authFor(failingPeer)!
    failingAuth.emit(LFAEvents.REMOTE_ERROR, new Error('peer rejected invitation') as any)

    await waitForExpect(() => {
      expect(auth['joinStatus']).toBe(JoinStatus.JOINING)
      expect(hasAuthFor(failingPeer)).toBe(false)
      expect(hasAuthFor(fallbackPeer)).toBe(true)
    })

    await auth['onPeerConnected'](failingPeer, connection(failingPeer.toString()))
    expect(hasAuthFor(failingPeer)).toBe(false)
    expect(redialPeers).not.toHaveBeenCalled()

    // Reconnect during redial to verify eligibility is restored before dialing starts.
    redialPeers.mockImplementation(async () => {
      await auth['onPeerConnected'](failingPeer, connection(failingPeer.toString()))
    })
    if (ending === 'error') {
      authFor(fallbackPeer)!.emit(LFAEvents.REMOTE_ERROR, new Error('rejected') as any)
    } else {
      await auth['onPeerDisconnected'](fallbackPeer)
    }

    await waitForExpect(() => {
      expect(redialPeers).toHaveBeenCalledTimes(1)
      expect(hasAuthFor(failingPeer)).toBe(true)
      expect(hasAuthFor(fallbackPeer)).toBe(false)
      expect(auth['bufferedConnections']).toHaveLength(0)
    })
    expect(authFor(failingPeer)).not.toBe(failingAuth)
    expect(auth['joinStatus']).toBe(JoinStatus.JOINING)

    failingAuth.emit(LFAEvents.REMOTE_ERROR, new Error('late error from previous round') as any)
    await new Promise<void>(resolve => setImmediate(resolve))
    expect(redialPeers).toHaveBeenCalledTimes(1)
    expect(hasAuthFor(failingPeer)).toBe(true)
  })

  it('retries only the rejecting peer while another candidate transport is still connecting', async () => {
    const rejectingPeer = peerId('rejecting-peer')
    const slowerPeer = peerId('slower-peer')
    await auth['onPeerConnected'](rejectingPeer, connection(rejectingPeer.toString()))
    authFor(rejectingPeer)!.emit(LFAEvents.REMOTE_ERROR, new Error('invitation not known yet') as any)

    await waitForExpect(() => {
      expect(redialPeers).toHaveBeenCalledWith(undefined, { onlyPeerIds: new Set(['rejecting-peer']) })
    })
    // The slower transport can finish without being torn down by that retry.
    await auth['onPeerConnected'](slowerPeer, connection(slowerPeer.toString()))
    expect(hasAuthFor(slowerPeer)).toBe(true)
    expect(auth['joinStatus']).toBe(JoinStatus.JOINING)
  })

  it('allows a single available peer to participate in successive admission rounds', async () => {
    const peer = peerId('only-peer')
    await auth['onPeerConnected'](peer, connection(peer.toString()))
    for (let round = 1; round <= 2; round++) {
      const previousAuth = authFor(peer)!
      previousAuth.emit(LFAEvents.LOCAL_ERROR, new Error('not ready yet') as any)
      await waitForExpect(() => {
        expect(redialPeers).toHaveBeenCalledTimes(round)
        expect(auth['joinStatus']).toBe(JoinStatus.PENDING)
      })
      await auth['onPeerConnected'](peer, connection(peer.toString()))
      expect(authFor(peer)).toBeDefined()
      expect(authFor(peer)).not.toBe(previousAuth)
      expect(auth['joinStatus']).toBe(JoinStatus.JOINING)
    }
  })

  it('advances to the next buffered peer when the active admission peer disconnects', async () => {
    const disconnectedPeer = peerId('disconnected-peer')
    const fallbackPeer = peerId('fallback-peer')

    await auth['onPeerConnected'](disconnectedPeer, connection(disconnectedPeer.toString()))
    await auth['onPeerConnected'](fallbackPeer, connection(fallbackPeer.toString()))
    await auth['onPeerDisconnected'](disconnectedPeer)

    expect(hasAuthFor(disconnectedPeer)).toBe(false)
    expect(hasAuthFor(fallbackPeer)).toBe(true)
    expect(auth['joinStatus']).toBe(JoinStatus.JOINING)
  })

  it('gives a reconnecting peer its own session and retires the closed transport', async () => {
    const reconnectingPeer = peerId('reconnecting-peer')
    const staleConnection = connection(reconnectingPeer.toString())
    auth['joinStatus'] = JoinStatus.JOINED

    await auth['onPeerConnected'](reconnectingPeer, staleConnection)
    const staleAuthConnection = auth['authConnections'].get(staleConnection.id)!
    const stopStaleAuthConnection = jest.spyOn(staleAuthConnection, 'stop')
    ;(staleConnection as { status: Connection['status'] }).status = 'closed'

    const replacementConnection = connection(reconnectingPeer.toString())
    await auth['onPeerConnected'](reconnectingPeer, replacementConnection)

    // LFA message numbers belong to a session, so the replacement transport gets
    // its own rather than feeding a fresh handshake into the retired one.
    const replacementAuthConnection = auth['authConnections'].get(replacementConnection.id)
    expect(replacementAuthConnection).toBeDefined()
    expect(replacementAuthConnection).not.toBe(staleAuthConnection)
    expect(auth['peerConnections'].get(replacementConnection.id)).toBe(replacementConnection)

    // The stale session is retired by its own close event. These tests drive the
    // service directly rather than through start(), so invoke its handler.
    auth['onConnectionClosed'](new CustomEvent('connection:close', { detail: staleConnection }))
    expect(stopStaleAuthConnection).toHaveBeenCalledTimes(1)
    expect(auth['authConnections'].has(staleConnection.id)).toBe(false)
  })

  it('does not persist a completed candidate while admission persistence is suspended', async () => {
    pendingChain.completeInvitation(
      {
        id: teamId,
        hasDevice: jest.fn().mockReturnValue(true),
        memberHasRole: jest.fn().mockReturnValue(true),
        on: jest.fn(),
        removeListener: jest.fn(),
      } as any,
      {
        userId,
        userName: 'alice',
      } as UserWithSecrets
    )
    jest.mocked(sigChainService.hasAdmissionPersistenceBarrier).mockReturnValue(true)

    await auth.afterStop()

    expect(sigChainService.saveChain).not.toHaveBeenCalled()
  })

  it('does not announce admission or unblock peers until candidate persistence completes', async () => {
    const admittingPeer = peerId('admitting-peer')
    let resolvePersistence!: () => void
    const persistence = new Promise<void>(resolve => {
      resolvePersistence = resolve
    })
    const joined = jest.fn()
    libp2pEvents.on(Libp2pEvents.AUTH_JOINED, joined)
    const { context, gate } = createAdmissionAuthContext({
      attemptId: 1,
      request: { kind: AdmissionKind.DEVICE } as any,
      transport: AdmissionTransport.P2P,
      chain: pendingChain.forkForAdmission(),
      submit: async candidate => {
        gate.freeze()
        await persistence
        gate.resume()
        return {
          teamId: candidate.teamId,
          userId: candidate.userId,
          deviceId: candidate.deviceId,
          transport: candidate.transport,
        }
      },
      fail: jest.fn(),
      scope: new AdmissionResourceScope(),
    })
    ;(libp2pEvents as any).admissionContext = context

    await auth['onPeerConnected'](admittingPeer, connection(admittingPeer.toString()))
    const admittingAuth = authFor(admittingPeer)!
    admittingAuth.emit(LFAEvents.JOINED, {
      team: {
        id: teamId,
        hasDevice: jest.fn().mockReturnValue(true),
        memberHasRole: jest.fn().mockReturnValue(true),
        on: jest.fn(),
        removeListener: jest.fn(),
      },
      user: {
        userId,
        userName: 'alice',
      } as UserWithSecrets,
    } as any)
    await new Promise<void>(resolve => setImmediate(resolve))

    expect(auth['joinStatus']).toBe(JoinStatus.JOINING)
    expect(pendingChain.team).toBeNull()
    expect(joined).not.toHaveBeenCalled()

    resolvePersistence()
    await waitForExpect(() => {
      expect(auth['joinStatus']).toBe(JoinStatus.JOINED)
      expect(joined).toHaveBeenCalledTimes(1)
    })
  })
})
