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

describe('Libp2pAuth buffered connections', () => {
  const teamId = 'pending-device-team'
  const userId = 'pending-device-user'
  let auth: Libp2pAuth
  let pendingChain: SigChain
  let qssService: QSSService

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
    const sigChainService = {
      activeChainTeamId: teamId,
      getActiveChain: () => pendingChain,
      setActiveChain: jest.fn(),
    } as unknown as SigChainService
    qssService = Object.assign(new EventEmitter(), {
      joinStatus: jest.fn().mockReturnValue(JoinStatus.NOT_STARTED),
    }) as unknown as QSSService
    const libp2pEvents = new EventEmitter() as unknown as Libp2pService
    const components = {
      registrar: {
        unhandle: jest.fn<() => Promise<void>>().mockResolvedValue(),
        unregister: jest.fn(),
      },
    } as unknown as Libp2pAuthComponents

    auth = new Libp2pAuth(sigChainService, qssService, libp2pEvents, components)
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
})
