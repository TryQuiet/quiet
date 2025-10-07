import { Test, TestingModule } from '@nestjs/testing'
import { TestModule } from '../common/test.module'
import { QSSModule } from './qss.module'
import { QSSClient } from './qss.client'
import MockedSocket from 'socket.io-mock'
import { jest } from '@jest/globals'
import { type Socket as ClientSocket } from 'socket.io-client'
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
  QSSLogEntrySyncMessage,
  QSSOperationResult,
} from './qss.types'
import { createLogger } from '../common/logger'
import { Community, Identity } from '@quiet/types'
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
import { Libp2pNodeParams } from '../libp2p/libp2p.types'
import { spawnLibp2pInstancesInMemory } from '../common/test-utils'
import * as fs from 'fs'
import { EventsType } from '@orbitdb/core'
import { EventsWithStorage } from '../storage/orbitDb/eventsWithStorage'
import { MessagesAccessController } from '../storage/channels/messages/orbitdb/MessagesAccessController'
import { EncryptedAndSignedPayload, EncryptionScopeType } from '../auth/services/crypto/types'
import { RoleName } from '../auth/services/roles/roles'
import { IpfsFileManagerModule } from '../ipfs-file-manager/ipfs-file-manager.module'
import { IpfsModule } from '../ipfs/ipfs.module'
import { logEntryToLogUpdate } from '../storage/orbitDb/util'
import { OrbitDbModule } from '../storage/orbitDb/orbitdb.module'
import { QSSAuthConnectionManager } from './qss-auth-conn-manager.service'

describe('QSSService', () => {
  let store: Store
  let factory: FactoryGirl
  let module: TestingModule
  let qssClient: QSSClient
  let qssService: QSSService
  let qssAuthConnManager: QSSAuthConnectionManager
  let sigchainService: SigChainService
  let libp2pService: Libp2pService
  let ipfsService: IpfsService
  let orbitDbService: OrbitDbService
  let localDbService: LocalDbService
  let libp2pParams: Libp2pNodeParams
  let mockedCreateSocket: any
  let mockedGetSocket: any
  let mockedSendMessage: any
  let mockedJoinStatus: any
  let addPendingMessageSpy: any
  let mockedAllowed: any
  let community: Community
  let userIdentity: Identity

  const teamName = 'foobar'
  const username = 'testuser'
  const logger = createLogger('qss:service:test')

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
    libp2pService = await module.resolve(Libp2pService)
    libp2pParams = (await spawnLibp2pInstancesInMemory([module]))[0]

    ipfsService = await module.resolve(IpfsService)
    await ipfsService.createInstance()

    localDbService = await module.resolve(LocalDbService)
    orbitDbService = await module.resolve(OrbitDbService)
    await orbitDbService.create(ipfsService.ipfsInstance!)

    let socket = {
      ...new MockedSocket(),
      close: () => {},
      on: (event: string, callback: (...args: any[]) => void) => {},
      emit: (event: string, payload: any) => {},
      connected: false,
      active: false,
    } as any as ClientSocket
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
    sigchainService = module.get<SigChainService>(SigChainService)

    community = await factory.create('Community', {
      name: teamName,
    })
    userIdentity = await factory.create('Identity', {
      communityId: community.id,
      nickname: username,
    })
    await sigchainService.createChain(community.name!, username, true)
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

  describe('connect', () => {
    it('connects to QSS when enabled and an endpoint string is provided', async () => {
      mockedAllowed = jest.spyOn(qssService, 'qssAllowed', 'get').mockReturnValue(true)
      await qssService.connect('ws://localhost:3000')
      expect(qssService.connected).toBeTruthy()
      expect(qssService.canConnect).toBeTruthy()
    })

    it(`doesn't connect to QSS when not enabled and an endpoint string is provided`, async () => {
      mockedAllowed = jest.spyOn(qssService, 'qssAllowed', 'get').mockReturnValue(false)
      await qssService.connect('ws://localhost:3000')
      expect(qssService.connected).toBeFalsy()
      expect(qssService.canConnect).toBeFalsy()
    })

    it(`doesn't connect to QSS when enabled but endpoint string is undefined`, async () => {
      mockedAllowed = jest.spyOn(qssService, 'qssAllowed', 'get').mockReturnValue(true)
      await qssService.connect(undefined)
      expect(qssService.connected).toBeFalsy()
      expect(qssService.canConnect).toBeFalsy()
    })

    it(`doesn't connect to QSS when enabled but endpoint string is empty`, async () => {
      mockedAllowed = jest.spyOn(qssService, 'qssAllowed', 'get').mockReturnValue(true)
      await qssService.connect('')
      expect(qssService.connected).toBeFalsy()
      expect(qssService.canConnect).toBeFalsy()
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
      expect(mockedSendMessage).toHaveBeenCalledTimes(3)
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
  })

  describe('sendLogEntrySyncMessage', () => {
    it(`sends a successful log sync to QSS`, async () => {
      await initCommunity({ qssEnabled: true, qssSetup: true })
      const initStatusOrig = await qssService.getQssInitStatus()
      expect(initStatusOrig.qssSetup).toBeTruthy()

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
                const { teamId, hash, hashedDbId } = (payload as QSSLogEntrySyncMessage).payload!
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
      const update = logEntryToLogUpdate(entry, db.address)
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
          } as QSSLogEntrySyncMessage),
          true
        )
      })
      expect(result).toBe(true)
      expect(mockedSendMessage).toHaveBeenCalledTimes(1)

      const pendingMessages = await localDbService.getPendingQssLogSyncMessages()
      expect(pendingMessages).toEqual({})
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
                const { teamId, hash, hashedDbId } = (payload as QSSLogEntrySyncMessage).payload!
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
      const update = logEntryToLogUpdate(entry, db.address)
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
})
