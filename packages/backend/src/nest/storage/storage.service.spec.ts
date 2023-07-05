import { LazyModuleLoader } from '@nestjs/core'
import { Test, TestingModule } from '@nestjs/testing'
import { createUserCert, keyFromCertificate, parseCertificate } from '@quiet/identity'
import {
  prepareStore,
  getFactory,
  publicChannels,
  generateMessageFactoryContentWithId,
  Store,
} from '@quiet/state-manager'
import {
  ChannelMessage,
  Community,
  FileMetadata,
  Identity,
  MessageType,
  PublicChannel,
  TestMessage,
} from '@quiet/types'

import path from 'path'
import PeerId from 'peer-id'
import waitForExpect from 'wait-for-expect'
import { sleep } from '../common/sleep'
import { TestModule } from '../common/test.module'
import { createFile, libp2pInstanceParams, rootPermsData } from '../common/utils'
import { IpfsModule } from '../ipfs/ipfs.module'
import { IpfsService } from '../ipfs/ipfs.service'
import { Libp2pModule } from '../libp2p/libp2p.module'
import { Libp2pService } from '../libp2p/libp2p.service'
import { SocketModule } from '../socket/socket.module'
import { StorageModule } from './storage.module'
import { StorageService } from './storage.service'
import { StorageEvents } from './storage.types'
import fs from 'fs'
import { type FactoryGirl } from 'factory-girl'
import { fileURLToPath } from 'url'
import { jest } from '@jest/globals'
import { LocalDbModule } from '../local-db/local-db.module'
import { LocalDbService } from '../local-db/local-db.service'
import { IPFS_REPO_PATCH, ORBIT_DB_DIR, QUIET_DIR } from '../const'
import { LocalDBKeys } from '../local-db/local-db.types'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const actual = await import('../common/utils')
jest.unstable_mockModule('../common/utils', async () => {
  return {
    ...(actual as object),
    createPaths: jest.fn((paths: string[]) => {
      console.log('creating paths in fn - mock')
      for (const path of paths) {
        if (!fs.existsSync(path)) {
          fs.mkdirSync(path, { recursive: true })
        }
      }
    }),
  }
})

