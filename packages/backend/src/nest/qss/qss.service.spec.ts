import { Test, TestingModule } from '@nestjs/testing'
import { TestModule } from '../common/test.module'
import { QSSModule } from './qss.module'
import { QSSClient } from './qss.client'
import MockedSocket from 'socket.io-mock'
import { jest } from '@jest/globals'
import { Socket, type Socket as ClientSocket } from 'socket.io-client'
import { SigChainModule } from '../auth/sigchain.service.module'
import { SigChainService } from '../auth/sigchain.service'
import { QSSService } from './qss.service'
import {
  GeneratePublicKeysMessage,
  CreateCommunity,
  WebsocketEvents,
  CommunityOperationStatus,
  CreateCommunityStatus,
  CommunitySignInMessage,
  LogEntrySyncMessage,
  LogEntrySyncResponseMessage,
  LogEntryPullResponseMessage,
  QSSOperationResult,
  QSSEvents,
} from './qss.types'
import { createLogger } from '../common/logger'
import { Community, Identity, SocketActions, SocketEvents } from '@quiet/types'
import { getReduxStoreFactory, prepareStore, Store } from '@quiet/state-manager'
import { FactoryGirl } from 'factory-girl'
import { DateTime } from 'luxon'
import { createKeyset, redactKeys } from '../../../../../3rd-party/auth/packages/crdx/dist'
import { randomBytes } from 'crypto'
import waitForExpect from 'wait-for-expect'
import * as uint8arrays from 'uint8arrays'
import { JoinStatus } from '../libp2p/libp2p.auth'
import { OrbitDbService } from '../storage/orbitDb/orbitDb.service'
import { Libp2pService } from '../libp2p/libp2p.service'
import { IpfsService } from '../ipfs/ipfs.service'
import { LocalDbService } from '../local-db/local-db.service'
import { LocalDbEvents } from '../local-db/local-db.types'
import { SocketService } from '../socket/socket.service'
import { Libp2pNodeParams } from '../libp2p/libp2p.types'
import { spawnLibp2pInstancesInMemory } from '../common/test-utils'
import * as fs from 'fs'
import { EventsType } from '@orbitdb/core'
import { EventsWithStorage } from '../storage/orbitDb/eventsWithStorage'
import { MessagesAccessController } from '../storage/channels/messages/orbitdb/MessagesAccessController'
import { EncryptedAndSignedPayload, EncryptionScopeType } from '../auth/services/crypto/types'
import { Base58 } from '@localfirst/auth'
import { RoleName } from '../auth/services/roles/roles'
import { IpfsFileManagerModule } from '../ipfs-file-manager/ipfs-file-manager.module'
import { IpfsModule } from '../ipfs/ipfs.module'
import { logEntryToLogUpdate } from '../storage/orbitDb/util'
import { OrbitDbModule } from '../storage/orbitDb/orbitdb.module'
import { QSSAuthConnectionManager } from './qss-auth-conn-manager.service'
import { QSSAuthConnection } from './qss-auth-conn'
import { QSS_RECONNECT_BACKOFF_FACTOR, QSS_RECONNECT_DELAY_MS, QSSAuthConnStatus } from './qss.const'

