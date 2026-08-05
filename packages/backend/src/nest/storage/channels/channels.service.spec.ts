import { jest } from '@jest/globals'

import { Test, TestingModule } from '@nestjs/testing'
import { getBaseTypesFactory } from '@quiet/state-manager'
import {
  ChannelMessage,
  ChannelOperationStatus,
  ChannelSubscribedPayload,
  ChannelsReplicatedPayload,
  Community,
  CreateChannelPayload,
  CreateChannelResponse,
  DeleteChannelPayload,
  DeleteChannelResponse,
  FileMetadata,
  MessageType,
  PublicChannel,
  SocketActions,
  SocketEvents,
} from '@quiet/types'

import path from 'path'
import { type PeerId } from '@libp2p/interface'
import { Entry, type LogEntry } from '@orbitdb/core'
import waitForExpect from 'wait-for-expect'
import { TestModule } from '../../common/test.module'
import { createArbitraryFile, libp2pInstanceParams } from '../../common/utils'
import { IpfsModule } from '../../ipfs/ipfs.module'
import { IpfsService } from '../../ipfs/ipfs.service'
import { Libp2pModule } from '../../libp2p/libp2p.module'
import { Libp2pService } from '../../libp2p/libp2p.service'
import { SocketModule } from '../../socket/socket.module'
import { StorageModule } from '../storage.module'
import { StorageService } from '../storage.service'
import fs from 'fs'
import { type FactoryGirl } from 'factory-girl'
import { fileURLToPath } from 'url'
import { LocalDbModule } from '../../local-db/local-db.module'
import { LocalDbService } from '../../local-db/local-db.service'
import { createLogger } from '../../common/logger'
import { ChannelsService } from './channels.service'
import { SigChainService } from '../../auth/sigchain.service'
import { CID } from 'multiformats/cid'
import { SigChain } from '../../auth/sigchain'
import { RoleName } from '../../auth/services/roles/roles'
import { EncryptedAndSignedPayload, EncryptionScopeType } from '../../auth/services/crypto/types'
import { InviteService } from '../../auth/services/invites/invite.service'
import { UserService } from '../../auth/services/members/user.service'
import { OrbitDbService } from '../orbitDb/orbitDb.service'
import { SigchainEvents } from '../../auth/types'
import crypto from 'crypto'
import { EventEmitter } from 'events'
import { StorageEvents } from '../storage.types'
import { OrbitDbOp } from '../orbitDb/orbitdb.types'