describe('StorageService', () => {
  let module: TestingModule
  let storageService: StorageService
  let ipfsService: IpfsService
  let libp2pService: Libp2pService
  let lazyModuleLoader: LazyModuleLoader
  let localDbService: LocalDbService
  let peerId: PeerId

  let store: Store
  let factory: FactoryGirl
  let community: Community
  let channel: PublicChannel
  let alice: Identity
  let john: Identity
  let message: ChannelMessage
  let channelio: PublicChannel
  let filePath: string
  let utils: any
  let orbitDbDir: string
  let ipfsRepoPatch: string
  let quietDir: string

  jest.setTimeout(50000)

  beforeAll(async () => {
    store = prepareStore().store
    factory = await getFactory(store)

    community = await factory.create<Community>('Community')

    channel = publicChannels.selectors.publicChannels(store.getState())[0]

    channelio = {
      name: channel.name,
      description: channel.description,
      owner: channel.owner,
      timestamp: channel.timestamp,
      id: channel.id,
    }

    alice = await factory.create<Identity>('Identity', { id: community.id, nickname: 'alice' })

    john = await factory.create<Identity>('Identity', { id: community.id, nickname: 'john' })

    message = (
      await factory.create<TestMessage>('Message', {
        identity: alice,
        message: generateMessageFactoryContentWithId(channel.id),
      })
    ).message
  })
  beforeEach(async () => {
    jest.clearAllMocks()
    utils = await import('../common/utils')
    filePath = path.join(dirname, '/500kB-file.txt')

    module = await Test.createTestingModule({
      imports: [TestModule, StorageModule, IpfsModule, SocketModule, Libp2pModule, LocalDbModule],
    }).compile()

    storageService = await module.resolve(StorageService)
    localDbService = await module.resolve(LocalDbService)

    lazyModuleLoader = await module.resolve(LazyModuleLoader)

    orbitDbDir = await module.resolve(ORBIT_DB_DIR)

    ipfsRepoPatch = await module.resolve(IPFS_REPO_PATCH)

    quietDir = await module.resolve(QUIET_DIR)

    const { Libp2pModule: ModuleLibp2p } = await import('../libp2p/libp2p.module')
    const moduleLibp2p = await lazyModuleLoader.load(() => ModuleLibp2p)
    const { Libp2pService } = await import('../libp2p/libp2p.service')
    libp2pService = moduleLibp2p.get(Libp2pService)

    const { IpfsModule: ModuleIpfs } = await import('../ipfs/ipfs.module')
    const moduleIpfs = await lazyModuleLoader.load(() => ModuleIpfs)
    const { IpfsService } = await import('../ipfs/ipfs.service')
    ipfsService = moduleIpfs.get(IpfsService)

    const params = await libp2pInstanceParams()
    peerId = params.peerId

    await libp2pService.createInstance(params)
    expect(libp2pService.libp2pInstance).not.toBeNull()

    await ipfsService.createInstance(peerId)
    expect(ipfsService.ipfsInstance).not.toBeNull()
    expect(localDbService.getStatus()).toEqual('open')

    await localDbService.put(LocalDBKeys.COMMUNITY, community)
  })

  afterEach(async () => {
    await libp2pService.libp2pInstance?.stop()
    await ipfsService.ipfsInstance?.stop()
    await storageService.stopOrbitDb()
    await sleep(300)
    // removeFilesFromDir(quietDir)
    if (fs.existsSync(filePath)) {
      fs.rmSync(filePath)
    }
    await module.close()
  })

  it('should be defined', async () => {
    await storageService.init(peerId)
  })

  describe('Storage', () => {
    // KACPER
    it('creates paths by default', async () => {
      expect(fs.existsSync(orbitDbDir)).toBe(false)
      //IPFS is created in before each
      // expect(fs.existsSync(ipfsRepoPatch)).toBe(false)

      const createPathsSpy = jest.spyOn(utils, 'createPaths')

      await storageService.init(peerId)

      expect(createPathsSpy).toHaveBeenCalled()

      expect(fs.existsSync(orbitDbDir)).toBe(true)

      expect(fs.existsSync(ipfsRepoPatch)).toBe(true)
    })

    it('should not create paths if createPaths is set to false', async () => {
      const orgProcessPlatform = process.platform
      Object.defineProperty(process, 'platform', {
        value: 'android',
      })
      expect(fs.existsSync(orbitDbDir)).toBe(false)
      //IPFS is created in before each
      // expect(fs.existsSync(ipfsRepoPatch)).toBe(false)

      const createPathsSpy = jest.spyOn(utils, 'createPaths')

      await storageService.init(peerId)

      expect(createPathsSpy).not.toHaveBeenCalled()
      Object.defineProperty(process, 'platform', {
        value: orgProcessPlatform,
      })
    })
  })

  describe('Channels', () => {
    it('deletes channel as owner', async () => {
      await storageService.init(peerId)
      await storageService.subscribeToChannel(channelio)

      const eventSpy = jest.spyOn(storageService, 'emit')

      await storageService.deleteChannel({ channelId: channelio.id, ownerPeerId: peerId.toString() })

      const channelFromKeyValueStore = storageService.channels.get(channelio.id)
      expect(channelFromKeyValueStore).toBeUndefined()
      expect(eventSpy).toBeCalledWith('channelDeletionResponse', {
        channelId: channelio.id,
      })
    })

    it('delete channel as standard user', async () => {
      await storageService.init(peerId)
      await storageService.subscribeToChannel(channelio)

      const eventSpy = jest.spyOn(storageService, 'emit')

      await storageService.deleteChannel({ channelId: channelio.id, ownerPeerId: 'random peer id' })

      const channelFromKeyValueStore = storageService.channels.get(channelio.id)
      expect(channelFromKeyValueStore).toEqual(channelio)
      expect(eventSpy).toBeCalledWith('channelDeletionResponse', {
        channelId: channelio.id,
      })
    })
  })

  describe('Certificate', () => {
    it('is saved to db if passed verification', async () => {
      const userCertificate = await createUserCert(
        rootPermsData.certificate,
        rootPermsData.privKey,
        // @ts-expect-error userCsr can be undefined
        alice.userCsr?.userCsr,
        new Date(),
        new Date(2030, 1, 1)
      )
      await storageService.init(peerId)

      const result = await storageService.saveCertificate({
        certificate: userCertificate.userCertString,
        rootPermsData,
      })

      await sleep(5000)
      expect(result).toBe(true)
    })

    it('is not saved to db if did not pass verification', async () => {
      const oldUserCertificate = await createUserCert(
        rootPermsData.certificate,
        rootPermsData.privKey,
        // @ts-expect-error userCsr can be undefined
        alice.userCsr?.userCsr,
        new Date(2021, 1, 1),
        new Date(2021, 1, 2)
      )

      await storageService.init(peerId)

      const result = await storageService.saveCertificate({
        certificate: oldUserCertificate.userCertString,
        rootPermsData,
      })

      expect(result).toBe(false)
    })

    it('is not saved to db if empty', async () => {
      await storageService.init(peerId)

      for (const empty of [null, '', undefined]) {
        // @ts-expect-error
        const result = await storageService.saveCertificate({ certificate: empty, rootPermsData })
        expect(result).toBe(false)
      }
    })

    it('username check fails if username is already in use', async () => {
      const userCertificate = await createUserCert(
        rootPermsData.certificate,
        rootPermsData.privKey,
        // @ts-expect-error userCsr can be undefined
        alice.userCsr?.userCsr,
        new Date(),
        new Date(2030, 1, 1)
      )

      await storageService.init(peerId)

      await storageService.saveCertificate({ certificate: userCertificate.userCertString, rootPermsData })

      for (const username of ['alice', 'Alice', 'Ąlicę', 'álicẽ']) {
        const usernameCert = storageService.usernameCert(username)
        expect(usernameCert).toEqual(userCertificate.userCertString)
      }
    })

    it('username check passes if username is not found in certificates', async () => {
      await storageService.init(peerId)

      const usernameCert = storageService.usernameCert('alice')

      expect(usernameCert).toBeNull()
    })

    it('Certificates and peers list are updated on replicated event', async () => {
      await storageService.init(peerId)
      const eventSpy = jest.spyOn(storageService, 'emit')
      const spyOnUpdatePeersList = jest.spyOn(storageService, 'updatePeersList')
      // @ts-ignore - Property 'certificates' is private
      storageService.certificates.events.emit('replicated')

      expect(eventSpy).toBeCalledWith('loadCertificates', {
        certificates: [],
      })
      expect(spyOnUpdatePeersList).toBeCalled()
    })

    it.each(['write', 'replicate.progress'])(
      'The message is verified valid on "%s" db event',
      async (eventName: string) => {
        const aliceMessage = await factory.create<ReturnType<typeof publicChannels.actions.test_message>['payload']>(
          'Message',
          {
            identity: alice,
            message: generateMessageFactoryContentWithId(channel.id),
          }
        )
        await storageService.init(peerId)

        await storageService.subscribeToChannel(channelio)

        const eventSpy = jest.spyOn(storageService, 'emit')
        console.log(
          'storageService.publicChannelsRepos.get(message.channelId)',
          storageService.publicChannelsRepos.get(message.channelId)
        )
        const publicChannelRepo = storageService.publicChannelsRepos.get(message.channelId)
        expect(publicChannelRepo).not.toBeUndefined()
        // @ts-expect-error
        const db = publicChannelRepo.db
        const messagePayload = {
          payload: {
            value: aliceMessage.message,
          },
        }

        switch (eventName) {
          case 'write':
            db.events.emit(eventName, 'address', messagePayload, [])
            break
          case 'replicate.progress':
            db.events.emit(eventName, 'address', 'hash', messagePayload, 'progress', 'total', [])
            break
        }

        await waitForExpect(() => {
          expect(eventSpy).toBeCalledWith('loadMessages', { isVerified: true, messages: [aliceMessage.message] })
        })
      }
    )

    it.each([['write'], ['replicate.progress']])(
      'The message is verified not valid on "%s" db event',
      async (eventName: string) => {
        const aliceMessage = await factory.create<ReturnType<typeof publicChannels.actions.test_message>['payload']>(
          'Message',
          {
            identity: alice,
            message: generateMessageFactoryContentWithId(channel.id),
          }
        )

        const johnMessage = await factory.create<ReturnType<typeof publicChannels.actions.test_message>['payload']>(
          'Message',
          {
            identity: john,
            message: generateMessageFactoryContentWithId(channel.id),
          }
        )

        const aliceMessageWithJohnsPublicKey: ChannelMessage = {
          ...aliceMessage.message,
          pubKey: johnMessage.message.pubKey,
        }

        await storageService.init(peerId)
        await storageService.subscribeToChannel(channelio)

        const spyOnEmit = jest.spyOn(storageService, 'emit')
        const publicChannelRepo = storageService.publicChannelsRepos.get(message.channelId)
        expect(publicChannelRepo).not.toBeUndefined()
        // @ts-expect-error
        const db = publicChannelRepo.db
        const messagePayload = {
          payload: {
            value: aliceMessageWithJohnsPublicKey,
          },
        }

        switch (eventName) {
          case 'write':
            db.events.emit(eventName, 'address', messagePayload, [])
            break
          case 'replicate.progress':
            db.events.emit(eventName, 'address', 'hash', messagePayload, 'progress', 'total', [])
            break
        }

        await waitForExpect(() => {
          expect(spyOnEmit).toBeCalledWith('loadMessages', {
            isVerified: false,
            messages: [aliceMessageWithJohnsPublicKey],
          })
        })
      }
    )

    it('Certificates and peers list are updated on write event', async () => {
      await storageService.init(peerId)
      const eventSpy = jest.spyOn(storageService, 'emit')
      const spyOnUpdatePeersList = jest.spyOn(storageService, 'updatePeersList')
      // @ts-ignore - Property 'certificates' is private
      storageService.certificates.events.emit('write', 'address', { payload: { value: 'something' } }, [])

      expect(eventSpy).toBeCalledWith(StorageEvents.LOAD_CERTIFICATES, {
        certificates: [],
      })
      expect(spyOnUpdatePeersList).toBeCalled()
    })
  })

  describe('Message access controller', () => {
    it('is saved to db if passed signature verification', async () => {
      await storageService.init(peerId)

      await storageService.subscribeToChannel(channelio)

      const publicChannelRepo = storageService.publicChannelsRepos.get(message.channelId)
      expect(publicChannelRepo).not.toBeUndefined()
      // @ts-expect-error
      const db = publicChannelRepo.db
      const eventSpy = jest.spyOn(db, 'add')

      const messageCopy = {
        ...message,
      }
      delete messageCopy.media

      await storageService.sendMessage(messageCopy)

      // Confirm message has passed orbitdb validator (check signature verification only)
      expect(eventSpy).toHaveBeenCalled()
      // @ts-expect-error
      const savedMessages = storageService.getAllEventLogEntries(db)
      expect(savedMessages.length).toBe(1)
      expect(savedMessages[0]).toEqual(messageCopy)
    })

    it('is not saved to db if did not pass signature verification', async () => {
      const aliceMessage = await factory.create<ReturnType<typeof publicChannels.actions.test_message>['payload']>(
        'Message',
        {
          identity: alice,
          message: generateMessageFactoryContentWithId(channel.id),
        }
      )
      // @ts-expect-error userCertificate can be undefined
      const johnCertificate: string = john.userCertificate
      const johnPublicKey = keyFromCertificate(parseCertificate(johnCertificate))

      const spoofedMessage = {
        ...aliceMessage.message,
        channelId: channelio.id,
        pubKey: johnPublicKey,
      }
      delete spoofedMessage.media // Media 'undefined' is not accepted by db.add

      await storageService.init(peerId)

      await storageService.subscribeToChannel(channelio)

      const publicChannelRepo = storageService.publicChannelsRepos.get(message.channelId)
      expect(publicChannelRepo).not.toBeUndefined()
      // @ts-expect-error
      const db = publicChannelRepo.db
      const eventSpy = jest.spyOn(db, 'add')

      await storageService.sendMessage(spoofedMessage)

      // Confirm message has passed orbitdb validator (check signature verification only)
      expect(eventSpy).toHaveBeenCalled()
      // @ts-expect-error getAllEventLogEntries is protected
      expect(storageService.getAllEventLogEntries(db).length).toBe(0)
    })
  })

  describe('Users', () => {
    it('gets all users from db', async () => {
      await storageService.init(peerId)
      const mockGetCertificates = jest.fn()
      // @ts-ignore - Property 'getAllEventLogEntries' is protected
      storageService.getAllEventLogEntries = mockGetCertificates
      mockGetCertificates.mockReturnValue([
        'MIICWzCCAgGgAwIBAgIGAYKIVrmoMAoGCCqGSM49BAMCMA8xDTALBgNVBAMTBG1haW4wHhcNMjIwODEwMTUxOTIxWhcNMzAwMTMxMjMwMDAwWjBJMUcwRQYDVQQDEz5wM29xZHI1M2RrZ2czbjVudWV6bHp5YXdoeHZpdDVlZnh6bHVudnpwN243bG12YTZmajNpNDNhZC5vbmlvbjBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABCAjxbiV781WC8O5emEdavPaQfR0FD8CaqC+P3R3uRdL9xuzGeUu8f5NIplSJ6abBMnanGgcMs34u82buiFROHqjggENMIIBCTAJBgNVHRMEAjAAMAsGA1UdDwQEAwIAgDAdBgNVHSUEFjAUBggrBgEFBQcDAgYIKwYBBQUHAwEwLwYJKoZIhvcNAQkMBCIEICSr5xj+pjBSb+YOZ7TMPQJHYs4KASfnc9TugSpKJUG/MBUGCisGAQQBg4wbAgEEBxMFZGV2dnYwPQYJKwYBAgEPAwEBBDATLlFtVlRrVWFkMkdxM01rQ2E4Z2YxMlIxZ3NXRGZrMnlpVEVxYjZZR1hERzJpUTMwSQYDVR0RBEIwQII+cDNvcWRyNTNka2dnM241bnVlemx6eWF3aHh2aXQ1ZWZ4emx1bnZ6cDduN2xtdmE2ZmozaTQzYWQub25pb24wCgYIKoZIzj0EAwIDSAAwRQIhAIXhkkgs3H6GcZ1GYrSL2qJYDRQcpZlmcbq7YjpJHaORAiBMfkwP75v08R/ud6BPWvdS36corT+596+HzpqFt6bffw==',
        'MIICYTCCAgegAwIBAgIGAYKIYnYuMAoGCCqGSM49BAMCMA8xDTALBgNVBAMTBG1haW4wHhcNMjIwODEwMTUzMjEwWhcNMzAwMTMxMjMwMDAwWjBJMUcwRQYDVQQDEz52bnl3dWl5bDdwN2lnMm11cmNzY2R5emtza281M2U0azNkcGRtMnlvb3B2dnUyNXA2d3dqcWJhZC5vbmlvbjBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABM0cOt7jMJ6YhRvL9nhbDCh42QJPKDet/Zc2PJ9rm6CzYz1IXc5uRUCUNZSnNykVMZknogAavp0FjV+cFXzV8gGjggETMIIBDzAJBgNVHRMEAjAAMAsGA1UdDwQEAwIAgDAdBgNVHSUEFjAUBggrBgEFBQcDAgYIKwYBBQUHAwEwLwYJKoZIhvcNAQkMBCIEIIsBwPwIhLSltj9dnkgkMq3sOe3RVha9Mhukop6XOoISMBsGCisGAQQBg4wbAgEEDRMLZHNrZmpia3NmaWcwPQYJKwYBAgEPAwEBBDATLlFtZDJVbjlBeW5va1pyY1pHc011YXFndXBUdGlkSEdRblVrTlZmRkZBZWY5N0MwSQYDVR0RBEIwQII+dm55d3VpeWw3cDdpZzJtdXJjc2NkeXprc2tvNTNlNGszZHBkbTJ5b29wdnZ1MjVwNnd3anFiYWQub25pb24wCgYIKoZIzj0EAwIDSAAwRQIgAiCmGfUuSG010CxLEzu9mAQOgDq//SHI9LkXbmCxaAUCIQC9xzmkRBxq5HmNomYJ9ZAJXaY3J6+VqBYthaVnv0bhMw==',
      ])
      const allUsers = storageService.getAllUsers()
      expect(allUsers).toStrictEqual([
        {
          onionAddress: 'p3oqdr53dkgg3n5nuezlzyawhxvit5efxzlunvzp7n7lmva6fj3i43ad.onion',
          peerId: 'QmVTkUad2Gq3MkCa8gf12R1gsWDfk2yiTEqb6YGXDG2iQ3',
          dmPublicKey: '24abe718fea630526fe60e67b4cc3d024762ce0a0127e773d4ee812a4a2541bf',
          username: 'devvv',
        },
        {
          onionAddress: 'vnywuiyl7p7ig2murcscdyzksko53e4k3dpdm2yoopvvu25p6wwjqbad.onion',
          peerId: 'Qmd2Un9AynokZrcZGsMuaqgupTtidHGQnUkNVfFFAef97C',
          dmPublicKey: '8b01c0fc0884b4a5b63f5d9e482432adec39edd15616bd321ba4a29e973a8212',
          username: 'dskfjbksfig',
        },
      ])
    })
  })

  describe('Files deletion', () => {
    let realFilePath: string
    let messages: {
      messages: Record<string, ChannelMessage>
    }
    beforeEach(async () => {
      realFilePath = path.join(dirname, '/real-file.txt')
      createFile(realFilePath, 2147483)
      await storageService.init(peerId)

      const metadata: FileMetadata = {
        path: realFilePath,
        name: 'test-large-file',
        ext: '.txt',
        cid: 'uploading_id',
        message: {
          id: 'id',
          channelId: channel.id,
        },
      }

      const aliceMessage = await factory.create<ReturnType<typeof publicChannels.actions.test_message>['payload']>(
        'Message',
        {
          identity: alice,
          message: generateMessageFactoryContentWithId(channel.id, MessageType.File, metadata),
        }
      )

      messages = {
        messages: {
          [aliceMessage.message.id]: aliceMessage.message,
        },
      }
    })

    afterEach(async () => {
      if (fs.existsSync(realFilePath)) {
        fs.rmSync(realFilePath)
      }
    })

    it('delete file correctly', async () => {
      const isFileExist = await storageService.checkIfFileExist(realFilePath)
      expect(isFileExist).toBeTruthy()

      await expect(storageService.deleteFilesFromChannel(messages)).resolves.not.toThrowError()

      await waitForExpect(async () => {
        expect(await storageService.checkIfFileExist(realFilePath)).toBeFalsy()
      }, 2000)
    })
    it('file dont exist - not throw error', async () => {
      fs.rmSync(realFilePath)

      await waitForExpect(async () => {
        expect(await storageService.checkIfFileExist(realFilePath)).toBeFalsy()
      }, 2000)

      await expect(storageService.deleteFilesFromChannel(messages)).resolves.not.toThrowError()
    })
  })
})
