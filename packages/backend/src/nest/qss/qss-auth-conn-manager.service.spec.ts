import { Test, TestingModule } from '@nestjs/testing'
import { TestModule } from '../common/test.module'
import { QSSAuthConnectionManager } from './qss-auth-conn-manager.service'
import { QSSModule } from './qss.module'
import { QSSClient } from './qss.client'
import MockedSocket from 'socket.io-mock'
import { jest } from '@jest/globals'
import { type Socket as ClientSocket } from 'socket.io-client'
import { SigChainModule } from '../auth/sigchain.service.module'
import { SigChainService } from '../auth/sigchain.service'
import { JoinStatus } from '../libp2p/libp2p.auth'
import { QSS_ALLOWED } from '../const'

describe('QSSAuthConnectionManager', () => {
  let module: TestingModule
  let qssAuthConnManager: QSSAuthConnectionManager
  let qssClient: QSSClient
  let sigchainService: SigChainService

  const teamName = 'foobar'
  const username = 'testuser'

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
    jest
      .spyOn(qssClient, 'createSocketAndConnect')
      .mockImplementation(async (_qssEndpoint: string | undefined): Promise<ClientSocket> => {
        const socket = {
          ...new MockedSocket(),
          close: () => {},
          on: (event: string, callback: (...args: any[]) => void) => {},
          emit: (event: string, payload: any) => {},
        } as any as ClientSocket
        qssClient.clientSocket = socket
        return socket
      })
    sigchainService = module.get<SigChainService>(SigChainService)
    await sigchainService.createChain(teamName, username, true)
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

  it(`restarts existing connection when a connection is in place but isn't active`, async () => {
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
    expect(possiblyNewConn!.id).toEqual(conn!.id)
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
})