describe('QSSService', () => {
  let store: Store
  let factory: FactoryGirl
  let module: TestingModule
  let qssClient: QSSClient
  let qssService: QSSService
  let qssAuthConnManager: QSSAuthConnectionManager
  let socketService: SocketService
  let sigchainService: SigChainService
  let libp2pService: Libp2pService
  let ipfsService: IpfsService
  let orbitDbService: OrbitDbService
  let localDbService: LocalDbService
  let libp2pParams: Libp2pNodeParams
  let mockedCreateSocket: any
  let mockedGetSocket: any
  let mockedGetAuthConnection: any
  let mockedSendMessage: any
  let mockedJoinStatus: any
  let addPendingMessageSpy: any
  let mockedAllowed: any
  let community: Community
  let userIdentity: Identity
  let mockedCaptchaVerified: jest.SpiedGetter<any> | undefined
  let mockedCanConnect: jest.SpiedGetter<any> | undefined
  let mockedClientClose: jest.SpiedFunction<any> | undefined
  let socket: Socket | undefined

  const teamName = 'foobar'
  const username = 'testuser'
  const logger = createLogger('qss:service:test')
  const mockCaptchaVerification = () => {
    mockedCaptchaVerified?.mockRestore()
    mockedCaptchaVerified = jest.spyOn(qssClient, 'captchaVerified', 'get').mockReturnValue(true)
  }

  beforeEach(async () => {
    jest.clearAllMocks()
    store = prepareStore().store
    factory = await getReduxStoreFactory(store)

    module = await Test.createTestingModule({
      imports: [TestModule, SigChainModule, IpfsFileManagerModule, IpfsModule, OrbitDbModule, QSSModule],
    }).compile()
    qssService = module.get<QSSService>(QSSService)
    qssClient = module.get<QSSClient>(QSSClient)
    qssAuthConnManager = module.get<QSSAuthConnectionManager>(QSSAuthConnectionManager)
    socketService = module.get<SocketService>(SocketService)
    libp2pService = await module.resolve(Libp2pService)
    libp2pParams = (await spawnLibp2pInstancesInMemory([module]))[0]

    ipfsService = await module.resolve(IpfsService)
    await ipfsService.createInstance()

    localDbService = await module.resolve(LocalDbService)
    community = await factory.create('Community', {
      name: teamName,
    })
    userIdentity = await factory.create('Identity', {
      communityId: community.id,
      nickname: username,
    })
    sigchainService = module.get<SigChainService>(SigChainService)
    await sigchainService.createChain(community.name!, username, true)

    orbitDbService = await module.resolve(OrbitDbService)
    await orbitDbService.create(ipfsService.ipfsInstance!)

    mockedCreateSocket = jest
      .spyOn(qssClient, 'createSocketAndConnect')
      .mockImplementation(async (_qssEndpoint: string | undefined): Promise<ClientSocket> => {
        socket = {
          ...new MockedSocket(),
          close: () => {},
          on: (event: string, callback: (...args: any[]) => void) => {},
          emit: (event: string, payload: any) => {},
          connected: true,
          active: true,
        } as any as ClientSocket
        return socket
      })
    mockedGetSocket = jest.spyOn(qssClient, 'getClientSocket').mockImplementation((): ClientSocket | undefined => {
      return socket
    })
    mockedClientClose = jest.spyOn(qssClient, 'close').mockImplementation((): void => {
      socket = undefined
    })
  })

  afterEach(async () => {
    await orbitDbService?.stop()
    if (fs.existsSync(orbitDbService.orbitDbDir)) {
      fs.rmSync(orbitDbService.orbitDbDir, { recursive: true })
    }
    await ipfsService?.stop()
    await libp2pService?.close(true)
    await localDbService?.close()
    await module?.close()
    mockedCreateSocket.mockRestore()
    if (mockedSendMessage != null) {
      mockedSendMessage.mockRestore()
    }
    addPendingMessageSpy = null
    if (mockedAllowed != null) {
      mockedAllowed.mockRestore()
    }
    if (mockedJoinStatus != null) {
      mockedJoinStatus.mockRestore()
    }
    if (mockedCaptchaVerified != null) {
      mockedCaptchaVerified.mockRestore()
      mockedCaptchaVerified = undefined
    }
    if (mockedGetAuthConnection != null) {
      mockedGetAuthConnection.mockRestore()
      mockedGetAuthConnection = undefined
    }
    if (mockedCanConnect != null) {
      mockedCanConnect.mockRestore()
      mockedCanConnect = undefined
    }
  })

  interface InitCommunitySettings {
    qssEnabled: boolean
    qssSetup: boolean
  }
  const initCommunity = async (
    settings: InitCommunitySettings = { qssEnabled: true, qssSetup: false }
  ): Promise<Community> => {
    await localDbService.setCommunity({
      ...community,
      ...settings,
    })
    await localDbService.setCurrentCommunityId(community.id)

    await localDbService.setIdentity(userIdentity)

    return (await localDbService.getCurrentCommunity())!
  }

  const mockSuccessfulSignIn = (): void => {
    mockedGetAuthConnection = jest
      .spyOn(qssAuthConnManager, 'getConnection')
      .mockImplementation((_teamId: string): QSSAuthConnection => {
        return {
          active: true,
          joinStatus: JoinStatus.JOINED,
          connStatus: QSSAuthConnStatus.CONNECTED,
          on: (...args: any[]) => {},
          removeAllListeners: (...args: any[]) => {},
        } as any
      })

    mockedSendMessage = jest
      .spyOn(qssClient, 'sendMessage')
      .mockImplementation(
        async <T>(event: WebsocketEvents, payload: unknown, withAck = false): Promise<T | undefined> => {
          logger.debug('Sending event to QSS', event, payload, withAck)
          switch (event) {
            case WebsocketEvents.SIGN_IN_COMMUNITY:
              return {
                ts: DateTime.utc().toMillis(),
                status: CommunityOperationStatus.SUCCESS,
              } as T
            default:
              return undefined
          }
        }
      )
  }

  describe('connect', () => {
    it('connects to QSS when enabled and an endpoint string is provided', async () => {
      await initCommunity()
      mockedAllowed = jest.spyOn(qssService, 'qssAllowed', 'get').mockReturnValue(true)
      await qssService.connect('ws://localhost:3000')
      expect(qssService.connected).toBeTruthy()
      expect(qssService.canConnect).toBeTruthy()
    })

    it(`doesn't connect to QSS when not enabled and an endpoint string is provided`, async () => {
      await initCommunity()
      mockedAllowed = jest.spyOn(qssService, 'qssAllowed', 'get').mockReturnValue(false)
      await qssService.connect('ws://localhost:3000')
      expect(qssService.connected).toBeFalsy()
      expect(qssService.canConnect).toBeFalsy()
    })

    it(`doesn't connect to QSS when enabled but endpoint string is undefined`, async () => {
      await initCommunity()
      mockedAllowed = jest.spyOn(qssService, 'qssAllowed', 'get').mockReturnValue(true)
      await qssService.connect(undefined)
      expect(qssService.connected).toBeFalsy()
      expect(qssService.canConnect).toBeFalsy()
    })

    it(`doesn't connect to QSS when enabled but endpoint string is empty`, async () => {
      await initCommunity()
      mockedAllowed = jest.spyOn(qssService, 'qssAllowed', 'get').mockReturnValue(true)
      await qssService.connect('')
      expect(qssService.connected).toBeFalsy()
      expect(qssService.canConnect).toBeFalsy()
    })

    it('reconnects when the requested QSS endpoint changes', async () => {
      await initCommunity()
      mockedAllowed = jest.spyOn(qssService, 'qssAllowed', 'get').mockReturnValue(true)

      await qssService.connect('ws://localhost:3000')
      await qssService.connect('ws://localhost:3000')
      await qssService.connect('ws://localhost:3001')

      expect(mockedCreateSocket).toHaveBeenCalledTimes(2)
      expect(mockedCreateSocket).toHaveBeenNthCalledWith(1, 'ws://localhost:3000')
      expect(mockedCreateSocket).toHaveBeenNthCalledWith(2, 'ws://localhost:3001')
    })

    it('backs off reconnect attempts after failures and resets after success', async () => {
      await initCommunity()
      mockedAllowed = jest.spyOn(qssService, 'qssAllowed', 'get').mockReturnValue(true)
      mockedCreateSocket.mockRejectedValue(new Error('QSS unavailable'))

      const reconnectDelays: number[] = []
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout').mockImplementation(((
        _callback: () => void,
        delay?: number
      ) => {
        reconnectDelays.push(delay as number)
        return {} as NodeJS.Timeout
      }) as any)

      try {
        await qssService.connect('ws://localhost:3000')
        // @ts-ignore - clear scheduled reconnect to simulate the timer having fired
        qssService._reconnectQueueProcessor = undefined

        await qssService.connect('ws://localhost:3000')
        // @ts-ignore - clear scheduled reconnect to simulate the timer having fired
        qssService._reconnectQueueProcessor = undefined

        mockedCreateSocket.mockResolvedValue({} as ClientSocket)
        await qssService.connect('ws://localhost:3000')
        expect(reconnectDelays).toEqual([QSS_RECONNECT_DELAY_MS, QSS_RECONNECT_DELAY_MS * QSS_RECONNECT_BACKOFF_FACTOR])

        qssClient.emit(QSSEvents.QSS_DISCONNECTED)

        expect(reconnectDelays).toEqual([
          QSS_RECONNECT_DELAY_MS,
          QSS_RECONNECT_DELAY_MS * QSS_RECONNECT_BACKOFF_FACTOR,
          QSS_RECONNECT_DELAY_MS,
        ])
      } finally {
        setTimeoutSpy.mockRestore()
        // @ts-ignore - prevent cleanup from clearing a mocked timeout object
        qssService._reconnectQueueProcessor = undefined
        // @ts-ignore - reset private state in case the assertion above fails
        qssService._reconnectDelayMs = QSS_RECONNECT_DELAY_MS
      }
    })

    it('re-arms lifecycle handlers after close/resume without duplicates', async () => {
      await initCommunity()
      mockedAllowed = jest.spyOn(qssService, 'qssAllowed', 'get').mockReturnValue(true)
      mockedCanConnect = jest.spyOn(qssService, 'canConnect', 'get').mockReturnValue(true)
      const countHandler = (emitter: any, event: string, handler: (...args: any[]) => void): number => {
        return emitter.listeners(event).filter((listener: (...args: any[]) => void) => listener === handler).length
      }
      const expectLifecycleHandlers = (expected: number): void => {
        expect(countHandler(qssAuthConnManager, QSSEvents.QSS_AUTH_JOINED, qssService['_handleQssAuthJoined'])).toBe(
          expected
        )
        expect(countHandler(qssService, QSSEvents.QSS_START_AUTH_CONN, qssService['_handleStartAuthConnection'])).toBe(
          expected
        )
        expect(countHandler(socketService, SocketActions.HCAPTCHA_REQUEST, qssService['_handleHcaptchaRequest'])).toBe(
          expected
        )
        expect(countHandler(qssClient, QSSEvents.QSS_CAPTCHA_REQUIRED, qssService['_handleCaptchaRequired'])).toBe(
          expected
        )
        expect(countHandler(localDbService, LocalDbEvents.COMMUNITY_ADDED, qssService['_handleCommunityAdded'])).toBe(
          expected
        )
        expect(countHandler(qssClient, QSSEvents.QSS_CONNECTED, qssService['_handleQssConnected'])).toBe(expected)
        expect(countHandler(qssClient, QSSEvents.QSS_DISCONNECTED, qssService['_handleQssDisconnected'])).toBe(expected)
        expect(countHandler(qssClient, WebsocketEvents.LOG_ENTRY_SYNC, qssService['_handleLogEntrySync'])).toBe(
          expected
        )
        expect(countHandler(qssService, QSSEvents.QSS_HANDLE_SIGN_IN, qssService['_handleQssHandleSignIn'])).toBe(
          expected
        )
        expect(
          countHandler(qssAuthConnManager, QSSEvents.QSS_SELF_ASSIGN_MEMBER, qssService['_handleSelfAssignMember'])
        ).toBe(expected)
        expect(countHandler(sigchainService, 'updated', qssService['_handleSigChainUpdated'])).toBe(expected)
      }

      expectLifecycleHandlers(1)

      await qssService.resume()

      expectLifecycleHandlers(1)

      qssService.pause()

      expectLifecycleHandlers(0)

      await qssService.resume()

      expectLifecycleHandlers(1)

      await qssService.resume()

      expectLifecycleHandlers(1)
    })

    it('disconnects and reconnects on pause/resume', async () => {
      await initCommunity()
      mockedAllowed = jest.spyOn(qssService, 'qssAllowed', 'get').mockReturnValue(true)

      await qssService.connect('ws://localhost:3000')
      expect(qssService.connected).toBe(true)

      qssService.pause()
      expect(qssService.connected).toBe(false)

      await qssService.resume()
      expect(qssService.connected).toBe(true)
    })

    it('serializes concurrent connect requests without overlapping attempts', async () => {
      let resolveConnect: (() => void) | undefined
      let inFlightConnects = 0
      let maxInFlightConnects = 0
      let connectAttempts = 0
      const connectImplSpy = jest.spyOn(qssService as any, '_connectImpl').mockImplementation(async () => {
        connectAttempts += 1
        inFlightConnects += 1
        maxInFlightConnects = Math.max(maxInFlightConnects, inFlightConnects)
        if (connectAttempts === 1) {
          await new Promise<void>(resolve => {
            resolveConnect = resolve
          })
        }
        inFlightConnects -= 1
        return QSSOperationResult.SUCCESS
      })

      try {
        const firstConnect = qssService.connect('ws://localhost:3000')
        const secondConnect = qssService.connect('ws://localhost:3000')

        await waitForExpect(() => {
          expect(resolveConnect).toBeDefined()
        })

        expect(maxInFlightConnects).toBe(1)
        resolveConnect!()

        await expect(firstConnect).resolves.toBe(QSSOperationResult.SUCCESS)
        await expect(secondConnect).resolves.toBe(QSSOperationResult.SUCCESS)
        expect(maxInFlightConnects).toBe(1)
      } finally {
        connectImplSpy.mockRestore()
      }
    })
  })

  describe('createCommunity', () => {
    it(`creates a community on QSS`, async () => {
      await initCommunity()
      const initStatusOrig = await qssService.getQssInitStatus()
      expect(initStatusOrig.qssSetup).toBeFalsy()

      mockedSendMessage = jest
        .spyOn(qssClient, 'sendMessage')
        .mockImplementation(
          async <T>(event: WebsocketEvents, payload: unknown, withAck = false): Promise<T | undefined> => {
            logger.debug('Sending event to QSS', event, payload, withAck)
            switch (event) {
              case WebsocketEvents.GEN_PUB_KEYS:
                return {
                  ts: DateTime.utc().toMillis(),
                  status: CommunityOperationStatus.SUCCESS,
                  payload: {
                    teamId: sigchainService.team?.id,
                    keys: redactKeys(
                      createKeyset({ type: 'SERVER', name: 'localhost' }, randomBytes(32).toString('base64'))
                    ),
                  },
                } as T
              case WebsocketEvents.CREATE_COMMUNITY:
                return {
                  ts: DateTime.utc().toMillis(),
                  status: CreateCommunityStatus.SUCCESS,
                } as T
              default:
                return undefined
            }
          }
        )
      mockedAllowed = jest.spyOn(qssService, 'qssAllowed', 'get').mockReturnValue(true)
      await qssService.connect('ws://localhost:3000')
      expect(qssService.connected).toBeTruthy()
      expect(qssService.canConnect).toBeTruthy()

      mockCaptchaVerification()
      const created = await qssService.createCommunity(sigchainService.activeChain)
      await waitForExpect(() => {
        expect(mockedSendMessage).toHaveBeenNthCalledWith(
          1,
          WebsocketEvents.GEN_PUB_KEYS,
          expect.objectContaining({
            ts: expect.any(Number),
            status: CommunityOperationStatus.SENDING,
            payload: {
              teamId: sigchainService.team.id,
            },
          } as GeneratePublicKeysMessage),
          true
        )
      })
      await waitForExpect(() => {
        const serializedKeyring: Uint8Array = uint8arrays.fromString(
          JSON.stringify(sigchainService.activeChain.team?.teamKeyring()),
          'utf8'
        )
        expect(mockedSendMessage).toHaveBeenNthCalledWith(
          2,
          WebsocketEvents.CREATE_COMMUNITY,
          expect.objectContaining({
            ts: expect.any(Number),
            payload: {
              community: {
                teamId: sigchainService.team.id,
                sigChain: uint8arrays.toString(sigchainService.activeChain.save(), 'hex'),
              },
              userId: sigchainService.user.userId,
              teamKeyring: uint8arrays.toString(serializedKeyring, 'base64'),
            },
          } as CreateCommunity),
          true
        )
      })
      expect(mockedSendMessage.mock.calls.length).toBeGreaterThanOrEqual(2)
      expect(created).toBeTruthy()
      const initStatus = await qssService.getQssInitStatus()
      expect(initStatus.qssSetup).toBeTruthy()
    })

    it(`fails to create community when failing to generate server keys`, async () => {
      await initCommunity()
      const initStatusOrig = await qssService.getQssInitStatus()
      expect(initStatusOrig.qssSetup).toBeFalsy()

      mockedSendMessage = jest
        .spyOn(qssClient, 'sendMessage')
        .mockImplementation(
          async <T>(event: WebsocketEvents, payload: unknown, withAck = false): Promise<T | undefined> => {
            logger.debug('Sending event to QSS', event, payload, withAck)
            switch (event) {
              case WebsocketEvents.GEN_PUB_KEYS:
                return {
                  ts: DateTime.utc().toMillis(),
                  status: CommunityOperationStatus.ERROR,
                  reason: 'Failed to create server keys',
                } as T
              case WebsocketEvents.CREATE_COMMUNITY:
                return {
                  ts: DateTime.utc().toMillis(),
                  status: CreateCommunityStatus.SUCCESS,
                } as T
              default:
                return undefined
            }
          }
        )
      mockedAllowed = jest.spyOn(qssService, 'qssAllowed', 'get').mockReturnValue(true)
      await qssService.connect('ws://localhost:3000')
      expect(qssService.connected).toBeTruthy()
      expect(qssService.canConnect).toBeTruthy()

      mockCaptchaVerification()
      const created = await qssService.createCommunity(sigchainService.activeChain)
      await waitForExpect(() => {
        expect(mockedSendMessage).toHaveBeenNthCalledWith(
          1,
          WebsocketEvents.GEN_PUB_KEYS,
          expect.objectContaining({
            ts: expect.any(Number),
            status: CommunityOperationStatus.SENDING,
            payload: {
              teamId: sigchainService.team.id,
            },
          } as GeneratePublicKeysMessage),
          true
        )
      })
      expect(mockedSendMessage).toHaveBeenCalledTimes(1)
      expect(created).toBeFalsy()
      const initStatus = await qssService.getQssInitStatus()
      expect(initStatus.qssSetup).toBeFalsy()
    })

    it(`fails to create community when create community request fails`, async () => {
      await initCommunity()
      const initStatusOrig = await qssService.getQssInitStatus()
      expect(initStatusOrig.qssSetup).toBeFalsy()

      mockedSendMessage = jest
        .spyOn(qssClient, 'sendMessage')
        .mockImplementation(
          async <T>(event: WebsocketEvents, payload: unknown, withAck = false): Promise<T | undefined> => {
            logger.debug('Sending event to QSS', event, payload, withAck)
            switch (event) {
              case WebsocketEvents.GEN_PUB_KEYS:
                return {
                  ts: DateTime.utc().toMillis(),
                  status: CommunityOperationStatus.SUCCESS,
                  payload: {
                    teamId: sigchainService.team?.id,
                    keys: redactKeys(
                      createKeyset({ type: 'SERVER', name: 'localhost' }, randomBytes(32).toString('base64'))
                    ),
                  },
                } as T
              case WebsocketEvents.CREATE_COMMUNITY:
                return {
                  ts: DateTime.utc().toMillis(),
                  status: CreateCommunityStatus.ERROR,
                  reason: 'Failed to create community',
                } as T
              default:
                return undefined
            }
          }
        )
      mockedAllowed = jest.spyOn(qssService, 'qssAllowed', 'get').mockReturnValue(true)
      await qssService.connect('ws://localhost:3000')
      expect(qssService.connected).toBeTruthy()

      mockCaptchaVerification()
      const created = await qssService.createCommunity(sigchainService.activeChain)
      await waitForExpect(() => {
        expect(mockedSendMessage).toHaveBeenNthCalledWith(
          1,
          WebsocketEvents.GEN_PUB_KEYS,
          expect.objectContaining({
            ts: expect.any(Number),
            status: CommunityOperationStatus.SENDING,
            payload: {
              teamId: sigchainService.team.id,
            },
          } as GeneratePublicKeysMessage),
          true
        )
      })
      await waitForExpect(() => {
        const serializedKeyring: Uint8Array = uint8arrays.fromString(
          JSON.stringify(sigchainService.activeChain.team?.teamKeyring()),
          'utf8'
        )
        expect(mockedSendMessage).toHaveBeenNthCalledWith(
          2,
          WebsocketEvents.CREATE_COMMUNITY,
          expect.objectContaining({
            ts: expect.any(Number),
            payload: {
              community: {
                teamId: sigchainService.team.id,
                sigChain: uint8arrays.toString(sigchainService.activeChain.save(), 'hex'),
              },
              userId: sigchainService.user.userId,
              teamKeyring: uint8arrays.toString(serializedKeyring, 'base64'),
            },
          } as CreateCommunity),
          true
        )
      })
      expect(mockedSendMessage).toBeCalledTimes(2)
      expect(created).toBeFalsy()
      const initStatus = await qssService.getQssInitStatus()
      expect(initStatus.qssSetup).toBeFalsy()
    })

    it(`doesn't create a community when QSS is not connected`, async () => {
      await initCommunity()
      const initStatusOrig = await qssService.getQssInitStatus()
      expect(initStatusOrig.qssSetup).toBeFalsy()

      mockedSendMessage = jest
        .spyOn(qssClient, 'sendMessage')
        .mockImplementation(
          async <T>(event: WebsocketEvents, payload: unknown, withAck = false): Promise<T | undefined> => {
            logger.debug('Sending event to QSS', event, payload, withAck)
            switch (event) {
              case WebsocketEvents.GEN_PUB_KEYS:
                return {
                  ts: DateTime.utc().toMillis(),
                  payload: {
                    status: CommunityOperationStatus.SUCCESS,
                    payload: {
                      teamId: sigchainService.team?.id,
                      keys: redactKeys(
                        createKeyset({ type: 'SERVER', name: 'localhost' }, randomBytes(32).toString('base64'))
                      ),
                    },
                  },
                } as T
              case WebsocketEvents.CREATE_COMMUNITY:
                return {
                  ts: DateTime.utc().toMillis(),
                  status: CreateCommunityStatus.SUCCESS,
                } as T
              default:
                return undefined
            }
          }
        )
      mockedAllowed = jest.spyOn(qssService, 'canConnect', 'get').mockReturnValue(true)
      expect(qssService.connected).toBeFalsy()
      expect(qssService.canConnect).toBeTruthy()

      const created = await qssService.createCommunity(sigchainService.activeChain)
      const initStatus = await qssService.getQssInitStatus()
      expect(initStatus.qssEnabled).toBeTruthy()
      expect(initStatus.qssSetup).toBeFalsy()
      expect(mockedSendMessage).toHaveBeenCalledTimes(0)
      expect(created).toBeFalsy()
    })
  })

  describe('signInToCommunity', () => {
    it(`signs into a community on QSS successfully`, async () => {
      await initCommunity()
      const initStatusOrig = await qssService.getQssInitStatus()
      expect(initStatusOrig.qssSetup).toBeFalsy()
      mockSuccessfulSignIn()
      mockedAllowed = jest.spyOn(qssService, 'qssAllowed', 'get').mockReturnValue(true)
      await qssService.connect('ws://localhost:3000')
      expect(qssService.connected).toBeTruthy()

      await qssService.signInToCommunity(sigchainService.activeChain.team!.id, sigchainService.activeChain)
      await waitForExpect(() => {
        expect(mockedSendMessage).toHaveBeenNthCalledWith(
          1,
          WebsocketEvents.SIGN_IN_COMMUNITY,
          expect.objectContaining({
            ts: expect.any(Number),
            status: CommunityOperationStatus.SUCCESS,
            payload: {
              userId: sigchainService.user.userId,
              teamId: sigchainService.team.id,
            },
          } as CommunitySignInMessage),
          true
        )
      })
      await waitForExpect(() => {
        expect(qssService.joinStatus(sigchainService.team.id)).toBe(JoinStatus.JOINED)
      })
      expect(mockedSendMessage).toHaveBeenCalledTimes(2)
      const initStatus = await qssService.getQssInitStatus()
      expect(initStatus.qssSetup).toBeTruthy()
    })

    it('waits for storage readiness before starting historical log pulls', async () => {
      await initCommunity()
      mockSuccessfulSignIn()
      mockedAllowed = jest.spyOn(qssService, 'qssAllowed', 'get').mockReturnValue(true)
      const startLogPullIntervalSpy = jest.spyOn(qssService, 'startLogPullInterval').mockImplementation(() => {})
      const teamId = sigchainService.activeChain.team!.id

      await qssService.connect('ws://localhost:3000')
      await qssService.signInToCommunity(teamId, sigchainService.activeChain)

      expect(startLogPullIntervalSpy).not.toHaveBeenCalled()

      qssService.markTeamStorageReady(teamId)

      expect(startLogPullIntervalSpy).toHaveBeenCalledTimes(1)
      expect(startLogPullIntervalSpy).toHaveBeenCalledWith(teamId)
    })

    it('emits the NSE QSS URL from the endpoint passed to connect on iOS after successful sign in', async () => {
      const originalPlatform = process.platform
      Object.defineProperty(process, 'platform', { value: 'ios' })

      try {
        await localDbService.setCommunity({
          ...community,
          teamId: 'team-id',
          qssEnabled: true,
        })
        await localDbService.setCurrentCommunityId(community.id)
        await localDbService.setIdentity(userIdentity)

        mockSuccessfulSignIn()
        mockedAllowed = jest.spyOn(qssService, 'qssAllowed', 'get').mockReturnValue(true)
        const emitSpy = jest.spyOn(qssService['socketService'].serverIoProvider.io, 'emit')

        await qssService.connect('wss://community.example/ws')
        await qssService.signInToCommunity(sigchainService.activeChain.team!.id, sigchainService.activeChain)

        expect(emitSpy).toHaveBeenCalledWith(SocketEvents.NSE_QSS_URL_UPDATED, {
          teamId: 'team-id',
          qssUrl: 'https://community.example/ws',
        })
      } finally {
        Object.defineProperty(process, 'platform', { value: originalPlatform })
      }
    })

    it('emits the NSE QSS URL from the stored endpoint when connect is called without one on iOS after successful sign in', async () => {
      const originalPlatform = process.platform
      Object.defineProperty(process, 'platform', { value: 'ios' })

      try {
        await localDbService.setCommunity({
          ...community,
          teamId: 'team-id',
          qssEnabled: true,
        })
        await localDbService.setCurrentCommunityId(community.id)
        await localDbService.setIdentity(userIdentity)

        qssService._qssEndpoint = 'ws://configured.example/ws'
        mockSuccessfulSignIn()
        mockedAllowed = jest.spyOn(qssService, 'qssAllowed', 'get').mockReturnValue(true)
        const emitSpy = jest.spyOn(qssService['socketService'].serverIoProvider.io, 'emit')

        await qssService.connect(undefined)
        await qssService.signInToCommunity(sigchainService.activeChain.team!.id, sigchainService.activeChain)

        expect(emitSpy).toHaveBeenCalledWith(SocketEvents.NSE_QSS_URL_UPDATED, {
          teamId: 'team-id',
          qssUrl: 'http://configured.example/ws',
        })
      } finally {
        Object.defineProperty(process, 'platform', { value: originalPlatform })
      }
    })

    it('skips NSE QSS URL emission when sign in uses a non-ws endpoint on iOS', async () => {
      const originalPlatform = process.platform
      Object.defineProperty(process, 'platform', { value: 'ios' })

      try {
        await localDbService.setCommunity({
          ...community,
          teamId: 'team-id',
          qssEnabled: true,
        })
        await localDbService.setCurrentCommunityId(community.id)
        await localDbService.setIdentity(userIdentity)

        mockSuccessfulSignIn()
        mockedAllowed = jest.spyOn(qssService, 'qssAllowed', 'get').mockReturnValue(true)
        const emitSpy = jest.spyOn(qssService['socketService'].serverIoProvider.io, 'emit')

        await qssService.connect('https://community.example/api')
        await qssService.signInToCommunity(sigchainService.activeChain.team!.id, sigchainService.activeChain)

        expect(emitSpy).not.toHaveBeenCalledWith(
          SocketEvents.NSE_QSS_URL_UPDATED,
          expect.objectContaining({ teamId: 'team-id' })
        )
      } finally {
        Object.defineProperty(process, 'platform', { value: originalPlatform })
      }
    })

    it(`doesn't sign in to community when QSS is not connected`, async () => {
      await initCommunity()
      const initStatusOrig = await qssService.getQssInitStatus()
      expect(initStatusOrig.qssSetup).toBeFalsy()

      mockedSendMessage = jest
        .spyOn(qssClient, 'sendMessage')
        .mockImplementation(
          async <T>(event: WebsocketEvents, payload: unknown, withAck = false): Promise<T | undefined> => {
            logger.debug('Sending event to QSS', event, payload, withAck)
            switch (event) {
              case WebsocketEvents.SIGN_IN_COMMUNITY:
                return {
                  ts: DateTime.utc().toMillis(),
                  status: CommunityOperationStatus.SUCCESS,
                } as T
              default:
                return undefined
            }
          }
        )

      await qssService.signInToCommunity(sigchainService.activeChain.team!.id, sigchainService.activeChain)
      expect(qssService.joinStatus(sigchainService.team.id)).toBe(JoinStatus.NOT_STARTED)
      expect(mockedSendMessage).toHaveBeenCalledTimes(0)
      const initStatus = await qssService.getQssInitStatus()
      expect(initStatus.qssSetup).toBeFalsy()
    })

    it(`catches an error when sign in fails`, async () => {
      await initCommunity()
      const initStatusOrig = await qssService.getQssInitStatus()
      expect(initStatusOrig.qssSetup).toBeFalsy()

      mockedSendMessage = jest
        .spyOn(qssClient, 'sendMessage')
        .mockImplementation(
          async <T>(event: WebsocketEvents, payload: unknown, withAck = false): Promise<T | undefined> => {
            logger.debug('Sending event to QSS', event, payload, withAck)
            switch (event) {
              case WebsocketEvents.SIGN_IN_COMMUNITY:
                return {
                  ts: DateTime.utc().toMillis(),
                  status: CommunityOperationStatus.ERROR,
                  reason: 'Failed to sign in',
                } as T
              default:
                return undefined
            }
          }
        )
      mockedAllowed = jest.spyOn(qssService, 'qssAllowed', 'get').mockReturnValue(true)
      await qssService.connect('ws://localhost:3000')
      expect(qssService.connected).toBeTruthy()

      let error: Error | undefined = undefined
      let result: QSSOperationResult | undefined = undefined
      try {
        result = await qssService.signInToCommunity(sigchainService.activeChain.team!.id, sigchainService.activeChain)
      } catch (e) {
        error = e
      }
      await waitForExpect(() => {
        expect(mockedSendMessage).toHaveBeenNthCalledWith(
          1,
          WebsocketEvents.SIGN_IN_COMMUNITY,
          expect.objectContaining({
            ts: expect.any(Number),
            status: CommunityOperationStatus.SUCCESS,
            payload: {
              userId: sigchainService.user.userId,
              teamId: sigchainService.team.id,
            },
          } as CommunitySignInMessage),
          true
        )
      })
      expect(error).toBeUndefined()
      expect(result).toBeDefined()
      expect(result).toBe(QSSOperationResult.ERROR)
      expect(qssService.joinStatus(sigchainService.team.id)).toBe(JoinStatus.NOT_STARTED)
      expect(mockedSendMessage).toHaveBeenCalledTimes(1)
      const initStatus = await qssService.getQssInitStatus()
      expect(initStatus.qssSetup).toBeFalsy()
    })

    it(`catches an error when the auth connection fails to start after sign in`, async () => {
      await initCommunity()
      mockSuccessfulSignIn()
      mockedAllowed = jest.spyOn(qssService, 'qssAllowed', 'get').mockReturnValue(true)
      jest
        .spyOn(qssAuthConnManager, 'startNewConnection')
        .mockRejectedValue(new Error(`No chain found for team ID ${sigchainService.activeChain.team!.id}`))

      await qssService.connect('ws://localhost:3000')
      expect(qssService.connected).toBeTruthy()

      const result = await qssService.signInToCommunity(
        sigchainService.activeChain.team!.id,
        sigchainService.activeChain
      )

      expect(result).toBe(QSSOperationResult.ERROR)
      expect(mockedSendMessage).toHaveBeenCalledTimes(1)
      const initStatus = await qssService.getQssInitStatus()
      expect(initStatus.qssSetup).toBeFalsy()
    })
  })

  describe('sendLogEntrySyncMessage', () => {
    it(`sends a successful log sync to QSS`, async () => {
      await initCommunity({ qssEnabled: true, qssSetup: true })
      const initStatusOrig = await qssService.getQssInitStatus()
      expect(initStatusOrig.qssSetup).toBeTruthy()
      const syncSeq = 41
      await localDbService.setLastSyncSeq(sigchainService.team.id, 40)
      const emitSpy = jest.spyOn(qssService['socketService'].serverIoProvider.io, 'emit')

      mockedJoinStatus = jest.spyOn(qssService, 'joinStatus').mockReturnValue(JoinStatus.JOINED)
      mockedSendMessage = jest
        .spyOn(qssClient, 'sendMessage')
        .mockImplementation(
          async <T>(event: WebsocketEvents, payload: unknown, withAck = false): Promise<T | undefined> => {
            logger.debug('Sending event to QSS', event, payload, withAck)
            if (!withAck) {
              return undefined
            }
            switch (event) {
              case WebsocketEvents.LOG_ENTRY_SYNC:
                const { teamId, hash, hashedDbId } = (payload as LogEntrySyncMessage).payload!
                return {
                  ts: DateTime.utc().toMillis(),
                  status: CommunityOperationStatus.SUCCESS,
                  payload: {
                    teamId,
                    hash,
                    hashedDbId,
                    syncSeq,
                  },
                } as LogEntrySyncResponseMessage as T
              default:
                return undefined
            }
          }
        )
      mockedAllowed = jest.spyOn(qssService, 'qssAllowed', 'get').mockReturnValue(true)
      await qssService.connect('ws://localhost:3000')
      expect(qssService.connected).toBeTruthy()

      const db = await orbitDbService.open<EventsType<EncryptedAndSignedPayload>>(`channels.foobar`, {
        type: 'events',
        Database: EventsWithStorage(),
        AccessController: MessagesAccessController({ write: ['*'] }),
        sync: true,
      })
      const hash = await db.add(
        sigchainService.activeChain.crypto.encryptAndSign('random message', {
          type: EncryptionScopeType.ROLE,
          name: RoleName.MEMBER,
        })
      )
      const entry = await db.log.get(hash)
      const update = logEntryToLogUpdate(entry, db.address, sigchainService.activeChain.team!.id)
      expect(update.teamId).toBe(sigchainService.team.id)
      const result = await qssService.sendLogEntrySyncMessage(update)
      await waitForExpect(() => {
        expect(mockedSendMessage).toHaveBeenNthCalledWith(
          1,
          WebsocketEvents.LOG_ENTRY_SYNC,
          expect.objectContaining({
            ts: expect.any(Number),
            status: CommunityOperationStatus.SENDING,
            payload: {
              teamId: sigchainService.team.id,
              hash,
              hashedDbId: expect.any(String),
              encEntry: expect.any(Object),
            },
          } as LogEntrySyncMessage),
          true
        )
      })
      expect(result).toBe(true)
      expect(mockedSendMessage).toHaveBeenCalledTimes(1)
      expect(await localDbService.getLastSyncSeq(sigchainService.team.id)).toBe(syncSeq)
      expect(emitSpy).toHaveBeenCalledWith(SocketEvents.NSE_SYNC_SEQ_UPDATED, {
        teamId: sigchainService.team.id,
        lastSyncSeq: syncSeq,
      })

      const pendingMessages = await localDbService.getPendingQssLogSyncMessages()
      expect(pendingMessages).toEqual({})
    })

    it(`updates last sync seq from contiguous fanout`, async () => {
      await initCommunity({ qssEnabled: true, qssSetup: true })
      const teamId = sigchainService.activeChain.team!.id
      await localDbService.setLastSyncSeq(teamId, 9)
      const syncSeq = 10

      jest.spyOn(orbitDbService, 'handleFanoutMessage').mockResolvedValue(true)

      qssClient.emit(WebsocketEvents.LOG_ENTRY_SYNC, {
        ts: DateTime.utc().toMillis(),
        status: CommunityOperationStatus.SUCCESS,
        payload: {
          teamId,
          hash: 'fanout-hash',
          hashedDbId: 'fanout-db-id',
          encEntry: {
            encrypted: {
              contents: new Uint8Array(),
              scope: {
                type: EncryptionScopeType.ROLE,
                name: RoleName.MEMBER,
                generation: 1,
              },
            },
            signature: {
              signature: 'fanout-sig' as Base58,
              author: { type: 'USER', name: 'fanout-user' } as any,
            },
            ts: DateTime.utc().toMillis(),
            userId: sigchainService.user.userId,
            teamId,
          },
          syncSeq,
        },
      } satisfies LogEntrySyncMessage)

      await waitForExpect(async () => {
        expect(await localDbService.getLastSyncSeq(teamId)).toBe(syncSeq)
      })
    })

    it(`reconciles by pull when a fanout arrives before a sync-seq baseline is established`, async () => {
      await initCommunity({ qssEnabled: true, qssSetup: true })
      const teamId = sigchainService.activeChain.team!.id
      const pullSpy = jest.spyOn(qssService as any, '_pullLatestLogEntriesForTeam').mockResolvedValue(undefined)

      jest.spyOn(orbitDbService, 'handleFanoutMessage').mockResolvedValue(true)

      qssClient.emit(WebsocketEvents.LOG_ENTRY_SYNC, {
        ts: DateTime.utc().toMillis(),
        status: CommunityOperationStatus.SUCCESS,
        payload: {
          teamId,
          hash: 'fanout-baseline-hash',
          hashedDbId: 'fanout-baseline-db-id',
          encEntry: {
            encrypted: {
              contents: new Uint8Array(),
              scope: {
                type: EncryptionScopeType.ROLE,
                name: RoleName.MEMBER,
                generation: 1,
              },
            },
            signature: {
              signature: 'fanout-baseline-sig' as Base58,
              author: { type: 'USER', name: 'fanout-user' } as any,
            },
            ts: DateTime.utc().toMillis(),
            userId: sigchainService.user.userId,
            teamId,
          },
          syncSeq: 1,
        },
      } satisfies LogEntrySyncMessage)

      await waitForExpect(() => {
        expect(pullSpy).toHaveBeenCalledWith(teamId)
      })
      expect(await localDbService.getLastSyncSeq(teamId)).toBeNull()
    })

    it(`reconciles by pull when a sync-seq gap is detected from fanout`, async () => {
      await initCommunity({ qssEnabled: true, qssSetup: true })
      const teamId = sigchainService.activeChain.team!.id
      await localDbService.setLastSyncSeq(teamId, 5)
      const pullSpy = jest.spyOn(qssService as any, '_pullLatestLogEntriesForTeam').mockResolvedValue(undefined)

      jest.spyOn(orbitDbService, 'handleFanoutMessage').mockResolvedValue(true)

      qssClient.emit(WebsocketEvents.LOG_ENTRY_SYNC, {
        ts: DateTime.utc().toMillis(),
        status: CommunityOperationStatus.SUCCESS,
        payload: {
          teamId,
          hash: 'fanout-gap-hash',
          hashedDbId: 'fanout-gap-db-id',
          encEntry: {
            encrypted: {
              contents: new Uint8Array(),
              scope: {
                type: EncryptionScopeType.ROLE,
                name: RoleName.MEMBER,
                generation: 1,
              },
            },
            signature: {
              signature: 'fanout-gap-sig' as Base58,
              author: { type: 'USER', name: 'fanout-user' } as any,
            },
            ts: DateTime.utc().toMillis(),
            userId: sigchainService.user.userId,
            teamId,
          },
          syncSeq: 7,
        },
      } satisfies LogEntrySyncMessage)

      await waitForExpect(() => {
        expect(pullSpy).toHaveBeenCalledWith(teamId)
      })
      expect(await localDbService.getLastSyncSeq(teamId)).toBe(5)
    })

    it(`reconciles by pull when fanout ingest fails even with a contiguous sync seq`, async () => {
      await initCommunity({ qssEnabled: true, qssSetup: true })
      const teamId = sigchainService.activeChain.team!.id
      await localDbService.setLastSyncSeq(teamId, 5)
      const pullSpy = jest.spyOn(qssService as any, '_pullLatestLogEntriesForTeam').mockResolvedValue(undefined)

      jest.spyOn(orbitDbService, 'handleFanoutMessage').mockResolvedValue(false)

      qssClient.emit(WebsocketEvents.LOG_ENTRY_SYNC, {
        ts: DateTime.utc().toMillis(),
        status: CommunityOperationStatus.SUCCESS,
        payload: {
          teamId,
          hash: 'fanout-failure-hash',
          hashedDbId: 'fanout-failure-db-id',
          encEntry: {
            encrypted: {
              contents: new Uint8Array(),
              scope: {
                type: EncryptionScopeType.ROLE,
                name: RoleName.MEMBER,
                generation: 1,
              },
            },
            signature: {
              signature: 'fanout-failure-sig' as Base58,
              author: { type: 'USER', name: 'fanout-user' } as any,
            },
            ts: DateTime.utc().toMillis(),
            userId: sigchainService.user.userId,
            teamId,
          },
          syncSeq: 6,
        },
      } satisfies LogEntrySyncMessage)

      await waitForExpect(() => {
        expect(pullSpy).toHaveBeenCalledWith(teamId)
      })
      expect(await localDbService.getLastSyncSeq(teamId)).toBe(5)
    })

    it(`fails to send log sync to QSS and writes pending message to local DB`, async () => {
      await initCommunity({ qssEnabled: true, qssSetup: true })
      const initStatusOrig = await qssService.getQssInitStatus()
      expect(initStatusOrig.qssSetup).toBeTruthy()

      mockedSendMessage = jest
        .spyOn(qssClient, 'sendMessage')
        .mockImplementation(
          async <T>(event: WebsocketEvents, payload: unknown, withAck = false): Promise<T | undefined> => {
            logger.debug('Sending event to QSS', event, payload, withAck)
            if (!withAck) {
              return undefined
            }
            switch (event) {
              case WebsocketEvents.LOG_ENTRY_SYNC:
                const { teamId, hash, hashedDbId } = (payload as LogEntrySyncMessage).payload!
                return {
                  ts: DateTime.utc().toMillis(),
                  status: CommunityOperationStatus.SUCCESS,
                  payload: {
                    teamId,
                    hash,
                    hashedDbId,
                  },
                } as T
              default:
                return undefined
            }
          }
        )
      addPendingMessageSpy = jest.spyOn(localDbService, 'addPendingQssLogSyncMessage')
      mockedCreateSocket.mockRestore()
      mockedAllowed = jest.spyOn(qssService, 'qssAllowed', 'get').mockReturnValue(true)
      await qssService.connect('ws://localhost:3000')
      expect(qssService.connected).toBeFalsy()

      const db = await orbitDbService.open<EventsType<EncryptedAndSignedPayload>>(`channels.foobar`, {
        type: 'events',
        Database: EventsWithStorage(),
        AccessController: MessagesAccessController({ write: ['*'] }),
        sync: true,
      })
      const hash = await db.add(
        sigchainService.activeChain.crypto.encryptAndSign('random message', {
          type: EncryptionScopeType.ROLE,
          name: RoleName.MEMBER,
        })
      )
      const entry = await db.log.get(hash)
      const update = logEntryToLogUpdate(entry, db.address, sigchainService.activeChain.team!.id)
      const result = await qssService.sendLogEntrySyncMessage(update)
      expect(result).toBe(undefined)
      await waitForExpect(async () => {
        expect(addPendingMessageSpy).toHaveBeenCalledTimes(1)
      })
      expect(mockedSendMessage).toHaveBeenCalledTimes(0)

      const pendingMessages = await localDbService.getPendingQssLogSyncMessages()
      expect(pendingMessages[db.address].length).toBe(1)
    })
  })

  describe('pullLatestLogEntries', () => {
    let mockedPullLogEntries: jest.SpiedFunction<any>

    beforeEach(async () => {
      await initCommunity({ qssEnabled: true, qssSetup: true })
      // @ts-ignore
      mockedPullLogEntries = jest.spyOn(qssService, 'pullLogEntries')
    })

    afterEach(() => {
      mockedPullLogEntries.mockRestore()
    })

    it('pulls all log entries from QSS for a team with multiple pages', async () => {
      const teamId = sigchainService.activeChain.team!.id
      const entriesPage1 = [{ data: 'entry1' }, { data: 'entry2' }]
      const entriesPage2 = [{ data: 'entry3' }]
      const page1SyncSeq = 11
      const page2SyncSeq = 12
      mockedPullLogEntries
        .mockResolvedValueOnce({
          ts: DateTime.utc().toMillis(),
          status: CommunityOperationStatus.SUCCESS,
          payload: {
            entries: entriesPage1,
            hasNextPage: true,
            highestSyncSeq: page1SyncSeq,
            resolvedStartSeq: 10,
          },
        })
        .mockResolvedValueOnce({
          ts: DateTime.utc().toMillis(),
          status: CommunityOperationStatus.SUCCESS,
          payload: {
            entries: entriesPage2,
            hasNextPage: false,
            highestSyncSeq: page2SyncSeq,
            resolvedStartSeq: page1SyncSeq,
          },
        })

      const response = await qssService.pullLatestLogEntries(teamId)
      expect(mockedPullLogEntries).toHaveBeenCalledTimes(2)
      expect(response.status).toBe(CommunityOperationStatus.SUCCESS)
      expect(response.payload.entries).toEqual([])
      expect(response.payload.hasNextPage).toBe(false)
      expect(response.payload.highestSyncSeq).toBe(page2SyncSeq)
      expect(await localDbService.getLastSyncSeq(teamId)).toBe(page2SyncSeq)
    })

    it('handles empty entries and no next page', async () => {
      const teamId = sigchainService.activeChain.team!.id
      mockedPullLogEntries.mockResolvedValueOnce({
        ts: DateTime.utc().toMillis(),
        status: CommunityOperationStatus.SUCCESS,
        payload: {
          entries: [],
          hasNextPage: false,
          resolvedStartSeq: 0,
        },
      })
      const response = await qssService.pullLatestLogEntries(teamId)
      expect(mockedPullLogEntries).toHaveBeenCalledTimes(1)
      expect(response.status).toBe(CommunityOperationStatus.SUCCESS)
      expect(response.payload.entries).toEqual([])
      expect(response.payload.hasNextPage).toBe(false)
    })

    it('stores failed decryption entries in DLQ', async () => {
      const teamId = sigchainService.activeChain.team!.id
      const serializer = (qssService as any).serializer

      // Create a valid encrypted payload that can't be decrypted (wrong key)
      const mockEncryptedPayload: EncryptedAndSignedPayload = {
        encrypted: {
          contents: new Uint8Array([1, 2, 3, 4, 5]),
          scope: {
            type: EncryptionScopeType.ROLE,
            name: 'MEMBER',
            generation: 999, // Future generation key that doesn't exist
          },
        },
        signature: {
          signature: 'invalid-sig' as Base58,
          author: { type: 'USER', name: 'unknown' } as any,
        },
        ts: Date.now(),
        userId: 'unknown-user',
        teamId,
      }

      // Mock pullLogEntries to return encrypted entries that will fail decryption
      mockedPullLogEntries.mockResolvedValueOnce({
        ts: DateTime.utc().toMillis(),
        status: CommunityOperationStatus.SUCCESS,
        payload: {
          entries: [serializer.serialize(mockEncryptedPayload)],
          hasNextPage: false,
          resolvedStartSeq: 0,
        },
      })

      // Pull entries - should fail to decrypt and store in DLQ
      await qssService.pullLatestLogEntries(teamId)

      // Verify entry was added to DLQ
      const dlqCount = await localDbService.getDLQDecryptCount(teamId)
      expect(dlqCount).toBe(1)

      const dlqEntries = await localDbService.getDLQDecryptEntries(teamId, serializer)
      expect(dlqEntries.length).toBe(1)
      expect(dlqEntries[0].entry.payload.encrypted.scope.generation).toBe(999)
    })

    it('skips concurrent pull when one is already in flight', async () => {
      const teamId = sigchainService.activeChain.team!.id

      // Create a slow-resolving promise to simulate in-flight pull
      let resolveFirst: () => void
      const slowPromise = new Promise<LogEntryPullResponseMessage>(resolve => {
        resolveFirst = () =>
          resolve({
            ts: DateTime.utc().toMillis(),
            status: CommunityOperationStatus.SUCCESS,
            payload: { entries: [], hasNextPage: false },
          })
      })

      mockedPullLogEntries.mockReturnValueOnce(slowPromise)

      // Start first pull (will be in flight)
      // @ts-ignore - accessing private method for testing
      const firstPull = qssService._pullLatestLogEntriesForTeam(teamId)

      // Try second pull immediately - should skip
      // @ts-ignore
      await qssService._pullLatestLogEntriesForTeam(teamId)

      // Resolve first pull
      resolveFirst!()
      await firstPull

      // Only one actual pull should have happened
      expect(mockedPullLogEntries).toHaveBeenCalledTimes(1)
    })

    it('stops log pull interval after successful pull', async () => {
      const teamId = sigchainService.activeChain.team!.id

      mockedPullLogEntries.mockResolvedValueOnce({
        ts: DateTime.utc().toMillis(),
        status: CommunityOperationStatus.SUCCESS,
        payload: { entries: [], hasNextPage: false },
      })

      const interval = setInterval(() => undefined, 30_000)
      const timeout = setTimeout(() => undefined, 30_000)
      // @ts-ignore - seed the interval map to verify _pullLatestLogEntriesForTeam stops it on success
      qssService._logPullIntervals.set(teamId, interval)
      // @ts-ignore - seed the timeout map to verify _pullLatestLogEntriesForTeam stops it on success
      qssService._logPullSuccessTimeouts.set(teamId, timeout)

      // @ts-ignore
      await qssService._pullLatestLogEntriesForTeam(teamId)

      expect(mockedPullLogEntries).toHaveBeenCalledTimes(1)
      // @ts-ignore
      expect(qssService._logPullIntervals.has(teamId)).toBe(false)
      // @ts-ignore
      expect(qssService._logPullSuccessTimeouts.has(teamId)).toBe(false)
    })

    it('retries log pull interval on failure', async () => {
      const teamId = sigchainService.activeChain.team!.id

      mockedPullLogEntries
        .mockResolvedValueOnce({
          ts: DateTime.utc().toMillis(),
          status: CommunityOperationStatus.UNAUTHORIZED,
          reason: 'Temporary error',
        })
        .mockResolvedValueOnce({
          ts: DateTime.utc().toMillis(),
          status: CommunityOperationStatus.SUCCESS,
          payload: { entries: [], hasNextPage: false },
        })

      const interval = setInterval(() => undefined, 30_000)
      const timeout = setTimeout(() => undefined, 30_000)
      // @ts-ignore - seed the interval map to verify failure keeps it alive and success clears it
      qssService._logPullIntervals.set(teamId, interval)
      // @ts-ignore - seed the timeout map to verify failure keeps it alive and success clears it
      qssService._logPullSuccessTimeouts.set(teamId, timeout)

      // @ts-ignore
      await qssService._pullLatestLogEntriesForTeam(teamId)

      // Interval should still exist after failed pull
      expect(mockedPullLogEntries).toHaveBeenCalledTimes(1)
      // @ts-ignore
      expect(qssService._logPullIntervals.has(teamId)).toBe(true)
      // @ts-ignore
      expect(qssService._logPullSuccessTimeouts.has(teamId)).toBe(true)

      // @ts-ignore
      await qssService._pullLatestLogEntriesForTeam(teamId)

      expect(mockedPullLogEntries).toHaveBeenCalledTimes(2)

      // Interval should stop after successful pull
      // @ts-ignore
      expect(qssService._logPullIntervals.has(teamId)).toBe(false)
      // @ts-ignore
      expect(qssService._logPullSuccessTimeouts.has(teamId)).toBe(false)
    })

    it('stops log pull interval if no pull succeeds within timeout', async () => {
      jest.useFakeTimers()
      try {
        const teamId = sigchainService.activeChain.team!.id

        mockedPullLogEntries.mockResolvedValue({
          ts: DateTime.utc().toMillis(),
          status: CommunityOperationStatus.UNAUTHORIZED,
          reason: 'Temporary error',
        })

        qssService.startLogPullInterval(teamId)

        // @ts-ignore
        expect(qssService._logPullIntervals.has(teamId)).toBe(true)
        // @ts-ignore
        expect(qssService._logPullSuccessTimeouts.has(teamId)).toBe(true)

        jest.advanceTimersByTime(10_000)

        // @ts-ignore
        expect(qssService._logPullIntervals.has(teamId)).toBe(false)
        // @ts-ignore
        expect(qssService._logPullSuccessTimeouts.has(teamId)).toBe(false)
      } finally {
        qssService.close()
        jest.useRealTimers()
      }
    })
  })

  describe('pullLogEntries', () => {
    beforeEach(async () => {
      await initCommunity({ qssEnabled: true, qssSetup: true })
      mockedAllowed = jest.spyOn(qssService, 'qssAllowed', 'get').mockReturnValue(true)
      await qssService.connect('ws://localhost:3000')
    })

    it('throws error on nullish response from QSS', async () => {
      mockedSendMessage = jest.spyOn(qssClient, 'sendMessage').mockResolvedValue(undefined)

      const teamId = sigchainService.activeChain.team!.id
      await expect(
        qssService.pullLogEntries({
          teamId,
          userId: sigchainService.user.userId,
          startSeq: 0,
        })
      ).rejects.toThrow('Nullish response from QSS')
    })

    it('returns entries on successful response', async () => {
      const teamId = sigchainService.activeChain.team!.id
      const mockResponse: LogEntryPullResponseMessage = {
        ts: DateTime.utc().toMillis(),
        status: CommunityOperationStatus.SUCCESS,
        payload: {
          entries: [Buffer.from('test')],
          hasNextPage: false,
        },
      }
      mockedSendMessage = jest.spyOn(qssClient, 'sendMessage').mockResolvedValue(mockResponse)

      const result = await qssService.pullLogEntries({
        teamId,
        userId: sigchainService.user.userId,
        startSeq: 0,
      })

      expect(result.payload.entries.length).toBe(1)
      expect(result.status).toBe(CommunityOperationStatus.SUCCESS)
    })
  })

  describe('processDeadLetterQueue', () => {
    it('skips processing when storage is not ready for team', async () => {
      await initCommunity({ qssEnabled: true, qssSetup: true })
      mockedAllowed = jest.spyOn(qssService, 'qssAllowed', 'get').mockReturnValue(true)
      await qssService.connect('ws://localhost:3000')
      expect(qssService.connected).toBeTruthy()

      const teamId = sigchainService.activeChain.team!.id
      const getPendingSpy = jest.spyOn(localDbService, 'getPendingQssLogSyncMessages')

      // Storage not marked ready — processDeadLetterQueue should bail early
      // @ts-ignore
      await qssService.processDeadLetterQueue(teamId)

      expect(getPendingSpy).not.toHaveBeenCalled()
      getPendingSpy.mockRestore()
    })

    it('skips processing when not connected', async () => {
      await initCommunity({ qssEnabled: true, qssSetup: true })

      const teamId = sigchainService.activeChain.team!.id
      // Mark storage ready but leave QSS disconnected
      qssService.markTeamStorageReady(teamId)
      expect(qssService.connected).toBeFalsy()

      const getPendingSpy = jest.spyOn(localDbService, 'getPendingQssLogSyncMessages')

      // @ts-ignore
      await qssService.processDeadLetterQueue(teamId)

      expect(getPendingSpy).not.toHaveBeenCalled()
      getPendingSpy.mockRestore()
    })

    it('invokes getPendingQssLogSyncMessages when connected and storage is ready', async () => {
      await initCommunity({ qssEnabled: true, qssSetup: true })
      mockedAllowed = jest.spyOn(qssService, 'qssAllowed', 'get').mockReturnValue(true)
      await qssService.connect('ws://localhost:3000')
      expect(qssService.connected).toBeTruthy()

      const teamId = sigchainService.activeChain.team!.id
      qssService.markTeamStorageReady(teamId)

      const getPendingSpy = jest.spyOn(localDbService, 'getPendingQssLogSyncMessages').mockResolvedValue({})

      // @ts-ignore
      await qssService.processDeadLetterQueue(teamId)

      expect(getPendingSpy).toHaveBeenCalled()
      getPendingSpy.mockRestore()
    })

    it('triggers DLQ processing when markTeamStorageReady is called', async () => {
      await initCommunity({ qssEnabled: true, qssSetup: true })
      mockedAllowed = jest.spyOn(qssService, 'qssAllowed', 'get').mockReturnValue(true)
      await qssService.connect('ws://localhost:3000')

      const teamId = sigchainService.activeChain.team!.id
      // @ts-ignore
      const dlqSpy = jest.spyOn(qssService, 'processDeadLetterQueue')

      qssService.markTeamStorageReady(teamId)

      expect(dlqSpy).toHaveBeenCalledWith(teamId)
      dlqSpy.mockRestore()
    })

    it('triggers DLQ processing with teamId when QSS_AUTH_JOINED fires', async () => {
      await initCommunity({ qssEnabled: true, qssSetup: true })

      const teamId = sigchainService.activeChain.team!.id
      // @ts-ignore
      const dlqSpy = jest.spyOn(qssService, 'processDeadLetterQueue')

      qssAuthConnManager.emit(QSSEvents.QSS_AUTH_JOINED, teamId)

      await waitForExpect(() => {
        expect(dlqSpy).toHaveBeenCalledWith(teamId)
      })
      dlqSpy.mockRestore()
    })
  })

  describe('sendLogEntrySyncMessage (no join-status gate)', () => {
    it('sends message to QSS when connected regardless of join status', async () => {
      await initCommunity({ qssEnabled: true, qssSetup: true })
      mockedAllowed = jest.spyOn(qssService, 'qssAllowed', 'get').mockReturnValue(true)
      await qssService.connect('ws://localhost:3000')
      expect(qssService.connected).toBeTruthy()

      const teamId = sigchainService.activeChain.team!.id
      // Explicitly leave join status as NOT_STARTED — old code would have written to DLQ here
      expect(qssService.joinStatus(teamId)).toBe(JoinStatus.NOT_STARTED)

      mockedSendMessage = jest
        .spyOn(qssClient, 'sendMessage')
        .mockImplementation(async <T>(event: WebsocketEvents): Promise<T | undefined> => {
          if (event === WebsocketEvents.LOG_ENTRY_SYNC) {
            return {
              ts: DateTime.now().toMillis(),
              status: CommunityOperationStatus.SUCCESS,
              payload: { teamId, hash: 'test-hash', hashedDbId: 'test-id', syncSeq: 1 },
            } as LogEntrySyncResponseMessage as T
          }
          return undefined
        })

      addPendingMessageSpy = jest.spyOn(localDbService, 'addPendingQssLogSyncMessage')

      const db = await orbitDbService.open<EventsType<EncryptedAndSignedPayload>>(`channels.joinstatus`, {
        type: 'events',
        Database: EventsWithStorage(),
        AccessController: MessagesAccessController({ write: ['*'] }),
        sync: true,
      })
      const hash = await db.add(
        sigchainService.activeChain.crypto.encryptAndSign('test message', {
          type: EncryptionScopeType.ROLE,
          name: RoleName.MEMBER,
        })
      )
      const entry = await db.log.get(hash)
      const update = logEntryToLogUpdate(entry, db.address, teamId)
      const result = await qssService.sendLogEntrySyncMessage(update)

      // Should have been sent, not deferred to DLQ
      expect(result).toBe(true)
      expect(mockedSendMessage).toHaveBeenCalledWith(
        WebsocketEvents.LOG_ENTRY_SYNC,
        expect.objectContaining({ status: CommunityOperationStatus.SENDING }),
        true
      )
      expect(addPendingMessageSpy).not.toHaveBeenCalled()
    })
  })

  describe('processDLQDecrypt', () => {
    it('recovers entries from DLQ when sigchain updates', async () => {
      await initCommunity({ qssEnabled: true, qssSetup: true })
      mockedAllowed = jest.spyOn(qssService, 'qssAllowed', 'get').mockReturnValue(true)
      await qssService.connect('ws://localhost:3000')

      const teamId = sigchainService.activeChain.team!.id
      const serializer = (qssService as any).serializer

      // Create a valid encrypted message that CAN be decrypted
      await orbitDbService.open<EventsType<EncryptedAndSignedPayload>>(`channels.test`, {
        type: 'events',
        Database: EventsWithStorage(),
        AccessController: MessagesAccessController({ write: ['*'] }),
        sync: true,
      })

      const encryptedPayload = sigchainService.activeChain.crypto.encryptAndSign('test message for DLQ', {
        type: EncryptionScopeType.ROLE,
        name: RoleName.MEMBER,
      })

      // Manually add to DLQ (simulating a previous failed decrypt)
      await localDbService.addDLQDecryptEntry(teamId, encryptedPayload, serializer)

      // Verify it's in the DLQ
      expect(await localDbService.getDLQDecryptCount(teamId)).toBe(1)

      // Mock ingestEntries to track what gets recovered
      const ingestSpy = jest.spyOn(orbitDbService, 'ingestEntries').mockResolvedValue()

      // Trigger sigchain update which should process DLQ
      sigchainService.emit('updated', sigchainService.activeChainTeamName)

      // Wait for async processing
      await waitForExpect(async () => {
        const remainingCount = await localDbService.getDLQDecryptCount(teamId)
        expect(remainingCount).toBe(0)
      })

      // Verify entry was recovered and ingested
      expect(ingestSpy).toHaveBeenCalled()
      ingestSpy.mockRestore()
    })

    it('retries DLQ processing when sigchain updates during processing', async () => {
      await initCommunity({ qssEnabled: true, qssSetup: true })
      mockedAllowed = jest.spyOn(qssService, 'qssAllowed', 'get').mockReturnValue(true)
      await qssService.connect('ws://localhost:3000')

      const teamId = sigchainService.activeChain.team!.id
      const serializer = (qssService as any).serializer

      const encryptedPayload = sigchainService.activeChain.crypto.encryptAndSign('test message', {
        type: EncryptionScopeType.ROLE,
        name: RoleName.MEMBER,
      })

      await localDbService.addDLQDecryptEntry(teamId, encryptedPayload, serializer)
      expect(await localDbService.getDLQDecryptCount(teamId)).toBe(1)

      const ingestSpy = jest.spyOn(orbitDbService, 'ingestEntries').mockResolvedValue()

      // Track processDLQDecrypt calls
      // @ts-ignore
      const processSpy = jest.spyOn(qssService, 'processDLQDecrypt')

      // Trigger first update
      sigchainService.emit('updated', sigchainService.activeChainTeamName)

      // Immediately trigger second update while first is processing
      sigchainService.emit('updated', sigchainService.activeChainTeamName)

      await waitForExpect(async () => {
        const remainingCount = await localDbService.getDLQDecryptCount(teamId)
        expect(remainingCount).toBe(0)
      })

      // Should have been called at least twice (initial + retry)
      expect(processSpy.mock.calls.length).toBeGreaterThanOrEqual(2)

      ingestSpy.mockRestore()
      processSpy.mockRestore()
    })

    it('skips processing when no active sigchain', async () => {
      await initCommunity({ qssEnabled: true, qssSetup: true })

      // Mock getActiveChain to return undefined
      const getActiveChainSpy = jest.spyOn(sigchainService, 'getActiveChain').mockReturnValue(undefined)

      const ingestSpy = jest.spyOn(orbitDbService, 'ingestEntries')

      // Trigger sigchain update
      sigchainService.emit('updated', sigchainService.activeChainTeamName)

      // Give it time to process
      await new Promise(resolve => setTimeout(resolve, 100))

      // ingestEntries should not have been called
      expect(ingestSpy).not.toHaveBeenCalled()

      getActiveChainSpy.mockRestore()
      ingestSpy.mockRestore()
    })
  })

  // Regression coverage for the architectural shape called out in
  // poc/qss-auth-conn-lost-after-flap-upstream: a single transient ERROR
  // from signInToCommunity left the QSS auto-flow stuck because
  // QSS_CONNECTED does not re-fire while the websocket is still up. The
  // fix is a one-shot, backoff-delayed retry of QSS_HANDLE_SIGN_IN
  // scheduled from inside the sign-in handler. Without the fix
  // signInToCommunity is called exactly once; with the fix it is called
  // a second time after ~50 ms (QSS_RECONNECT_DELAY_MS).
  describe('QSS_HANDLE_SIGN_IN retry on ERROR (regression)', () => {
    it('retries signInToCommunity once after a single ERROR result', async () => {
      await initCommunity({ qssEnabled: true, qssSetup: true })
      mockedAllowed = jest.spyOn(qssService, 'qssAllowed', 'get').mockReturnValue(true)

      const signInSpy = jest
        .spyOn(qssService, 'signInToCommunity')
        .mockResolvedValueOnce(QSSOperationResult.ERROR)
        .mockResolvedValueOnce(QSSOperationResult.SUCCESS)

      await qssService.connect('ws://localhost:3000')
      expect(qssService.connected).toBeTruthy()

      await waitForExpect(() => {
        expect(signInSpy).toHaveBeenCalledTimes(2)
      }, 5000)

      signInSpy.mockRestore()
    })
  })
})
