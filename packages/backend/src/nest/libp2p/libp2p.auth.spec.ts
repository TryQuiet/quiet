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
import type { AdmissionCandidate } from '../admission/admission.types'

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

  const connection = (id: string, status: Connection['status'] = 'open'): Connection =>
    ({
      direction: 'inbound',
      remotePeer: peerId(id),
      status,
      newStream: jest
        .fn<() => Promise<never>>()
        .mockRejectedValue(new Error('No transport needed for state-machine test')),
    }) as unknown as Connection

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
      completeAdmission: jest.fn(async (candidate: AdmissionCandidate) => ({
        teamId: candidate.teamId,
        userId: candidate.userId,
        deviceId: candidate.deviceId,
        transport: candidate.transport,
      })),
      redialPeers,
    })
    const components = {
      registrar: {
        unhandle: jest.fn<() => Promise<void>>().mockResolvedValue(),
        unregister: jest.fn(),
      },
    } as unknown as Libp2pAuthComponents

    auth = new Libp2pAuth(sigChainService, qssService, libp2pEvents as unknown as Libp2pService, components)
  })

  afterEach(async () => {
    await auth.stop()
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
    expect(auth['bufferedConnections']).toHaveLength(3)

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
      expect(auth['authConnections'].has(admittingPeer.toString())).toBe(true)
      expect(auth['authConnections'].has(bufferedPeerA.toString())).toBe(true)
      expect(auth['authConnections'].has(bufferedPeerB.toString())).toBe(true)
      expect(auth['authConnections'].has(closedBufferedPeer.toString())).toBe(false)
      expect(auth['joinStatus']).toBe(JoinStatus.JOINED)
    })
  })

  it('advances to the next buffered peer after the active admission peer fails', async () => {
    const failingPeer = peerId('failing-peer')
    const fallbackPeer = peerId('fallback-peer')
    const failingConnection = connection(failingPeer.toString())

    await auth['onPeerConnected'](failingPeer, failingConnection)
    await auth['onPeerConnected'](fallbackPeer, connection(fallbackPeer.toString()))
    const failingAuth = auth['authConnections'].get(failingPeer.toString())!

    failingAuth.emit(LFAEvents.LOCAL_ERROR, new Error('peer failed') as any)

    await waitForExpect(() => {
      expect(auth['authConnections'].has(failingPeer.toString())).toBe(false)
      expect(auth['authConnections'].has(fallbackPeer.toString())).toBe(true)
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

  it('advances to the next buffered peer when minimal auth disconnects with a remote error', async () => {
    const failingPeer = peerId('failing-peer')
    const fallbackPeer = peerId('fallback-peer')

    await auth['onPeerConnected'](failingPeer, connection(failingPeer.toString()))
    await auth['onPeerConnected'](fallbackPeer, connection(fallbackPeer.toString()))
    const failingAuth = auth['authConnections'].get(failingPeer.toString())!

    failingAuth.emit(LFAEvents.DISCONNECTED, {
      type: 'ERROR',
      payload: {
        type: 'INVITATION_PROOF_INVALID',
        message: 'Invitation was not accepted',
      },
    } as any)

    await waitForExpect(() => {
      expect(auth['authConnections'].has(failingPeer.toString())).toBe(false)
      expect(auth['authConnections'].has(fallbackPeer.toString())).toBe(true)
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
    const firstFailingAuth = auth['authConnections'].get(firstFailingPeer.toString())!

    firstFailingAuth.emit(LFAEvents.DISCONNECTED, {
      type: 'ERROR',
      payload: { type: 'INVITATION_PROOF_INVALID', message: 'Invitation was not accepted' },
    } as any)

    await waitForExpect(() => {
      expect(auth['authConnections'].has(secondFailingPeer.toString())).toBe(true)
      expect(auth['joinStatus']).toBe(JoinStatus.JOINING)
    })

    await auth['onPeerDisconnected'](firstFailingPeer)
    expect(auth['joinStatus']).toBe(JoinStatus.JOINING)

    const secondFailingAuth = auth['authConnections'].get(secondFailingPeer.toString())!
    secondFailingAuth.emit(LFAEvents.DISCONNECTED, {
      type: 'ERROR',
      payload: { type: 'INVITATION_PROOF_INVALID', message: 'Invitation was not accepted' },
    } as any)

    await waitForExpect(() => {
      expect(auth['authConnections'].has(secondFailingPeer.toString())).toBe(false)
      expect(auth['authConnections'].has(admittingPeer.toString())).toBe(true)
      expect(auth['bufferedConnections']).toHaveLength(0)
      expect(auth['joinStatus']).toBe(JoinStatus.JOINING)
    })
  })

  it('does not retry a peer that already failed the pending admission', async () => {
    const failingPeer = peerId('failing-peer')
    const fallbackPeer = peerId('fallback-peer')

    await auth['onPeerConnected'](failingPeer, connection(failingPeer.toString()))
    const failingAuth = auth['authConnections'].get(failingPeer.toString())!
    failingAuth.emit(LFAEvents.REMOTE_ERROR, new Error('peer rejected invitation') as any)

    await waitForExpect(() => {
      expect(auth['joinStatus']).toBe(JoinStatus.PENDING)
      expect(auth['authConnections'].has(failingPeer.toString())).toBe(false)
      expect(redialPeers).toHaveBeenCalledTimes(1)
    })

    await auth['onPeerConnected'](failingPeer, connection(failingPeer.toString()))
    expect(auth['authConnections'].has(failingPeer.toString())).toBe(false)
    expect(auth['bufferedConnections']).toHaveLength(0)

    await auth['onPeerConnected'](fallbackPeer, connection(fallbackPeer.toString()))
    expect(auth['authConnections'].has(fallbackPeer.toString())).toBe(true)
    expect(auth['joinStatus']).toBe(JoinStatus.JOINING)
  })

  it('advances to the next buffered peer when the active admission peer disconnects', async () => {
    const disconnectedPeer = peerId('disconnected-peer')
    const fallbackPeer = peerId('fallback-peer')

    await auth['onPeerConnected'](disconnectedPeer, connection(disconnectedPeer.toString()))
    await auth['onPeerConnected'](fallbackPeer, connection(fallbackPeer.toString()))
    await auth['onPeerDisconnected'](disconnectedPeer)

    expect(auth['authConnections'].has(disconnectedPeer.toString())).toBe(false)
    expect(auth['authConnections'].has(fallbackPeer.toString())).toBe(true)
    expect(auth['joinStatus']).toBe(JoinStatus.JOINING)
  })

  it('replaces a stale auth connection when the peer reconnects', async () => {
    const reconnectingPeer = peerId('reconnecting-peer')
    const staleConnection = connection(reconnectingPeer.toString())
    auth['joinStatus'] = JoinStatus.JOINED

    await auth['onPeerConnected'](reconnectingPeer, staleConnection)
    const staleAuthConnection = auth['authConnections'].get(reconnectingPeer.toString())!
    const stopStaleAuthConnection = jest.spyOn(staleAuthConnection, 'stop')
    ;(staleConnection as { status: Connection['status'] }).status = 'closed'

    const replacementConnection = connection(reconnectingPeer.toString())
    await auth['onPeerConnected'](reconnectingPeer, replacementConnection)

    expect(stopStaleAuthConnection).toHaveBeenCalledTimes(1)
    expect(auth['authConnections'].get(reconnectingPeer.toString())).not.toBe(staleAuthConnection)
    expect(auth['peerConnections'].get(reconnectingPeer.toString())).toBe(replacementConnection)
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
    jest.mocked((libp2pEvents as any).completeAdmission).mockImplementation(async (candidate: AdmissionCandidate) => {
      await persistence
      return {
        teamId: candidate.teamId,
        userId: candidate.userId,
        deviceId: candidate.deviceId,
        transport: candidate.transport,
      }
    })

    await auth['onPeerConnected'](admittingPeer, connection(admittingPeer.toString()))
    const admittingAuth = auth['authConnections'].get(admittingPeer.toString())!
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
    expect(joined).not.toHaveBeenCalled()

    resolvePersistence()
    await waitForExpect(() => {
      expect(auth['joinStatus']).toBe(JoinStatus.JOINED)
      expect(joined).toHaveBeenCalledTimes(1)
    })
  })
})
