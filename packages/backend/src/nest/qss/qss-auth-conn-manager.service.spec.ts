import { Test, TestingModule } from '@nestjs/testing'
import { type ModuleRef } from '@nestjs/core'
import { TestModule } from '../common/test.module'
import { QSSAuthConnectionManager } from './qss-auth-conn-manager.service'
import { QSSAuthConnection } from './qss-auth-conn'
import { QSSModule } from './qss.module'
import { QSSClient } from './qss.client'
import MockedSocket from 'socket.io-mock'
import { jest } from '@jest/globals'
import { type Socket as ClientSocket } from 'socket.io-client'
import { SigChainModule } from '../auth/sigchain.service.module'
import { SigChainService } from '../auth/sigchain.service'
import { JoinStatus } from '../libp2p/libp2p.auth'
import { QSS_ALLOWED } from '../const'
import { AuthSyncMessage, CommunityOperationStatus, QSSEvents, WebsocketEvents } from './qss.types'
import { QSS_AUTH_SYNC_PENDING_FRAME_LIMIT, QSSAuthConnStatus } from './qss.const'

describe('QSSAuthConnectionManager', () => {
  let module: TestingModule
  let qssAuthConnManager: QSSAuthConnectionManager
  let qssClient: QSSClient
  let sigchainService: SigChainService
  let socket: ClientSocket

  const username = 'testuser'
  const createDeferred = <T>() => {
    let resolve!: (value: T) => void
    const promise = new Promise<T>(res => {
      resolve = res
    })
    return { promise, resolve }
  }

  const createMockAuthConnection = (id: string): QSSAuthConnection =>
    ({
      id,
      teamId: undefined,
      active: true,
      on: jest.fn(),
      start: jest.fn(async (_teamName?: string) => {}),
      stop: jest.fn(),
      isForClientSocket: jest.fn(() => true),
      deliver: jest.fn(),
    }) as unknown as QSSAuthConnection

  const createMockSocket = (id: string): ClientSocket =>
    ({
      ...new MockedSocket(),
      id,
      connected: true,
      active: true,
      close: () => {},
      on: (_event: string, _callback: (...args: any[]) => void) => {},
      off: (_event: string, _callback: (...args: any[]) => void) => {},
      emit: (_event: string, _payload: any) => {},
    }) as any as ClientSocket

  const createAuthSyncMessage = (teamId: string, bytes: number[]): AuthSyncMessage => ({
    ts: Date.now(),
    status: CommunityOperationStatus.SUCCESS,
    payload: {
      userId: 'user-id',
      deviceId: 'device-id',
      teamId,
      message: Buffer.from(bytes).toString('base64'),
    },
  })

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [TestModule, QSSModule, SigChainModule],
      providers: [
        {
          provide: QSS_ALLOWED,
          useFactory: () => true,
        },
      ],
    }).compile()
    qssAuthConnManager = module.get<QSSAuthConnectionManager>(QSSAuthConnectionManager)
    qssClient = module.get<QSSClient>(QSSClient)
    socket = createMockSocket('socket-1')
    jest
      .spyOn(qssClient, 'createSocketAndConnect')
      .mockImplementation(async (_qssEndpoint: string | undefined): Promise<ClientSocket> => {
        // qssClient.clientSocket = socket
        return socket
      })
    jest.spyOn(qssClient, 'getClientSocket').mockImplementation((): ClientSocket | undefined => socket)
    sigchainService = module.get<SigChainService>(SigChainService)
    await sigchainService.createChain(true)
    await qssClient.createSocketAndConnect('')
  })

  afterEach(async () => {
    await module.close()
  })

  it('starts a new connection as owner and stores the connection in the connection map', async () => {
    await qssAuthConnManager.startNewConnection(sigchainService.activeChain.team!.id)
    const conn = qssAuthConnManager.getConnection(sigchainService.activeChain.team!.id)
    expect(conn).toBeDefined()
    expect(conn?.joinStatus).toBe(JoinStatus.JOINED)
    expect(conn?.active).toBeTruthy()
  })

  it(`doesn't start a new connection when an existing connection is in place`, async () => {
    await qssAuthConnManager.startNewConnection(sigchainService.activeChain.team!.id)
    const conn = qssAuthConnManager.getConnection(sigchainService.activeChain.team!.id)
    expect(conn).toBeDefined()
    expect(conn?.joinStatus).toBe(JoinStatus.JOINED)
    expect(conn?.active).toBeTruthy()

    await qssAuthConnManager.startNewConnection(sigchainService.activeChain.team!.id)
    const possiblyNewConn = qssAuthConnManager.getConnection(sigchainService.activeChain.team!.id)
    expect(possiblyNewConn).toBeDefined()
    expect(possiblyNewConn!.id).toEqual(conn!.id)
    expect(possiblyNewConn?.active).toBeTruthy()
  })

  it('coalesces overlapping starts for the same team while auth connection creation is in flight', async () => {
    const teamId = 'race-team-id'
    const moduleRef = (qssAuthConnManager as any).moduleRef as ModuleRef
    const createDeferredConnection = createDeferred<QSSAuthConnection>()
    const authConnection = createMockAuthConnection('race-auth-connection')
    const createSpy = jest.spyOn(moduleRef, 'create').mockReturnValue(createDeferredConnection.promise as any)

    const firstStart = qssAuthConnManager.startNewConnection(teamId)
    expect(createSpy).toHaveBeenCalledTimes(1)
    expect(qssAuthConnManager.getConnection(teamId)).toBeUndefined()

    const secondStart = qssAuthConnManager.startNewConnection(teamId)
    expect(createSpy).toHaveBeenCalledTimes(1)
    expect(qssAuthConnManager.getConnection(teamId)).toBeUndefined()

    createDeferredConnection.resolve(authConnection)
    await Promise.all([firstStart, secondStart])

    expect(createSpy).toHaveBeenCalledTimes(1)
    expect(authConnection.teamId).toBe(teamId)
    expect(authConnection.start).toHaveBeenCalledTimes(1)
    expect(authConnection.start).toHaveBeenCalledWith()
    expect(qssAuthConnManager.getConnection(teamId)).toBe(authConnection)
  })

  it('buffers auth sync frames until the team connection is initialized, then drains them in order', async () => {
    const teamId = 'buffered-team-id'
    const moduleRef = (qssAuthConnManager as any).moduleRef as ModuleRef
    const createDeferredConnection = createDeferred<QSSAuthConnection>()
    const authConnection = createMockAuthConnection('buffered-auth-connection')
    jest.spyOn(moduleRef, 'create').mockReturnValue(createDeferredConnection.promise as any)

    const startPromise = qssAuthConnManager.startNewConnection(teamId)
    qssClient.emit(WebsocketEvents.AUTH_SYNC, createAuthSyncMessage(teamId, [1, 2]))
    qssClient.emit(WebsocketEvents.AUTH_SYNC, createAuthSyncMessage(teamId, [3, 4]))

    expect(authConnection.deliver).not.toHaveBeenCalled()

    createDeferredConnection.resolve(authConnection)
    await startPromise

    expect(authConnection.deliver).toHaveBeenCalledTimes(2)
    expect(Array.from((authConnection.deliver as jest.Mock).mock.calls[0][0] as Uint8Array)).toEqual([1, 2])
    expect(Array.from((authConnection.deliver as jest.Mock).mock.calls[1][0] as Uint8Array)).toEqual([3, 4])
  })

  it('bounds the pending auth sync frame buffer and drops the oldest frame', async () => {
    const teamId = 'bounded-buffer-team-id'
    const moduleRef = (qssAuthConnManager as any).moduleRef as ModuleRef
    const createDeferredConnection = createDeferred<QSSAuthConnection>()
    const authConnection = createMockAuthConnection('bounded-buffer-auth-connection')
    jest.spyOn(moduleRef, 'create').mockReturnValue(createDeferredConnection.promise as any)

    const startPromise = qssAuthConnManager.startNewConnection(teamId)
    for (let i = 0; i <= QSS_AUTH_SYNC_PENDING_FRAME_LIMIT; i++) {
      qssClient.emit(WebsocketEvents.AUTH_SYNC, createAuthSyncMessage(teamId, [i]))
    }

    expect((qssAuthConnManager as any).pendingAuthSyncFrames).toHaveLength(QSS_AUTH_SYNC_PENDING_FRAME_LIMIT)

    createDeferredConnection.resolve(authConnection)
    await startPromise

    expect(authConnection.deliver).toHaveBeenCalledTimes(QSS_AUTH_SYNC_PENDING_FRAME_LIMIT)
    expect(Array.from((authConnection.deliver as jest.Mock).mock.calls[0][0] as Uint8Array)).toEqual([1])
  })

  it('does not drain auth sync frames buffered for a previous QSS client socket', async () => {
    const teamId = 'stale-socket-team-id'
    qssClient.emit(WebsocketEvents.AUTH_SYNC, createAuthSyncMessage(teamId, [1, 2, 3]))

    socket = createMockSocket('socket-2')
    const moduleRef = (qssAuthConnManager as any).moduleRef as ModuleRef
    const authConnection = createMockAuthConnection('new-socket-auth-connection')
    jest.spyOn(moduleRef, 'create').mockResolvedValue(authConnection)

    await qssAuthConnManager.startNewConnection(teamId)

    expect(authConnection.deliver).not.toHaveBeenCalled()
    expect((qssAuthConnManager as any).pendingAuthSyncFrames).toHaveLength(0)
  })

  it(`starts a replacement connection when the existing connection was stopped`, async () => {
    await qssAuthConnManager.startNewConnection(sigchainService.activeChain.team!.id)
    const conn = qssAuthConnManager.getConnection(sigchainService.activeChain.team!.id)
    expect(conn).toBeDefined()
    expect(conn?.joinStatus).toBe(JoinStatus.JOINED)
    expect(conn?.active).toBeTruthy()
    conn?.stop(false)
    expect(conn?.active).toBeFalsy()

    await qssAuthConnManager.startNewConnection(sigchainService.activeChain.team!.id)
    const possiblyNewConn = qssAuthConnManager.getConnection(sigchainService.activeChain.team!.id)
    expect(possiblyNewConn).toBeDefined()
    expect(possiblyNewConn!.id).not.toEqual(conn!.id)
    expect(possiblyNewConn?.active).toBeTruthy()
  })

  it(`starts a new connection when a connection is closed and removed`, async () => {
    await qssAuthConnManager.startNewConnection(sigchainService.activeChain.team!.id)
    const conn = qssAuthConnManager.getConnection(sigchainService.activeChain.team!.id)
    expect(conn).toBeDefined()
    expect(conn?.joinStatus).toBe(JoinStatus.JOINED)
    expect(conn?.active).toBeTruthy()
    qssAuthConnManager.stopConnection(sigchainService.activeChain.team!.id)
    expect(conn?.active).toBeFalsy()

    await qssAuthConnManager.startNewConnection(sigchainService.activeChain.team!.id)
    const possiblyNewConn = qssAuthConnManager.getConnection(sigchainService.activeChain.team!.id)
    expect(possiblyNewConn).toBeDefined()
    expect(possiblyNewConn?.joinStatus).toBe(JoinStatus.JOINED)
    expect(possiblyNewConn?.active).toBeTruthy()
    expect(possiblyNewConn!.id).not.toEqual(conn!.id)
  })

  it('closes and removes auth connections when the QSS client disconnects', async () => {
    await qssAuthConnManager.startNewConnection(sigchainService.activeChain.team!.id)
    const conn = qssAuthConnManager.getConnection(sigchainService.activeChain.team!.id)
    expect(conn).toBeDefined()
    expect(conn?.active).toBeTruthy()

    qssClient.emit(QSSEvents.QSS_DISCONNECTED)

    expect(qssAuthConnManager.getConnection(sigchainService.activeChain.team!.id)).toBeUndefined()
    expect(conn?.active).toBeFalsy()
  })

  it('marks a pending-member auth connection joined after member role self-assignment', () => {
    const conn = module.get<QSSAuthConnection>(QSSAuthConnection)
    conn.teamId = 'pending-member-team'
    // @ts-ignore - simulate the invitee path before QSSService self-assigns the member role.
    conn['_joinStatus'] = JoinStatus.PENDING_MEMBER

    conn.markMemberRoleReady()

    expect(conn.joinStatus).toBe(JoinStatus.JOINED)
  })

  it('delegates member role readiness to the stored auth connection', () => {
    const authConnection = {
      markMemberRoleReady: jest.fn(),
      stop: jest.fn(),
    }
    ;(qssAuthConnManager as any).authConnMap.set('team-id', authConnection)

    qssAuthConnManager.markMemberRoleReady('team-id')

    expect(authConnection.markMemberRoleReady).toHaveBeenCalledTimes(1)
  })

  it('replaces an active auth connection tied to a previous QSS client socket', async () => {
    await qssAuthConnManager.startNewConnection(sigchainService.activeChain.team!.id)
    const conn = qssAuthConnManager.getConnection(sigchainService.activeChain.team!.id)
    expect(conn).toBeDefined()
    expect(conn?.active).toBeTruthy()

    socket = createMockSocket('socket-2')

    await qssAuthConnManager.startNewConnection(sigchainService.activeChain.team!.id)
    const newConn = qssAuthConnManager.getConnection(sigchainService.activeChain.team!.id)

    expect(newConn).toBeDefined()
    expect(newConn!.id).not.toEqual(conn!.id)
    expect(newConn?.active).toBeTruthy()
    expect(conn?.active).toBeFalsy()
  })

  describe('QSSAuthConnection.deliver', () => {
    it('does not throw when auth connection is initialized but connection is not active', async () => {
      const teamId = sigchainService.activeChain.team!.id
      await qssAuthConnManager.startNewConnection(teamId)
      const conn = qssAuthConnManager.getConnection(teamId)
      expect(conn).toBeDefined()
      expect(conn?.active).toBeTruthy()

      // Simulate the race window: _authConnection is populated but connStatus has regressed.
      // Old deliver() guard checked `!this.active` and would throw here;
      // new guard only checks `_authConnection == null`.
      // @ts-ignore
      conn!['_connStatus'] = QSSAuthConnStatus.NOT_STARTED
      expect(conn?.active).toBeFalsy()
      // @ts-ignore
      expect(conn!['_authConnection']).not.toBeNull()

      // Must not throw — inner errors from the LFA layer are caught and logged by deliver()
      expect(() => conn!.deliver(new Uint8Array([1, 2, 3]))).not.toThrow()
    })

    it('throws when _authConnection has never been initialized', async () => {
      const teamId = sigchainService.activeChain.team!.id
      await qssAuthConnManager.startNewConnection(teamId)
      const conn = qssAuthConnManager.getConnection(teamId)
      expect(conn).toBeDefined()

      // Force _authConnection to null to simulate pre-init state
      // @ts-ignore
      conn!['_authConnection'] = undefined

      expect(() => conn!.deliver(new Uint8Array([1]))).toThrow('needs to be initialized')
    })

    it('sets connStatus to STARTING before _initNewConn is called during start', async () => {
      const teamId = sigchainService.activeChain.team!.id
      await qssAuthConnManager.startNewConnection(teamId)
      const conn = qssAuthConnManager.getConnection(teamId)
      expect(conn).toBeDefined()

      // Simulate an inactive connection while preserving _clientSocket so the manager
      // will call start() on the same instance rather than creating a new one.
      // (stop() clears _clientSocket which causes the manager to replace the conn.)
      // @ts-ignore
      conn!['_authConnection'] = undefined
      // @ts-ignore
      conn!['_connStatus'] = QSSAuthConnStatus.INACTIVE
      expect(conn?.active).toBeFalsy()

      let statusDuringInit: QSSAuthConnStatus | undefined
      const origInitNewConn = (conn as any)._initNewConn.bind(conn)
      jest.spyOn(conn as any, '_initNewConn').mockImplementation(async function (this: any, ...args: any[]) {
        statusDuringInit = this._connStatus
        return origInitNewConn(...args)
      })

      // Manager sees an inactive conn with the same socket and calls existingConn.start()
      await qssAuthConnManager.startNewConnection(teamId)

      expect(statusDuringInit).toBe(QSSAuthConnStatus.STARTING)
    })
  })
})
