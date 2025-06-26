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

describe('QSSService', () => {
  let store: Store
  let factory: FactoryGirl
  let module: TestingModule
  let qssClient: QSSClient
  let qssService: QSSService
  let sigchainService: SigChainService
  let mockedCreateSocket: any
  let mockedSendMessage: any
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
      imports: [TestModule, QSSModule, SigChainModule],
    }).compile()
    qssService = module.get<QSSService>(QSSService)
    qssClient = module.get<QSSClient>(QSSClient)
    mockedCreateSocket = jest
      .spyOn(qssClient, 'createSocket')
      .mockImplementation(async (_qssEnabled: boolean, _qssEndpoint: string | undefined): Promise<ClientSocket> => {
        const socket = {
          ...new MockedSocket(),
          close: () => {},
          on: (event: string, callback: (...args: any[]) => void) => {},
          emit: (event: string, payload: any) => {},
          connected: true,
        } as any as ClientSocket
        qssClient.clientSocket = socket
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
    await module.close()
    mockedCreateSocket.mockRestore()
    if (mockedSendMessage != null) {
      mockedSendMessage.mockRestore()
    }
  })

  describe('connect', () => {
    it('connects to QSS when enabled and an endpoint string is provided', async () => {
      await qssService.connect(true, 'ws://localhost:3000')
      expect(qssService.connected).toBeTruthy()
      expect(qssService.enabled).toBeTruthy()
    })

    it(`doesn't connect to QSS when not enabled and an endpoint string is provided`, async () => {
      await qssService.connect(false, 'ws://localhost:3000')
      expect(qssService.connected).toBeFalsy()
      expect(qssService.enabled).toBeFalsy()
    })

    it(`doesn't connect to QSS when enabled but endpoint string is undefined`, async () => {
      await qssService.connect(true, undefined)
      expect(qssService.connected).toBeFalsy()
      expect(qssService.enabled).toBeFalsy()
    })

    it(`doesn't connect to QSS when enabled but endpoint string is empty`, async () => {
      await qssService.connect(true, '')
      expect(qssService.connected).toBeFalsy()
      expect(qssService.enabled).toBeFalsy()
    })
  })

  describe('createCommunity', () => {
    it(`creates a community on QSS`, async () => {
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
                  payload: {
                    status: CreateCommunityStatus.SUCCESS,
                  },
                } as T
              default:
                return undefined
            }
          }
        )
      await qssService.connect(true, 'ws://localhost:3000')
      expect(qssService.connected).toBeTruthy()
      expect(qssService.enabled).toBeTruthy()

      const created = await qssService.createCommunity(community, sigchainService.activeChain)
      await waitForExpect(() => {
        expect(mockedSendMessage).toHaveBeenNthCalledWith(
          1,
          WebsocketEvents.GEN_PUB_KEYS,
          expect.objectContaining({
            ts: expect.any(Number),
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
    })

    it(`fails to create community when failing to generate server keys`, async () => {
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
                    status: CommunityOperationStatus.ERROR,
                    reason: 'Failed to create server keys',
                  },
                } as T
              case WebsocketEvents.CREATE_COMMUNITY:
                return {
                  ts: DateTime.utc().toMillis(),
                  payload: {
                    status: CreateCommunityStatus.SUCCESS,
                  },
                } as T
              default:
                return undefined
            }
          }
        )
      await qssService.connect(true, 'ws://localhost:3000')
      expect(qssService.connected).toBeTruthy()
      expect(qssService.enabled).toBeTruthy()

      const created = await qssService.createCommunity(community, sigchainService.activeChain)
      await waitForExpect(() => {
        expect(mockedSendMessage).toHaveBeenNthCalledWith(
          1,
          WebsocketEvents.GEN_PUB_KEYS,
          expect.objectContaining({
            ts: expect.any(Number),
            payload: {
              teamId: sigchainService.team.id,
            },
          } as GeneratePublicKeysMessage),
          true
        )
      })
      expect(mockedSendMessage).toHaveBeenCalledTimes(1)
      expect(created).toBeFalsy()
    })

    it(`fails to create community when create community request fails`, async () => {
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
                  payload: {
                    status: CreateCommunityStatus.ERROR,
                    reason: 'Failed to create community',
                  },
                } as T
              default:
                return undefined
            }
          }
        )
      await qssService.connect(true, 'ws://localhost:3000')
      expect(qssService.connected).toBeTruthy()
      expect(qssService.enabled).toBeTruthy()

      const created = await qssService.createCommunity(community, sigchainService.activeChain)
      await waitForExpect(() => {
        expect(mockedSendMessage).toHaveBeenNthCalledWith(
          1,
          WebsocketEvents.GEN_PUB_KEYS,
          expect.objectContaining({
            ts: expect.any(Number),
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
    })

    it(`doesn't create a community when QSS is not connected`, async () => {
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
                  payload: {
                    status: CreateCommunityStatus.SUCCESS,
                  },
                } as T
              default:
                return undefined
            }
          }
        )
      expect(qssService.connected).toBeFalsy()
      expect(qssService.enabled).toBeFalsy()

      const created = await qssService.createCommunity(community, sigchainService.activeChain)
      expect(mockedSendMessage).toHaveBeenCalledTimes(0)
      expect(created).toBeFalsy()
    })
  })

  describe('signInToCommunity', () => {
    it(`signs into a community on QSS successfully`, async () => {
      mockedSendMessage = jest
        .spyOn(qssClient, 'sendMessage')
        .mockImplementation(
          async <T>(event: WebsocketEvents, payload: unknown, withAck = false): Promise<T | undefined> => {
            logger.debug('Sending event to QSS', event, payload, withAck)
            switch (event) {
              case WebsocketEvents.SIGN_IN_COMMUNITY:
                return {
                  ts: DateTime.utc().toMillis(),
                  payload: {
                    status: CommunityOperationStatus.SUCCESS,
                  },
                } as T
              default:
                return undefined
            }
          }
        )
      await qssService.connect(true, 'ws://localhost:3000')
      expect(qssService.connected).toBeTruthy()
      expect(qssService.enabled).toBeTruthy()

      await qssService.signInToCommunity(sigchainService.activeChain.team!.id, sigchainService.activeChain)
      await waitForExpect(() => {
        expect(mockedSendMessage).toHaveBeenNthCalledWith(
          1,
          WebsocketEvents.SIGN_IN_COMMUNITY,
          expect.objectContaining({
            ts: expect.any(Number),
            payload: {
              status: CommunityOperationStatus.SUCCESS,
              payload: {
                userId: sigchainService.user.userId,
                teamId: sigchainService.team.id,
              },
            },
          } as CommunitySignInMessage),
          true
        )
      })
      await waitForExpect(() => {
        expect(qssService.joinStatus(sigchainService.team.id)).toBe(JoinStatus.JOINED)
      })
      expect(mockedSendMessage).toHaveBeenCalledTimes(2)
    })

    it(`doesn't sign in to community when QSS is not connected`, async () => {
      mockedSendMessage = jest
        .spyOn(qssClient, 'sendMessage')
        .mockImplementation(
          async <T>(event: WebsocketEvents, payload: unknown, withAck = false): Promise<T | undefined> => {
            logger.debug('Sending event to QSS', event, payload, withAck)
            switch (event) {
              case WebsocketEvents.SIGN_IN_COMMUNITY:
                return {
                  ts: DateTime.utc().toMillis(),
                  payload: {
                    status: CommunityOperationStatus.SUCCESS,
                  },
                } as T
              default:
                return undefined
            }
          }
        )

      await qssService.signInToCommunity(sigchainService.activeChain.team!.id, sigchainService.activeChain)
      expect(qssService.joinStatus(sigchainService.team.id)).toBe(JoinStatus.NOT_STARTED)
      expect(mockedSendMessage).toHaveBeenCalledTimes(0)
    })

    it(`throws an error when sign in fails`, async () => {
      mockedSendMessage = jest
        .spyOn(qssClient, 'sendMessage')
        .mockImplementation(
          async <T>(event: WebsocketEvents, payload: unknown, withAck = false): Promise<T | undefined> => {
            logger.debug('Sending event to QSS', event, payload, withAck)
            switch (event) {
              case WebsocketEvents.SIGN_IN_COMMUNITY:
                return {
                  ts: DateTime.utc().toMillis(),
                  payload: {
                    status: CommunityOperationStatus.ERROR,
                    reason: 'Failed to sign in',
                  },
                } as T
              default:
                return undefined
            }
          }
        )
      await qssService.connect(true, 'ws://localhost:3000')
      expect(qssService.connected).toBeTruthy()
      expect(qssService.enabled).toBeTruthy()

      let error: Error | undefined = undefined
      try {
        await qssService.signInToCommunity(sigchainService.activeChain.team!.id, sigchainService.activeChain)
      } catch (e) {
        error = e
      }
      await waitForExpect(() => {
        expect(mockedSendMessage).toHaveBeenNthCalledWith(
          1,
          WebsocketEvents.SIGN_IN_COMMUNITY,
          expect.objectContaining({
            ts: expect.any(Number),
            payload: {
              status: CommunityOperationStatus.SUCCESS,
              payload: {
                userId: sigchainService.user.userId,
                teamId: sigchainService.team.id,
              },
            },
          } as CommunitySignInMessage),
          true
        )
      })
      expect(error).toBeDefined()
      expect(error?.message.includes('Error while signing in to community')).toBeTruthy()
      expect(qssService.joinStatus(sigchainService.team.id)).toBe(JoinStatus.NOT_STARTED)
      expect(mockedSendMessage).toHaveBeenCalledTimes(1)
    })
  })
})
