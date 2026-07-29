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
    libp2pEvents = new EventEmitter()
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
    libp2pEvents.on(Libp2pEvents.ADMISSION_CANDIDATE, (candidate: AdmissionCandidate) => {
      candidate.deferUntilPersisted(persistence)
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
