import { jest } from '@jest/globals'
import { SigChain } from './sigchain'
import { QSSAuthConnection } from '../qss/qss-auth-conn'
import { CommunityOperationStatus, WebsocketEvents } from '../qss/qss.types'
import { Libp2pAuth } from '../libp2p/libp2p.auth'
import { Libp2pState } from '../libp2p/libp2p.service'

describe('device admission transport continuations', () => {
  it('re-signs into QSS with the admitted device before normal auth restarts', async () => {
    const completed = SigChain.create({ name: 'existing user' })
    const socket = { active: true, connected: true }
    const sigchains = {
      activeChainTeamId: completed.team!.id,
      getActiveChain: () => completed,
      completeDeviceAdmission: (_pending: SigChain, _payload: unknown, retire: () => void) => {
        retire()
        return { selected: true, completion: Promise.resolve(completed) }
      },
    }
    const qssClient = {
      getClientSocket: jest.fn(() => socket),
      sendMessage: jest.fn(async () => ({ status: CommunityOperationStatus.SUCCESS })),
      off: jest.fn(),
      on: jest.fn(),
    }
    const connection = new QSSAuthConnection(sigchains as any, qssClient as any)
    connection.teamId = completed.team!.id
    const lfa = { stop: jest.fn() }
    ;(connection as any)._authConnection = lfa
    ;(connection as any)._clientSocket = socket
    const start = jest.spyOn(connection, 'start').mockResolvedValue()

    await (connection as any)._handleDeviceJoined(completed, lfa, {
      team: completed.team,
      user: completed.user,
    })

    expect(lfa.stop).toHaveBeenCalledWith(true)
    expect(qssClient.sendMessage).toHaveBeenCalledWith(
      WebsocketEvents.SIGN_IN_COMMUNITY,
      expect.objectContaining({
        payload: {
          teamId: completed.team!.id,
          userId: completed.user.userId,
          deviceId: completed.device.deviceId,
        },
      }),
      true
    )
    expect(start).toHaveBeenCalledTimes(1)
  })

  it('does not restart QSS auth if the socket changes during sign-in', async () => {
    const completed = SigChain.create()
    const socket = { active: true, connected: true }
    let currentSocket: typeof socket | undefined = socket
    let release!: () => void
    const ack = new Promise<{ status: CommunityOperationStatus }>(resolve => {
      release = () => resolve({ status: CommunityOperationStatus.SUCCESS })
    })
    const sigchains = {
      getActiveChain: () => completed,
      completeDeviceAdmission: (_pending: SigChain, _payload: unknown, retire: () => void) => {
        retire()
        return { selected: true, completion: Promise.resolve(completed) }
      },
    }
    const qssClient = {
      getClientSocket: jest.fn(() => currentSocket),
      sendMessage: jest.fn(async () => ack),
      off: jest.fn(),
      on: jest.fn(),
    }
    const connection = new QSSAuthConnection(sigchains as any, qssClient as any)
    connection.teamId = completed.team!.id
    const lfa = { stop: jest.fn() }
    ;(connection as any)._authConnection = lfa
    ;(connection as any)._clientSocket = socket
    const start = jest.spyOn(connection, 'start').mockResolvedValue()
    const continuation = (connection as any)._handleDeviceJoined(completed, lfa, {
      team: completed.team,
      user: completed.user,
    })
    await Promise.resolve()
    currentSocket = undefined
    release()
    await continuation
    expect(start).not.toHaveBeenCalled()
  })

  it('queues a normal P2P redial only while libp2p remains active', async () => {
    const completed = SigChain.create()
    let releaseCompletion!: () => void
    const completion = new Promise<SigChain>(resolve => (releaseCompletion = () => resolve(completed)))
    const sigchains = {
      activeChainTeamId: completed.team!.id,
      getActiveChain: () => completed,
      completeDeviceAdmission: (_pending: SigChain, _payload: unknown, retire: () => void) => {
        retire()
        return { selected: true, completion }
      },
    }
    const libp2p = {
      state: Libp2pState.Started,
      emit: jest.fn(),
      redialPeerAfterDelay: jest.fn(async () => undefined),
    }
    const qss = { once: jest.fn(), joinStatus: jest.fn() }
    const auth = new Libp2pAuth(sigchains as any, qss as any, libp2p as any, {} as any)
    const peerId = { toString: () => 'peer' }
    const lfa = { stop: jest.fn() }
    const transport = {
      remoteAddr: { toString: () => '/ip4/127.0.0.1/tcp/1/p2p/peer' },
      close: async () => undefined,
    }
    ;(auth as any).authConnections.set('peer', lfa)
    ;(auth as any).peerConnections.set('peer', transport)

    const continuation = (auth as any).handleDeviceJoined(
      completed,
      lfa,
      {
        team: completed.team,
        user: completed.user,
      },
      peerId,
      transport
    )
    const unblock = jest.spyOn(auth as any, 'unblockConnections')
    await Promise.resolve()
    libp2p.state = Libp2pState.Paused
    releaseCompletion()
    await continuation
    expect(lfa.stop).toHaveBeenCalledWith(false)
    expect(unblock).not.toHaveBeenCalled()
    expect(libp2p.redialPeerAfterDelay).not.toHaveBeenCalled()
    clearInterval((auth as any).unblockInterval)
  })
})
