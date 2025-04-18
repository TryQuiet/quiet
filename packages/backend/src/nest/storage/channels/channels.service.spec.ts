import { jest } from '@jest/globals'

import { Test, TestingModule } from '@nestjs/testing'
import { getBaseTypesFactory } from '@quiet/state-manager'
import {
  ChannelMessage,
  Community,
  DeleteChannelResponse,
  FileMetadata,
  Identity,
  MessageType,
  PublicChannel,
} from '@quiet/types'

import path from 'path'
import { type PeerId } from '@libp2p/interface'
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
  let sigChainService: SigChainService
  let peerId: PeerId

  let factory: FactoryGirl
  let channel: PublicChannel
  let message: ChannelMessage
  let filePath: string

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

    const community = await factory.create<Community>('Community')

    await localDbService.setCommunity(community)
    await localDbService.setCurrentCommunityId(community.id)

    await sigChainService.createChain(community.name!, 'alice', true)
    aliceUserId = sigChainService.getActiveChain().user.userId

    await storageService.init(peerId)

    channel = await factory.build<PublicChannel>('PublicChannel', {
      owner: aliceUserId,
    })

    message = await factory.build('ChannelMessage', {
      channelId: channel.id,
      userId: aliceUserId,
    })
  })

  afterEach(async () => {
    await libp2pService.libp2pInstance?.stop()
    await ipfsService.ipfsInstance?.stop()
    await storageService.stop()
    if (fs.existsSync(filePath)) {
      fs.rmSync(filePath)
    }
    await module.close()
  })

  describe('Channels', () => {
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

      const publicChannelRepo = channelsService.publicChannelsRepos.get(message.channelId)
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
        cid: 'uploading_id',
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