const logger = createLogger('channelsService:test')

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('ChannelsService', () => {
  let module: TestingModule
  let storageService: StorageService
  let ipfsService: IpfsService
  let libp2pService: Libp2pService
  let localDbService: LocalDbService
  let channelsService: ChannelsService
  let orbitDbService: OrbitDbService
  let sigChainService: SigChainService
  let peerId: PeerId

  let factory: FactoryGirl
  let channel: PublicChannel
  let message: ChannelMessage
  let filePath: string
  let community: Community

  let aliceUserId: string

  jest.setTimeout(50000)

  beforeAll(async () => {
    factory = await getBaseTypesFactory()
  })

  beforeEach(async () => {
    jest.clearAllMocks()
    filePath = path.join(dirname, '/500kB-file.txt')

    module = await Test.createTestingModule({
      imports: [TestModule, StorageModule, IpfsModule, SocketModule, Libp2pModule, LocalDbModule],
    }).compile()

    storageService = await module.resolve(StorageService)
    channelsService = await module.resolve(ChannelsService)
    orbitDbService = await module.resolve(OrbitDbService)
    localDbService = await module.resolve(LocalDbService)
    libp2pService = await module.resolve(Libp2pService)
    ipfsService = await module.resolve(IpfsService)
    sigChainService = await module.resolve(SigChainService)

    const params = await libp2pInstanceParams()
    peerId = params.peerId.peerId

    await libp2pService.createInstance(params)
    expect(libp2pService.libp2pInstance).not.toBeNull()

    await localDbService.open()
    expect(localDbService.getStatus()).toEqual('open')

    community = await factory.create<Community>('Community')

    await localDbService.setCommunity(community)
    await localDbService.setCurrentCommunityId(community.id)

    await sigChainService.createChain(true)
    aliceUserId = sigChainService.getActiveChain().user.userId

    await storageService.init()

    channel = await factory.build<PublicChannel>('PublicChannel', {
      owner: aliceUserId,
    })

    message = await factory.build('ChannelMessage', {
      channelId: channel.id,
      userId: aliceUserId,
    })
  })

  const createNonAdminMemberChain = (username: string): SigChain => {
    const adminChain = sigChainService.getActiveChain()
    const invite = adminChain.invites.createUserInvite()
    const salt = `${username}-metadata-validation-salt`

    adminChain.lockbox.createInviteLockboxes(invite.seed, salt, RoleName.MEMBER)

    const invitedChain = SigChain.createFromInvite({ seed: invite.seed })
    adminChain.invites.admitMemberFromInvite(
      InviteService.generateProof(invite.seed),
      invitedChain.user.userName,
      invitedChain.user.userId,
      UserService.redactUser(invitedChain.user).keys
    )

    const joinedChain = SigChain.joinForTesting(
      {
        user: invitedChain.user,
        device: invitedChain.device,
      },
      adminChain.save(),
      adminChain.team!.teamKeyring()
    )
    joinedChain.roles.addSelf(RoleName.MEMBER, invite.seed, salt)

    expect(joinedChain.roles.amIAdmin()).toBe(false)
    expect(joinedChain.roles.amIMemberOfRole(RoleName.MEMBER)).toBe(true)

    return joinedChain
  }

  const channelPutEntry = (
    key: string,
    value: EncryptedAndSignedPayload,
    hash: string = 'test-channel-metadata-entry',
    identity: string = 'test-channel-put-identity',
    storeId: string = 'test-channel-metadata-store'
  ): LogEntry<EncryptedAndSignedPayload> =>
    ({
      id: storeId,
      hash,
      identity,
      payload: {
        op: OrbitDbOp.PUT,
        key,
        value,
      },
    }) as unknown as LogEntry<EncryptedAndSignedPayload>

  const channelDelEntry = (
    key: string,
    identity: string = 'test-channel-delete-identity',
    hash: string = 'test-channel-metadata-delete-entry',
    storeId: string = 'test-channel-metadata-store'
  ): LogEntry<EncryptedAndSignedPayload> =>
    ({
      id: storeId,
      hash,
      identity,
      payload: {
        op: OrbitDbOp.DEL,
        key,
      },
    }) as unknown as LogEntry<EncryptedAndSignedPayload>

  const mockChannelEntryIdentity = (userId: string): (() => void) => {
    const identities = orbitDbService.identities
    expect(identities).toBeDefined()
    const teamId = sigChainService.getActiveChain().team!.id
    const getIdentitySpy = jest.spyOn(identities!, 'getIdentity').mockResolvedValue({ id: userId, teamId } as any)
    const verifyIdentitySpy = jest.spyOn(identities!, 'verifyIdentity').mockResolvedValue(true)
    const entryVerifySpy = jest.spyOn(Entry, 'verify').mockResolvedValue(true)

    return () => {
      getIdentitySpy.mockRestore()
      verifyIdentitySpy.mockRestore()
      entryVerifySpy.mockRestore()
    }
  }

  const expectChannelEntryValidation = async (
    entry: LogEntry<EncryptedAndSignedPayload>,
    writerUserId: string,
    expected: boolean,
    validator: 'public' | 'private' = 'public'
  ): Promise<void> => {
    const restoreIdentityMocks = mockChannelEntryIdentity(writerUserId)

    try {
      switch (validator) {
        case 'public':
          await expect(channelsService.validatePublicChannelMetadataEntry(entry)).resolves.toBe(expected)
          break
        case 'private':
          await expect(channelsService.validatePrivateChannelMetadataEntry(entry)).resolves.toBe(expected)
          break
      }
    } finally {
      restoreIdentityMocks()
    }
  }

  type MockStateManagerSocket = EventEmitter & {
    channelSubscribedPayloads: ChannelSubscribedPayload[]
    channelsStoredPayloads: ChannelsReplicatedPayload[]
    emitWithAck: <Response>(
      event: SocketActions.CREATE_CHANNEL | SocketActions.DELETE_CHANNEL,
      payload: CreateChannelPayload | DeleteChannelPayload
    ) => Promise<Response>
  }

  const createMockStateManagerSocket = (): MockStateManagerSocket => {
    const socket = new EventEmitter() as MockStateManagerSocket
    socket.channelSubscribedPayloads = []
    socket.channelsStoredPayloads = []

    socket.on(SocketEvents.CHANNEL_SUBSCRIBED, (payload: ChannelSubscribedPayload) => {
      socket.channelSubscribedPayloads.push(payload)
    })
    socket.on(SocketEvents.CHANNELS_STORED, (payload: ChannelsReplicatedPayload) => {
      socket.channelsStoredPayloads.push(payload)
    })

    socket.emitWithAck = async <Response>(
      event: SocketActions.CREATE_CHANNEL | SocketActions.DELETE_CHANNEL,
      payload: CreateChannelPayload | DeleteChannelPayload
    ): Promise<Response> => {
      return await new Promise<Response>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error(`Timed out waiting for ${event} ack`))
        }, 5000)
        const callback = (response: Response) => {
          clearTimeout(timeout)
          resolve(response)
        }
        const emitted = socket.emit(event, payload, callback)
        if (!emitted) {
          clearTimeout(timeout)
          reject(new Error(`No mock socket listener registered for ${event}`))
        }
      })
    }

    return socket
  }

  const connectMockStateManagerSocket = (socket: MockStateManagerSocket): (() => void) => {
    const handleCreateChannel = async (
      payload: CreateChannelPayload,
      callback: (response: CreateChannelResponse) => void
    ) => {
      try {
        callback(await channelsService.handleCreateChannel(payload))
      } catch {
        callback({ status: ChannelOperationStatus.FAILED })
      }
    }
    const handleDeleteChannel = async (
      payload: DeleteChannelPayload,
      callback: (response: DeleteChannelResponse) => void
    ) => {
      callback(await channelsService.deleteChannel(payload))
    }
    const forwardChannelsStored = (payload: ChannelsReplicatedPayload) => {
      socket.emit(SocketEvents.CHANNELS_STORED, payload)
    }
    const forwardChannelSubscribed = (payload: ChannelSubscribedPayload) => {
      socket.emit(SocketEvents.CHANNEL_SUBSCRIBED, payload)
    }

    socket.on(SocketActions.CREATE_CHANNEL, handleCreateChannel)
    socket.on(SocketActions.DELETE_CHANNEL, handleDeleteChannel)
    channelsService.on(StorageEvents.CHANNELS_STORED, forwardChannelsStored)
    channelsService.on(StorageEvents.CHANNEL_SUBSCRIBED, forwardChannelSubscribed)

    return () => {
      socket.off(SocketActions.CREATE_CHANNEL, handleCreateChannel)
      socket.off(SocketActions.DELETE_CHANNEL, handleDeleteChannel)
      channelsService.off(StorageEvents.CHANNELS_STORED, forwardChannelsStored)
      channelsService.off(StorageEvents.CHANNEL_SUBSCRIBED, forwardChannelSubscribed)
      socket.removeAllListeners()
    }
  }

  afterEach(async () => {
    await storageService.stop()
    await libp2pService.close()
    if (fs.existsSync(filePath)) {
      fs.rmSync(filePath)
    }
    await module.close()
  })

  describe('Channels', () => {
    it('generates an opaque channel id and stores metadata encrypted', async () => {
      const payload: CreateChannelPayload = {
        name: 'secret-channel-name',
        description: 'secret channel description',
        public: true,
        teamId: community.teamId!,
      }

      const response = await channelsService.handleCreateChannel(payload)

      expect(response.status).toBe(ChannelOperationStatus.SUCCESS)
      expect(response.channel).toBeDefined()
      expect(response.channel!.id).toMatch(/^[0-9a-f]{32}$/)
      expect(response.channel!.id).not.toContain(payload.name)
      expect(response.channel!.name).toBe(payload.name)

      const encryptedEntry = await channelsService.channels!.get(response.channel!.id)
      expect(encryptedEntry).toBeDefined()
      const serializedEntry = JSON.stringify(encryptedEntry)
      expect(serializedEntry).not.toContain(payload.name)
      expect(serializedEntry).not.toContain(payload.description!)
      await expect(channelsService.getChannel(response.channel!.id)).resolves.toEqual(response.channel)
    })

    it('subscribes to a created channel before returning success', async () => {
      const payload: CreateChannelPayload = {
        name: 'ready-channel-name',
        description: 'ready channel description',
        public: true,
        teamId: community.teamId!,
      }
      const subscribedChannelIds: string[] = []
      channelsService.on(StorageEvents.CHANNEL_SUBSCRIBED, payload => {
        subscribedChannelIds.push(payload.channelId)
      })

      const response = await channelsService.handleCreateChannel(payload)

      expect(response.status).toBe(ChannelOperationStatus.SUCCESS)
      expect(response.channel).toBeDefined()
      const repo = channelsService.channelsRepos.get(response.channel!.id)
      expect(repo).toBeDefined()
      expect(repo!.eventsAttached).toBe(true)
      expect(repo!.subscribed).toBe(true)
      expect(subscribedChannelIds).toContain(response.channel!.id)
    })

    it('stress tests channel repo lifecycle through a mocked state-manager socket', async () => {
      const stateManagerSocket = createMockStateManagerSocket()
      const disconnectSocket = connectMockStateManagerSocket(stateManagerSocket)
      const getLatestStoredChannels = (): PublicChannel[] =>
        stateManagerSocket.channelsStoredPayloads[stateManagerSocket.channelsStoredPayloads.length - 1]?.channels ?? []

      try {
        const createPayloads: CreateChannelPayload[] = Array.from({ length: 6 }, (_, index) => ({
          name: `socket-channel-${index}`,
          description: `socket channel ${index}`,
          public: true,
          teamId: community.teamId!,
        }))

        const createResponses = await Promise.all(
          createPayloads.map(payload =>
            stateManagerSocket.emitWithAck<CreateChannelResponse>(SocketActions.CREATE_CHANNEL, payload)
          )
        )
        const createdChannels = createResponses.map(response => response.channel!)
        const createdChannelIds = createdChannels.map(createdChannel => createdChannel.id)

        expect(createResponses.every(response => response.status === ChannelOperationStatus.SUCCESS)).toBe(true)
        expect(new Set(createdChannelIds).size).toBe(createPayloads.length)
        for (const createdChannel of createdChannels) {
          const repo = channelsService.channelsRepos.get(createdChannel.id)
          expect(repo).toBeDefined()
          expect(repo!.eventsAttached).toBe(true)
          expect(repo!.subscribed).toBe(true)
          expect(repo!.public).toBe(true)
          await expect(channelsService.getChannel(createdChannel.id)).resolves.toEqual(createdChannel)
        }

        const replicatedChannel = await factory.build<PublicChannel>('PublicChannel', {
          id: 'socket-metadata-update-channel-id',
          name: 'socket-metadata-update-channel',
          description: 'channel replicated through metadata update',
          owner: aliceUserId,
          teamId: community.teamId!,
          public: true,
        })
        await channelsService.setChannel(replicatedChannel)

        const expectedSubscribedIds = [...createdChannelIds, replicatedChannel.id]
        await waitForExpect(() => {
          const subscribedIds = stateManagerSocket.channelSubscribedPayloads.map(payload => payload.channelId)
          for (const channelId of expectedSubscribedIds) {
            expect(subscribedIds.filter(id => id === channelId)).toHaveLength(1)
          }
          const replicatedRepo = channelsService.channelsRepos.get(replicatedChannel.id)
          expect(replicatedRepo).toBeDefined()
          expect(replicatedRepo!.eventsAttached).toBe(true)
          expect(replicatedRepo!.subscribed).toBe(true)
          expect(getLatestStoredChannels().map(storedChannel => storedChannel.id)).toEqual(
            expect.arrayContaining(expectedSubscribedIds)
          )
        })

        const subscriptionEventsBeforeResubscribe = stateManagerSocket.channelSubscribedPayloads.length
        await Promise.all(
          createdChannels
            .flatMap(createdChannel => [createdChannel, createdChannel])
            .map(createdChannel => channelsService.subscribeToChannel(createdChannel))
        )
        expect(stateManagerSocket.channelSubscribedPayloads).toHaveLength(subscriptionEventsBeforeResubscribe)

        const channelIdsToDelete = [createdChannels[1].id, createdChannels[4].id, replicatedChannel.id]
        const deleteResponses = await Promise.all(
          channelIdsToDelete.map(channelId =>
            stateManagerSocket.emitWithAck<DeleteChannelResponse>(SocketActions.DELETE_CHANNEL, { channelId })
          )
        )
        expect(deleteResponses).toEqual(channelIdsToDelete.map(channelId => ({ channelId, deleted: true })))

        for (const channelId of channelIdsToDelete) {
          expect(channelsService.channelsRepos.has(channelId)).toBe(false)
          await expect(channelsService.getChannel(channelId)).resolves.toBeUndefined()
        }

        const survivingChannelIds = createdChannelIds.filter(channelId => !channelIdsToDelete.includes(channelId))
        for (const channelId of survivingChannelIds) {
          const repo = channelsService.channelsRepos.get(channelId)
          expect(repo).toBeDefined()
          expect(repo!.eventsAttached).toBe(true)
          expect(repo!.subscribed).toBe(true)
          await expect(channelsService.getChannel(channelId)).resolves.toBeDefined()
        }

        await channelsService.broadcastCurrentChannels()

        await waitForExpect(() => {
          const latestStoredChannelIds = getLatestStoredChannels().map(storedChannel => storedChannel.id)
          expect([...latestStoredChannelIds].sort()).toEqual([...survivingChannelIds].sort())
        })
      } finally {
        disconnectSocket()
      }
    })

    it('shares one subscription promise for concurrent subscribe calls', async () => {
      const channel = await factory.build<PublicChannel>('PublicChannel', {
        owner: aliceUserId,
        teamId: community.teamId!,
      })
      let resolveSubscription: () => void = () => {}
      const subscriptionGate = new Promise<void>(resolve => {
        resolveSubscription = resolve
      })
      const store = new EventEmitter() as any
      store.subscribe = jest.fn(async () => await subscriptionGate)
      const subscribedChannelIds: string[] = []
      channelsService.channelsRepos.set(channel.id, {
        store,
        eventsAttached: false,
        subscribed: false,
        public: true,
      })
      channelsService.on(StorageEvents.CHANNEL_SUBSCRIBED, payload => {
        subscribedChannelIds.push(payload.channelId)
      })

      const firstSubscription = channelsService.subscribeToChannel(channel)
      const secondSubscription = channelsService.subscribeToChannel(channel)
      await Promise.resolve()

      expect(store.subscribe).toHaveBeenCalledTimes(1)
      expect(channelsService.channelsRepos.get(channel.id)!.eventsAttached).toBe(true)
      expect(channelsService.channelsRepos.get(channel.id)!.subscribed).toBe(false)

      resolveSubscription()
      await Promise.all([firstSubscription, secondSubscription])

      expect(channelsService.channelsRepos.get(channel.id)!.subscribed).toBe(true)
      expect(subscribedChannelIds).toEqual([channel.id])
    })

    it('shares one channel creation for concurrent subscribe calls before a repo exists', async () => {
      const channel = await factory.build<PublicChannel>('PublicChannel', {
        owner: aliceUserId,
        teamId: community.teamId!,
      })
      let resolveStoreCreation: (store: any) => void = () => {}
      const storeCreationGate = new Promise<any>(resolve => {
        resolveStoreCreation = resolve
      })
      const store = new EventEmitter() as any
      store.subscribe = jest.fn(async () => {})
      const createChannelStoreSpy = jest
        .spyOn(channelsService as any, 'createChannelStore')
        .mockImplementation(async () => await storeCreationGate)

      try {
        const firstSubscription = channelsService.subscribeToChannel(channel)
        const secondSubscription = channelsService.subscribeToChannel(channel)
        await Promise.resolve()

        expect(createChannelStoreSpy).toHaveBeenCalledTimes(1)

        resolveStoreCreation(store)
        await Promise.all([firstSubscription, secondSubscription])

        expect(channelsService.channelsRepos.get(channel.id)?.store).toBe(store)
        expect(store.subscribe).toHaveBeenCalledTimes(1)
      } finally {
        createChannelStoreSpy.mockRestore()
      }
    })

    it('broadcasts current channels before background subscriptions settle', async () => {
      const channel = await factory.build<PublicChannel>('PublicChannel', {
        owner: aliceUserId,
        teamId: community.teamId!,
      })
      const store = new EventEmitter() as any
      store.subscribe = jest.fn(() => new Promise<void>(() => {}))
      channelsService.channelsRepos.set(channel.id, {
        store,
        eventsAttached: false,
        subscribed: false,
        public: true,
      })
      const getChannelsSpy = jest.spyOn(channelsService, 'getChannels').mockResolvedValue([channel])
      const channelsStoredPayloads: Array<{ channels: PublicChannel[] }> = []
      channelsService.on(StorageEvents.CHANNELS_STORED, payload => {
        channelsStoredPayloads.push(payload)
      })

      try {
        await channelsService.broadcastCurrentChannels()

        expect(channelsStoredPayloads).toEqual([{ channels: [channel] }])
        expect(store.subscribe).toHaveBeenCalledTimes(1)
      } finally {
        getChannelsSpy.mockRestore()
      }
    })

    it('retries channel id generation when a generated id already exists', async () => {
      const collidingId = '0'.repeat(32)
      const expectedId = '1'.repeat(32)
      const existingChannel = await factory.build<PublicChannel>('PublicChannel', {
        id: collidingId,
        owner: aliceUserId,
        teamId: community.teamId!,
      })
      await channelsService.setChannel(existingChannel)

      const randomBytesSpy = jest
        .spyOn(crypto, 'randomBytes')
        .mockReturnValueOnce(Buffer.from(collidingId, 'hex') as any)
        .mockReturnValueOnce(Buffer.from(expectedId, 'hex') as any)

      try {
        const response = await channelsService.handleCreateChannel({
          name: 'unique-channel-name',
          description: 'unique channel description',
          public: true,
          teamId: community.teamId!,
        })

        expect(response.channel!.id).toBe(expectedId)
        expect(randomBytesSpy.mock.calls.length).toBeGreaterThanOrEqual(2)
      } finally {
        randomBytesSpy.mockRestore()
      }
    })

    it('rebroadcasts channel metadata after sigchain updates', async () => {
      expect(channelsService.channels).toBeDefined()

      const retryIndexingSpy = jest
        .spyOn(channelsService.channels!, 'retryIndexingUnindexedEntries')
        .mockResolvedValue()
      const broadcastCurrentChannelsSpy = jest.spyOn(channelsService, 'broadcastCurrentChannels').mockResolvedValue()

      sigChainService.emit(SigchainEvents.UPDATED)

      await waitForExpect(() => {
        expect(retryIndexingSpy).toHaveBeenCalled()
        expect(broadcastCurrentChannelsSpy).toHaveBeenCalled()
      })
    })

    it('logs channel metadata update handler errors without rejecting the event', async () => {
      const events = new EventEmitter()
      const storeAddress = 'test-channel-metadata-store'
      const error = new Error('broadcast failed')
      const broadcastCurrentChannelsSpy = jest
        .spyOn(channelsService, 'broadcastCurrentChannels')
        .mockRejectedValue(error)
      const retryIndexingUnindexedEntries = jest.fn<() => Promise<void>>().mockResolvedValue()
      const loggerErrorSpy = jest.spyOn((channelsService as any).logger, 'error').mockImplementation(() => {})

      ;(channelsService as any).attachChannelMetadataUpdateHandler({
        events,
        address: storeAddress,
        retryIndexingUnindexedEntries,
      })
      events.emit('update', channelPutEntry('test-channel-id', {} as EncryptedAndSignedPayload))

      await waitForExpect(() => {
        expect(retryIndexingUnindexedEntries).toHaveBeenCalled()
        expect(broadcastCurrentChannelsSpy).toHaveBeenCalled()
        expect(loggerErrorSpy).toHaveBeenCalledWith('Error handling channels database update', error)
      })
    })

    it('ignores shared OrbitDB update events from non-channel metadata stores', async () => {
      const events = new EventEmitter()
      const retryIndexingUnindexedEntries = jest.fn<() => Promise<void>>().mockResolvedValue()
      const broadcastCurrentChannelsSpy = jest.spyOn(channelsService, 'broadcastCurrentChannels').mockResolvedValue()

      ;(channelsService as any).attachChannelMetadataUpdateHandler({
        events,
        address: 'test-channel-metadata-store',
        retryIndexingUnindexedEntries,
      })
      events.emit(
        'update',
        channelPutEntry(
          'test-user-profile-id',
          {} as EncryptedAndSignedPayload,
          'test-user-profile-entry',
          'test-user-profile-identity',
          'test-user-profile-store'
        )
      )

      await new Promise(resolve => setImmediate(resolve))

      expect(retryIndexingUnindexedEntries).not.toHaveBeenCalled()
      expect(broadcastCurrentChannelsSpy).not.toHaveBeenCalled()
    })

    it('reindexes the channel metadata store before broadcasting channel updates', async () => {
      const events = new EventEmitter()
      const calls: string[] = []
      const retryIndexingUnindexedEntries = jest.fn<() => Promise<void>>().mockImplementation(async () => {
        calls.push('retry')
      })
      jest.spyOn(channelsService, 'broadcastCurrentChannels').mockImplementation(async () => {
        calls.push('broadcast')
      })
      ;(channelsService as any).attachChannelMetadataUpdateHandler({
        events,
        address: 'test-channel-metadata-store',
        retryIndexingUnindexedEntries,
      })
      events.emit('update', channelPutEntry('test-channel-id', {} as EncryptedAndSignedPayload))

      await waitForExpect(() => {
        expect(calls).toEqual(['retry', 'broadcast'])
      })
    })

    it('detaches channel metadata update handlers', async () => {
      const events = new EventEmitter()

      ;(channelsService as any).attachChannelMetadataUpdateHandler({
        events,
        address: 'test-channel-metadata-store',
        retryIndexingUnindexedEntries: jest.fn<() => Promise<void>>().mockResolvedValue(),
      })

      expect(events.listenerCount('update')).toBe(1)
      ;(channelsService as any).detachChannelMetadataUpdateHandlers()

      expect(events.listenerCount('update')).toBe(0)
    })

    it('deletes channel as owner', async () => {
      logger.info('Deleting channel as owner')
      await channelsService.subscribeToChannel(channel)

      const success: DeleteChannelResponse = {
        channelId: channel.id,
        deleted: true,
      }

      const result = await channelsService.deleteChannel({ channelId: channel.id })
      expect(result).toEqual(success)

      const channelFromKeyValueStore = (await channelsService.getChannels()).filter(x => x.id === channel.id)
      expect(channelFromKeyValueStore).toEqual([])
    })

    it('creates several channels and only deletes one without affecting others', async () => {
      logger.info('Creating several channels and deleting one')
      const channel1 = await factory.build<PublicChannel>('PublicChannel', {
        owner: aliceUserId,
        teamId: community.teamId!,
      })
      const channel2 = await factory.build<PublicChannel>('PublicChannel', {
        owner: aliceUserId,
        teamId: community.teamId!,
      })

      await channelsService.subscribeToChannel(channel1)
      await channelsService.subscribeToChannel(channel2)

      // send a message to channel1
      const message1 = await factory.build<ChannelMessage>('ChannelMessage', {
        channelId: channel1.id,
        userId: aliceUserId,
        message: 'Hello from channel 1',
      })
      const message2 = await factory.build<ChannelMessage>('ChannelMessage', {
        channelId: channel2.id,
        userId: aliceUserId,
        message: 'Hello from channel 2',
      })
      await channelsService.sendMessage(message1)
      await channelsService.sendMessage(message2)

      // Verify both channels have messages
      const messages1 = await channelsService.getMessages(channel1.id)
      const messages2 = await channelsService.getMessages(channel2.id)
      expect(messages1?.messages.length).toBe(1)
      expect(messages2?.messages.length).toBe(1)
      expect(messages1?.messages[0].channelId).toBe(channel1.id)
      expect(messages2?.messages[0].channelId).toBe(channel2.id)
      expect(messages1?.messages[0].id).toBe(message1.id)
      expect(messages2?.messages[0].id).toBe(message2.id)

      const channel1DBHead = // eslint-disable-next-line no-unsafe-optional-chaining
        (await channelsService.channelsRepos.get(channel1.id)?.store.getStore().log.heads())[0]
      logger.info('Channel 1 DB Head:', channel1DBHead)
      expect(channel1DBHead).toBeDefined()
      const channel2DBHead = // eslint-disable-next-line no-unsafe-optional-chaining
        (await channelsService.channelsRepos.get(channel2.id)?.store.getStore().log.heads())[0]
      expect(channel2DBHead).toBeDefined()
      expect(channel1DBHead).not.toEqual(channel2DBHead)

      // expect ipfsblockstore to have both channels data
      const abortController1 = new AbortController()
      setTimeout(() => abortController1.abort(), 100)
      const channel1DBHeadBlock = await ipfsService.ipfsInstance?.blockstore.get(CID.parse(channel1DBHead.hash), {
        signal: abortController1.signal,
      })
      expect(channel1DBHeadBlock).toBeDefined()
      expect(channel1DBHeadBlock?.byteLength).toBeGreaterThan(0)
      const abortController2 = new AbortController()
      setTimeout(() => abortController2.abort(), 100)
      const channel2DBHeadBlock = await ipfsService.ipfsInstance?.blockstore.get(CID.parse(channel2DBHead.hash), {
        signal: abortController2.signal,
      })
      expect(channel2DBHeadBlock).toBeDefined()
      expect(channel1DBHeadBlock?.byteLength).toBeGreaterThan(0)

      let channelDBDropped = false
      // Listen for channel DB drop event
      channelsService.channelsRepos
        .get(channel1.id)
        ?.store.getStore()
        .events.on('drop', () => {
          logger.info(`Channel DB for ${channel1.id} dropped`)
          channelDBDropped = true
        })
      // Now delete channel1
      const success: DeleteChannelResponse = {
        channelId: channel1.id,
        deleted: true,
      }

      logger.info(`Deleting channel ${channel1.id}`)
      const result = await channelsService.deleteChannel({ channelId: channel1.id })
      expect(result).toEqual(success)
      expect(channelDBDropped).toBeTruthy()

      const channelsFromKeyValueStore = await channelsService.getChannels()
      expect(channelsFromKeyValueStore).toEqual([channel2])
      const messages2AfterDeletion = await channelsService.getMessages(channel2.id)
      expect(messages2AfterDeletion?.messages.length).toBe(1)
      expect(messages2AfterDeletion?.messages[0].channelId).toBe(channel2.id)
      expect(messages2AfterDeletion?.messages[0].id).toBe(message2.id)

      // SKIPPED: we do not yet have a method implemented for deleting messages from a channel from the IPFS blockstore
      // expect ipfsblockstore to not have channel1's data
      // const abortController3 = new AbortController()
      // setTimeout(() => abortController3.abort(), 100)
      // const block = await ipfsService.ipfsInstance?.blockstore.get(CID.parse(channel1DBHead.hash), {
      //   signal: abortController3.signal,
      // })
      // expect(block).toBeUndefined()

      // expect ipfsblockstore to still have channel2's data
      const abortController4 = new AbortController()
      setTimeout(() => abortController4.abort(), 100)
      const block2 = await ipfsService.ipfsInstance?.blockstore.get(CID.parse(channel2DBHead.hash), {
        signal: abortController4.signal,
      })
      expect(block2).toBeDefined()
      expect(block2?.byteLength).toBeGreaterThan(0)

      // reopen channel 1 and verify it is empty
      logger.info(`Reopening channel ${channel1.id}`)
      await channelsService.subscribeToChannel(channel1)
    })

    it('stores private channel metadata outside the public channel metadata store', async () => {
      const privateChannel: PublicChannel = {
        id: 'private-metadata-store-channel-id',
        name: 'private-metadata-store-channel',
        description: 'private channel metadata store split',
        owner: aliceUserId,
        timestamp: Date.now(),
        public: false,
        teamId: community.teamId!,
      }
      privateChannel.roleName = sigChainService.getActiveChain().channels.create()

      await channelsService.createChannel(privateChannel)

      await expect(channelsService.channels!.get(privateChannel.id)).resolves.toBeUndefined()
      await expect(channelsService.privateChannels!.get(privateChannel.id)).resolves.toBeDefined()
      await expect(channelsService.getChannel(privateChannel.id)).resolves.toEqual(privateChannel)
    })

    it('does not append a second metadata PUT for an existing channel id', async () => {
      const publicChannel = await factory.build<PublicChannel>('PublicChannel', {
        owner: aliceUserId,
        teamId: community.teamId!,
      })
      await channelsService.setChannel(publicChannel)

      await channelsService.setChannel({
        ...publicChannel,
        name: 'renamed-channel',
      })

      const metadataLog = channelsService.channels!.log as unknown as {
        values: () => Promise<Array<LogEntry<EncryptedAndSignedPayload>>>
      }
      const metadataEntries = await metadataLog.values()
      const channelPuts = metadataEntries.filter(
        entry => entry.payload.op === OrbitDbOp.PUT && entry.payload.key === publicChannel.id
      )
      expect(channelPuts).toHaveLength(1)
      await expect(channelsService.getChannel(publicChannel.id)).resolves.toEqual(publicChannel)
    })

    it('subscribes before sending to an existing unsubscribed channel repo', async () => {
      const channel = await factory.build<PublicChannel>('PublicChannel', {
        owner: aliceUserId,
        teamId: community.teamId!,
      })
      const message = await factory.build<ChannelMessage>('ChannelMessage', {
        channelId: channel.id,
        userId: aliceUserId,
      })
      const store = new EventEmitter() as any
      store.subscribe = jest.fn(async () => {})
      store.sendMessage = jest.fn(async () => true)
      channelsService.channelsRepos.set(channel.id, {
        store,
        eventsAttached: false,
        subscribed: false,
        public: true,
      })
      const getChannelSpy = jest.spyOn(channelsService, 'getChannel').mockResolvedValue(channel)

      try {
        const sent = await channelsService.sendMessage(message)

        expect(sent).toBe(true)
        expect(store.subscribe).toHaveBeenCalledTimes(1)
        expect(store.sendMessage).toHaveBeenCalledWith(message)
        expect(channelsService.channelsRepos.get(channel.id)!.subscribed).toBe(true)
      } finally {
        getChannelSpy.mockRestore()
      }
    })

    // skipping because we don't have a strong way to prevent a user from deleting a channel yet
    it.skip('delete channel as standard user', async () => {
      logger.info('Deleting channel as standard user')
      const notOwnersChannel = await factory.build<PublicChannel>('PublicChannel', {
        owner: 'notAlice',
      })
      await channelsService.subscribeToChannel(notOwnersChannel)

      const failure: DeleteChannelResponse = {
        channelId: channel.id,
        deleted: false,
      }

      const result = await channelsService.deleteChannel({ channelId: channel.id })
      expect(result).toEqual(failure)

      const channelFromKeyValueStore = (await channelsService.getChannels()).filter(x => x.id === notOwnersChannel.id)
      expect(channelFromKeyValueStore).toEqual([notOwnersChannel])
    })
  })

  describe('Message access controller', () => {
    it('is saved to db if passed signature verification', async () => {
      await channelsService.subscribeToChannel(channel)

      const publicChannelRepo = channelsService.channelsRepos.get(message.channelId)
      expect(publicChannelRepo).not.toBeUndefined()
      const store = publicChannelRepo!.store
      const eventSpy = jest.spyOn(store, 'addEntry')

      const messageCopy = {
        ...message,
      }
      delete messageCopy.media

      await channelsService.sendMessage(messageCopy)

      // Confirm message has passed orbitdb validator (check signature verification only)
      expect(eventSpy).toHaveBeenCalled()
      const savedMessages = await channelsService.getMessages(channel.id)
      expect(savedMessages?.messages.length).toBe(1)
      expect(savedMessages?.messages[0]).toEqual({
        ...messageCopy,
        verified: true,
        teamId: sigChainService.activeChain.team!.id,
        encSignature: expect.objectContaining({
          author: {
            generation: 0,
            type: 'USER',
            name: sigChainService.getActiveChain().user.userId,
          },
          signature: expect.any(String),
        }),
      })
    })
  })

  describe('Channel metadata validation', () => {
    it('accepts legitimate public channel metadata encrypted to the member role', async () => {
      const publicChannel = await factory.build<PublicChannel>('PublicChannel', {
        owner: aliceUserId,
        teamId: community.teamId!,
      })
      const encryptedEntry = channelsService.encryptChannelEntry(publicChannel)

      await expectChannelEntryValidation(channelPutEntry(publicChannel.id, encryptedEntry), aliceUserId, true)
    })

    it('rejects public channel metadata when owner does not match the encrypted signature author', async () => {
      const malloryChain = createNonAdminMemberChain('mallory')
      const forgedPublicChannel = await factory.build<PublicChannel>('PublicChannel', {
        owner: aliceUserId,
        teamId: community.teamId!,
      })
      const forgedEntry = malloryChain.crypto.encryptAndSign(forgedPublicChannel, {
        type: EncryptionScopeType.ROLE,
        name: RoleName.MEMBER,
      })

      await expectChannelEntryValidation(
        channelPutEntry(forgedPublicChannel.id, forgedEntry, 'owner-encrypted-signature-mismatch'),
        malloryChain.user.userId,
        false
      )
    })

    it('rejects public channel metadata when owner lacks permissions', async () => {
      const malloryChain = createNonAdminMemberChain('mallory')
      const publicChannel = await factory.build<PublicChannel>('PublicChannel', {
        owner: malloryChain.user.userId,
        teamId: community.teamId!,
      })
      const entry = malloryChain.crypto.encryptAndSign(publicChannel, {
        type: EncryptionScopeType.ROLE,
        name: RoleName.MEMBER,
      })

      await expectChannelEntryValidation(
        channelPutEntry(publicChannel.id, entry, 'non-admin-public'),
        malloryChain.user.userId,
        false
      )
    })

    it('rejects public channel metadata when owner does not match the entry signature author', async () => {
      const malloryChain = createNonAdminMemberChain('mallory')
      const publicChannel = await factory.build<PublicChannel>('PublicChannel', {
        owner: aliceUserId,
        teamId: community.teamId!,
      })
      const encryptedEntry = channelsService.encryptChannelEntry(publicChannel)

      await expectChannelEntryValidation(
        channelPutEntry(publicChannel.id, encryptedEntry, 'owner-entry-signature-mismatch'),
        malloryChain.user.userId,
        false
      )
    })

    it('accepts admin-republished public channel metadata owned by another member', async () => {
      const malloryChain = createNonAdminMemberChain('mallory')
      const publicChannel = await factory.build<PublicChannel>('PublicChannel', {
        owner: malloryChain.user.userId,
        teamId: community.teamId!,
      })
      const encryptedEntry = malloryChain.crypto.encryptAndSign(publicChannel, {
        type: EncryptionScopeType.ROLE,
        name: RoleName.MEMBER,
      })

      await expectChannelEntryValidation(
        channelPutEntry(publicChannel.id, encryptedEntry, 'admin-republished-channel-metadata'),
        aliceUserId,
        true
      )
    })

    it('accepts legitimate private channel metadata encrypted to the channel role', async () => {
      const activeChain = sigChainService.getActiveChain()
      const privateChannel: PublicChannel = {
        id: 'legitimate-private-channel-id',
        name: 'legitimate-private-channel',
        description: 'legitimate private channel metadata',
        owner: aliceUserId,
        timestamp: Date.now(),
        public: false,
        teamId: community.teamId!,
      }
      privateChannel.roleName = activeChain.channels.create()
      const encryptedEntry = channelsService.encryptChannelEntry(privateChannel)

      await expectChannelEntryValidation(
        channelPutEntry(privateChannel.id, encryptedEntry),
        aliceUserId,
        true,
        'private'
      )
    })

    it('rejects private channel metadata in the public metadata store', async () => {
      const activeChain = sigChainService.getActiveChain()
      const privateChannel: PublicChannel = {
        id: 'public-store-private-channel-id',
        name: 'public-store-private-channel',
        description: 'private channel metadata in public store',
        owner: aliceUserId,
        timestamp: Date.now(),
        public: false,
        teamId: community.teamId!,
      }
      privateChannel.roleName = activeChain.channels.create()
      const encryptedEntry = channelsService.encryptChannelEntry(privateChannel)

      await expectChannelEntryValidation(
        channelPutEntry(privateChannel.id, encryptedEntry),
        aliceUserId,
        false,
        'public'
      )
      await expectChannelEntryValidation(
        channelPutEntry(privateChannel.id, encryptedEntry),
        aliceUserId,
        true,
        'private'
      )
    })

    it('rejects public channel metadata in the private metadata store', async () => {
      const publicChannel = await factory.build<PublicChannel>('PublicChannel', {
        owner: aliceUserId,
        teamId: community.teamId!,
      })
      const encryptedEntry = channelsService.encryptChannelEntry(publicChannel)

      await expectChannelEntryValidation(
        channelPutEntry(publicChannel.id, encryptedEntry),
        aliceUserId,
        false,
        'private'
      )
    })

    it('rejects forged private channel metadata encrypted to the broad member role', async () => {
      const malloryChain = createNonAdminMemberChain('mallory')
      const forgedPrivateChannel: PublicChannel = {
        id: 'private-channel-id',
        name: 'private-channel',
        description: 'forged private channel metadata',
        owner: malloryChain.user.userId,
        timestamp: Date.now(),
        public: false,
        roleName: RoleName.MEMBER,
        teamId: community.teamId!,
      }
      const forgedEntry = malloryChain.crypto.encryptAndSign(forgedPrivateChannel, {
        type: EncryptionScopeType.ROLE,
        name: RoleName.MEMBER,
      })

      await expectChannelEntryValidation(
        channelPutEntry(forgedPrivateChannel.id, forgedEntry, 'forged-private-channel-metadata'),
        malloryChain.user.userId,
        false,
        'private'
      )
    })

    it('rejects private channel metadata encrypted outside the channel role', async () => {
      const activeChain = sigChainService.getActiveChain()
      const malloryChain = createNonAdminMemberChain('mallory')
      const privateChannel: PublicChannel = {
        id: 'team-scoped-private-channel-id',
        name: 'team-scoped-private-channel',
        description: 'private channel metadata encrypted to team scope',
        owner: malloryChain.user.userId,
        timestamp: Date.now(),
        public: false,
        teamId: community.teamId!,
      }
      privateChannel.roleName = activeChain.channels.create()
      const teamScopedEntry = malloryChain.crypto.encryptAndSign(privateChannel, {
        type: EncryptionScopeType.TEAM,
      })

      await expectChannelEntryValidation(
        channelPutEntry(privateChannel.id, teamScopedEntry, 'team-scoped-private-channel-metadata'),
        malloryChain.user.userId,
        false,
        'private'
      )
    })

    it('rejects public metadata forged for an existing private channel id', async () => {
      const activeChain = sigChainService.getActiveChain()
      const malloryChain = createNonAdminMemberChain('mallory')
      const privateChannelId = 'downgraded-private-channel-id'
      activeChain.channels.create()

      const forgedPublicChannel: PublicChannel = {
        id: privateChannelId,
        name: 'downgraded-private-channel',
        description: 'forged public metadata for a private channel',
        owner: malloryChain.user.userId,
        timestamp: Date.now(),
        public: true,
        teamId: community.teamId!,
      }
      const forgedEntry = malloryChain.crypto.encryptAndSign(forgedPublicChannel, {
        type: EncryptionScopeType.ROLE,
        name: RoleName.MEMBER,
      })

      await expectChannelEntryValidation(
        channelPutEntry(forgedPublicChannel.id, forgedEntry, 'downgraded-private-channel-metadata'),
        malloryChain.user.userId,
        false
      )
    })

    it('rejects metadata that overwrites an existing channel owned by another member', async () => {
      const publicChannel = await factory.build<PublicChannel>('PublicChannel', {
        owner: aliceUserId,
        teamId: community.teamId!,
      })
      // Alice legitimately creates the channel
      await channelsService.setChannel(publicChannel)

      // Mallory tries to take it over by writing a fresh, self-signed entry under the same id
      const malloryChain = createNonAdminMemberChain('mallory')
      const hijackChannel: PublicChannel = {
        ...publicChannel,
        owner: malloryChain.user.userId,
        name: 'hijacked',
        description: 'hijacked channel metadata',
      }
      const hijackEntry = malloryChain.crypto.encryptAndSign(hijackChannel, {
        type: EncryptionScopeType.ROLE,
        name: RoleName.MEMBER,
      })

      await expectChannelEntryValidation(
        channelPutEntry(publicChannel.id, hijackEntry, 'channel-takeover-metadata'),
        malloryChain.user.userId,
        false
      )
    })

    it('rejects channel metadata stored under a different key', async () => {
      const malloryChain = createNonAdminMemberChain('mallory')
      const publicChannel = await factory.build<PublicChannel>('PublicChannel', {
        owner: malloryChain.user.userId,
        teamId: community.teamId!,
      })
      const encryptedEntry = malloryChain.crypto.encryptAndSign(publicChannel, {
        type: EncryptionScopeType.ROLE,
        name: RoleName.MEMBER,
      })

      await expectChannelEntryValidation(
        channelPutEntry('wrong-channel-id', encryptedEntry),
        malloryChain.user.userId,
        false
      )
    })

    it('accepts public channel metadata deletion from a sigchain admin', async () => {
      const publicChannel = await factory.build<PublicChannel>('PublicChannel', {
        owner: aliceUserId,
        teamId: community.teamId!,
        public: true,
      })
      await channelsService.setChannel(publicChannel)
      await expectChannelEntryValidation(channelDelEntry(publicChannel.id), aliceUserId, true, 'public')
    })

    it('accepts public channel metadata deletion from a sigchain admin even if no channel is found', async () => {
      await expectChannelEntryValidation(channelDelEntry('this-is-a-random-channel-id'), aliceUserId, true, 'public')
    })

    it('accepts private channel metadata deletion from a sigchain admin with found channel', async () => {
      const channelRoleName = sigChainService.activeChain.channels.create()
      const privateChannel = await factory.build<PublicChannel>('PublicChannel', {
        owner: aliceUserId,
        teamId: community.teamId!,
        public: false,
        roleName: channelRoleName,
      })
      await channelsService.setChannel(privateChannel)
      await expectChannelEntryValidation(channelDelEntry(privateChannel.id), aliceUserId, true, 'private')
    })

    it('rejects private channel metadata deletion from a sigchain admin when no channel is found', async () => {
      await expectChannelEntryValidation(channelDelEntry('this-is-a-random-channel-id'), aliceUserId, false, 'private')
    })

    it('rejects channel metadata deletion from a non-admin member', async () => {
      const malloryChain = createNonAdminMemberChain('mallory')

      await expectChannelEntryValidation(
        channelDelEntry('channel-id-to-delete', 'mallory-channel-delete-identity'),
        malloryChain.user.userId,
        false
      )
    })
  })

  describe('Files deletion', () => {
    let realFilePath: string
    let messages: {
      messages: Record<string, ChannelMessage>
    }
    let aliceMessage: ChannelMessage

    beforeEach(async () => {
      realFilePath = path.join(dirname, '/real-file.txt')
      await createArbitraryFile(realFilePath, 2147483)

      const media: FileMetadata = {
        path: realFilePath,
        name: 'test-large-file',
        ext: '.txt',
        cid: 'attachment_id',
        message: {
          id: 'id',
          channelId: channel.id,
        },
      }

      aliceMessage = await factory.build('ChannelMessage', {
        channelId: channel.id,
        userId: aliceUserId,
        type: MessageType.File,
        media: media,
      })

      messages = {
        messages: {
          [aliceMessage.id]: aliceMessage,
        },
      }
    })

    afterEach(() => {
      if (fs.existsSync(realFilePath)) {
        fs.rmSync(realFilePath)
      }
    })

    it('delete file correctly', async () => {
      expect(fs.existsSync(realFilePath)).toBeTruthy()
      expect(messages.messages[aliceMessage.id]?.media?.path).toEqual(realFilePath)
      const isFileExist = await channelsService.checkIfFileExist(realFilePath)
      expect(isFileExist).toBeTruthy()

      await expect(channelsService.deleteFilesFromChannel(messages)).resolves.not.toThrowError()

      await waitForExpect(async () => {
        expect(await channelsService.checkIfFileExist(realFilePath)).toBeFalsy()
      }, 2000)
    })

    it('file dont exist - not throw error', async () => {
      fs.rmSync(realFilePath)

      await waitForExpect(async () => {
        expect(await channelsService.checkIfFileExist(realFilePath)).toBeFalsy()
      }, 2000)

      await expect(channelsService.deleteFilesFromChannel(messages)).resolves.not.toThrowError()
    })
  })
})
