import { LazyModuleLoader } from '@nestjs/core'
import { Test, TestingModule } from '@nestjs/testing'
import { createUserCert, keyFromCertificate, loadCSR, parseCertificate } from '@quiet/identity'
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
import fs from 'fs'
import { type FactoryGirl } from 'factory-girl'
import { fileURLToPath } from 'url'
import { jest } from '@jest/globals'
import { LocalDbModule } from '../local-db/local-db.module'
import { LocalDbService } from '../local-db/local-db.service'
import { IPFS_REPO_PATCH, ORBIT_DB_DIR, QUIET_DIR } from '../const'
import { LocalDBKeys } from '../local-db/local-db.types'
import { CertificatesRequestsStore } from './certifacteRequests/certificatesRequestsStore'
import { CertificatesStore } from './certificates/certificates.store'
import { CommunityMetadataStore } from './communityMetadata/communityMetadata.store'
import { OrbitDb } from './orbitDb/orbitDb.service'

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
  let certificatesRequestsStore: CertificatesRequestsStore
  let certificatesStore: CertificatesStore
  let communityMetadataStore: CommunityMetadataStore
  let orbitDbService: OrbitDb
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
    orbitDbService = await module.resolve(OrbitDb)

    certificatesRequestsStore = await module.resolve(CertificatesRequestsStore)
    certificatesStore = await module.resolve(CertificatesStore)
    communityMetadataStore = await module.resolve(CommunityMetadataStore)
    console.log({ communityMetadataStore })
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

    await localDbService.setCommunity(community)
    await localDbService.setCurrentCommunityId(community.id)
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
    it.skip('creates paths by default', async () => {
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

    it('db address should be the same on all platforms', () => {
      const dbAddress = StorageService.dbAddress({ root: 'zdpuABCDefgh123', path: 'channels.general_abcd' })
      expect(dbAddress).toEqual(`/orbitdb/zdpuABCDefgh123/channels.general_abcd`)
    })
  })

  describe('Channels', () => {
    it('deletes channel as owner', async () => {
      await storageService.init(peerId)
      await storageService.subscribeToChannel(channelio)

      const result = await storageService.deleteChannel({ channelId: channelio.id, ownerPeerId: peerId.toString() })
      expect(result).toEqual({ channelId: channelio.id })

      const channelFromKeyValueStore = storageService.channels.get(channelio.id)
      expect(channelFromKeyValueStore).toBeUndefined()
    })

    it('delete channel as standard user', async () => {
      await storageService.init(peerId)
      await storageService.subscribeToChannel(channelio)

      const result = await storageService.deleteChannel({ channelId: channelio.id, ownerPeerId: 'random peer id' })
      expect(result).toEqual({ channelId: channelio.id })

      const channelFromKeyValueStore = storageService.channels.get(channelio.id)
      expect(channelFromKeyValueStore).toEqual(channelio)
    })

    it('subscribes to pubsub on channel creation', async () => {
      // @ts-expect-error 'subscribeToPubSub' is private
      const subscribeToPubSubSpy = jest.spyOn(storageService, 'subscribeToPubSub')
      await storageService.init(peerId)
      await storageService.subscribeToChannel(channelio)
      const db = storageService.publicChannelsRepos.get(channelio.id)?.db
      expect(db).not.toBe(undefined)
      if (!db) return // TS complaining
      const channelsDbAddress = storageService.channels?.address
      const certificatesDbAddress = certificatesStore.getAddress()
      const certificatesRequestsDbAddress = certificatesRequestsStore.getAddress()
      const communityMetadataDbAddress = communityMetadataStore.getAddress()
      expect(channelsDbAddress).not.toBeFalsy()
      expect(certificatesDbAddress).not.toBeFalsy()
      expect(subscribeToPubSubSpy).toBeCalledTimes(2)
      // Storage initialization:
      expect(subscribeToPubSubSpy).toHaveBeenNthCalledWith(1, [
        StorageService.dbAddress(channelsDbAddress),
        StorageService.dbAddress(certificatesDbAddress),
        StorageService.dbAddress(certificatesRequestsDbAddress),
        StorageService.dbAddress(communityMetadataDbAddress),
        '/orbitdb/zdpuAyScVHonV7KUdb3rdNmC9ZurssGdfgveYm3ds7KNJ6CpU/user-profiles',
      ])
      // Creating channel:
      expect(subscribeToPubSubSpy).toHaveBeenNthCalledWith(2, [StorageService.dbAddress(db.address)])
    })
  })

  describe('Certificate', () => {
    // FIXME: Due to moving certificates to a separate store and lack of proper nest configuration, this test is broken
    it.skip('username check fails if username is already in use', async () => {
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

    // it('Certificates and peers list are updated on replicated event', async () => {
    //   await storageService.init(peerId)

    //   const eventSpy = jest.spyOn(storageService, 'emit')

    //   const spyOnUpdatePeersList = jest.spyOn(storageService, 'updatePeersList')

    //   storageService.certificatesStore.store.events.emit('replicated')

    //   expect(eventSpy).toBeCalledWith(
    //     SocketActionTypes.CONNECTION_PROCESS_INFO,
    //     ConnectionProcessInfo.CERTIFICATES_STORED
    //   )

    //   await waitForExpect(() => {
    //     expect(eventSpy).toBeCalledWith(StorageEvents.CERTIFICATES_STORED, { certificates: [] })
    //     expect(spyOnUpdatePeersList).toBeCalled()
    //   })
    // })

    // it('Certificates and peers list are updated on write event', async () => {
    //   await storageService.init(peerId)

    //   const eventSpy = jest.spyOn(storageService, 'emit')

    //   const spyOnUpdatePeersList = jest.spyOn(storageService, 'updatePeersList')

    //   storageService.certificatesStore.store.events.emit('write', 'address', { payload: { value: 'something' } }, [])

    //   await waitForExpect(() => {
    //     expect(eventSpy).toBeCalledWith(StorageEvents.CERTIFICATES_STORED, { certificates: [] })
    //     expect(spyOnUpdatePeersList).toBeCalled()
    //   })
    // })

    // it.each(['write', 'replicate.progress'])(
    //   'The message is verified valid on "%s" db event',
    //   async (eventName: string) => {
    //     const aliceMessage = await factory.create<ReturnType<typeof publicChannels.actions.test_message>['payload']>(
    //       'Message',
    //       {
    //         identity: alice,
    //         message: generateMessageFactoryContentWithId(channel.id),
    //       }
    //     )
    //     await storageService.init(peerId)

    //     await storageService.subscribeToChannel(channelio)

    //     const eventSpy = jest.spyOn(storageService, 'emit')
    //     console.log(
    //       'storageService.publicChannelsRepos.get(message.channelId)',
    //       storageService.publicChannelsRepos.get(message.channelId)
    //     )
    //     const publicChannelRepo = storageService.publicChannelsRepos.get(message.channelId)
    //     expect(publicChannelRepo).not.toBeUndefined()
    //     // @ts-expect-error
    //     const db = publicChannelRepo.db
    //     const messagePayload = {
    //       payload: {
    //         value: aliceMessage.message,
    //       },
    //     }

    //     switch (eventName) {
    //       case 'write':
    //         db.events.emit(eventName, 'address', messagePayload, [])
    //         break
    //       case 'replicate.progress':
    //         db.events.emit(eventName, 'address', 'hash', messagePayload, 'progress', 'total', [])
    //         break
    //     }

    //     await waitForExpect(() => {
    //       expect(eventSpy).toBeCalledWith('loadMessages', { isVerified: true, messages: [aliceMessage.message] })
    //     })
    //   }
    // )

    // it.each([['write'], ['replicate.progress']])(
    //   'The message is verified not valid on "%s" db event',
    //   async (eventName: string) => {
    //     const aliceMessage = await factory.create<ReturnType<typeof publicChannels.actions.test_message>['payload']>(
    //       'Message',
    //       {
    //         identity: alice,
    //         message: generateMessageFactoryContentWithId(channel.id),
    //       }
    //     )

    //     const johnMessage = await factory.create<ReturnType<typeof publicChannels.actions.test_message>['payload']>(
    //       'Message',
    //       {
    //         identity: john,
    //         message: generateMessageFactoryContentWithId(channel.id),
    //       }
    //     )

    //     const aliceMessageWithJohnsPublicKey: ChannelMessage = {
    //       ...aliceMessage.message,
    //       pubKey: johnMessage.message.pubKey,
    //     }

    //     await storageService.init(peerId)
    //     await storageService.subscribeToChannel(channelio)

    //     const spyOnEmit = jest.spyOn(storageService, 'emit')
    //     const publicChannelRepo = storageService.publicChannelsRepos.get(message.channelId)
    //     expect(publicChannelRepo).not.toBeUndefined()
    //     // @ts-expect-error
    //     const db = publicChannelRepo.db
    //     const messagePayload = {
    //       payload: {
    //         value: aliceMessageWithJohnsPublicKey,
    //       },
    //     }

    //     switch (eventName) {
    //       case 'write':
    //         db.events.emit(eventName, 'address', messagePayload, [])
    //         break
    //       case 'replicate.progress':
    //         db.events.emit(eventName, 'address', 'hash', messagePayload, 'progress', 'total', [])
    //         break
    //     }

    //     await waitForExpect(() => {
    //       expect(spyOnEmit).toBeCalledWith('loadMessages', {
    //         isVerified: false,
    //         messages: [aliceMessageWithJohnsPublicKey],
    //       })
    //     })
    //   }
    // )
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
      const certs = [
        // b
        'MIICITCCAcegAwIBAgIGAY8GkBEVMAoGCCqGSM49BAMCMAwxCjAIBgNVBAMTAWEwHhcNMjQwNDIyMTYwNzM1WhcNMzAwMjAxMDcwMDAwWjBJMUcwRQYDVQQDEz56Z2hpZGV4czdxdDI0aXZ1M2pvYmpxZHR6end0eWF1NGxwcG51bng1cGtpZjc2cGtweXA3cWNpZC5vbmlvbjBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABDG8SNnoS1BYoV72jcyQFVlsrwvd2Bb9/9L13Tc4SHJwitTUB3F+y/7pk0tAPrZi2qasU2PO9lTwUxXYcAfpCRSjgdcwgdQwCQYDVR0TBAIwADALBgNVHQ8EBAMCAIAwHQYDVR0lBBYwFAYIKwYBBQUHAwIGCCsGAQUFBwMBMBEGCisGAQQBg4wbAgEEAxMBYjA9BgkrBgECAQ8DAQEEMBMuUW1lUGJCMjVoMWZYN1dBRk42ckZSNGFWRFdVRlFNU3RSSEdERFM0UlFaUTRZcTBJBgNVHREEQjBAgj56Z2hpZGV4czdxdDI0aXZ1M2pvYmpxZHR6end0eWF1NGxwcG51bng1cGtpZjc2cGtweXA3cWNpZC5vbmlvbjAKBggqhkjOPQQDAgNIADBFAiBkTZo6/D0YgNMPcDpuf7n+rDEQls6cMVxEVw/H8vxbhwIhAM+e6we9YP4JeNgOGgd0iZNEpq8N7dla4XO+YVWrh0YG',

        // c
        'MIICITCCAcegAwIBAgIGAY8Glf+pMAoGCCqGSM49BAMCMAwxCjAIBgNVBAMTAWEwHhcNMjQwNDIyMTYxNDA0WhcNMzAwMjAxMDcwMDAwWjBJMUcwRQYDVQQDEz5uaGxpdWpuNjZlMzQ2ZXZ2dnhlYWY0cW1hN3Bxc2hjZ2J1NnQ3d3Nlb2FubmMyZnk0Y25zY3J5ZC5vbmlvbjBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABP1WBKQdMz5yMpv5hWj6j+auIsnfiJE8dtuxeeM4N03K1An61F0o47CWg04DydwmoPn5gwefEv8t9Cz9nv/VUGejgdcwgdQwCQYDVR0TBAIwADALBgNVHQ8EBAMCAIAwHQYDVR0lBBYwFAYIKwYBBQUHAwIGCCsGAQUFBwMBMBEGCisGAQQBg4wbAgEEAxMBYzA9BgkrBgECAQ8DAQEEMBMuUW1WY1hRTXVmRWNZS0R0d3NFSlRIUGJzc3BCeU02U0hUYlJHR2VEdkVFdU1RQTBJBgNVHREEQjBAgj5uaGxpdWpuNjZlMzQ2ZXZ2dnhlYWY0cW1hN3Bxc2hjZ2J1NnQ3d3Nlb2FubmMyZnk0Y25zY3J5ZC5vbmlvbjAKBggqhkjOPQQDAgNIADBFAiEAgMCBxF3oK4ituEWcAK6uawMCludZu4YujIpBIR+v2LICIBhMHXrBy1KWc70t6idB+5XkInsRZz5nw1vwgRJ4mw98',
      ]

      const csrs = [
        // c
        'MIIB4TCCAYgCAQAwSTFHMEUGA1UEAxM+emdoaWRleHM3cXQyNGl2dTNqb2JqcWR0enp3dHlhdTRscHBudW54NXBraWY3NnBrcHlwN3FjaWQub25pb24wWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAAQxvEjZ6EtQWKFe9o3MkBVZbK8L3dgW/f/S9d03OEhycIrU1Adxfsv+6ZNLQD62YtqmrFNjzvZU8FMV2HAH6QkUoIHcMC4GCSqGSIb3DQEJDjEhMB8wHQYDVR0OBBYEFG1W6vJTK/uPuRK2LPaVZyebVVc+MA8GCSqGSIb3DQEJDDECBAAwEQYKKwYBBAGDjBsCATEDEwFiMD0GCSsGAQIBDwMBATEwEy5RbWVQYkIyNWgxZlg3V0FGTjZyRlI0YVZEV1VGUU1TdFJIR0REUzRSUVpRNFlxMEcGA1UdETFAEz56Z2hpZGV4czdxdDI0aXZ1M2pvYmpxZHR6end0eWF1NGxwcG51bng1cGtpZjc2cGtweXA3cWNpZC5vbmlvbjAKBggqhkjOPQQDAgNHADBEAiAjxneoJZtCzkd75HTT+pcj+objG3S04omjeMMw1N+B/wIgAaJRgifnWEnWFYm614UmPw9un2Uwk1gVhN2tSwJ65sM=',

        // o
        'MIIDHjCCAsMCAQAwSTFHMEUGA1UEAxM+NnZ1MmJ4a2k3NzdpdDNjcGF5djZmcTZ2cGw0a2Uza3pqN2d4aWNmeWdtNTVkaGh0cGh5ZmR2eWQub25pb24wWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAATMpfp2hSfWFL26OZlZKZEWG9fyAM1ndlEzO0kLxT0pA/7/fs+a5X/s4TkzqCVVQSzhas/84q0WE99ScAcM1LQJoIICFjAuBgkqhkiG9w0BCQ4xITAfMB0GA1UdDgQWBBR6VRzktP1pzZxsGUaJivNUrtgSrzCCAUcGCSqGSIb3DQEJDDGCATgEggE0KZq9s6HEViRfplVgYkulg6XV411ZRe4U1UjfXTf1pRaygfcenGbT6RRagPtZzjuq5hHdYhqDjRzZhnbn8ZASYTgBM7qcseUq5UpS1pE08DI2jePKqatp3Pzm6a/MGSziESnREx784JlKfwKMjJl33UA8lQm9nhSeAIHyBx3c4Lf8IXdW2n3rnhbVfjpBMAxwh6lt+e5agtGXy+q/xAESUeLPfUgRYWctlLgt8Op+WTpLyBkZsVFoBvJrMt2XdM0RI32YzTRr56GXFa4VyQmY5xXwlQSPgidAP7jPkVygNcoeXvAz2ZCk3IR1Cn3mX8nMko53MlDNaMYldUQA0ug28/S7BlSlaq2CDD4Ol3swTq7C4KGTxKrI36ruYUZx7NEaQDF5V7VvqPCZ0fZoTIJuSYTQ67gwEQYKKwYBBAGDjBsCATEDEwFvMD0GCSsGAQIBDwMBATEwEy5RbVhSWTRyaEF4OE11cThkTUdrcjlxa25KZEU2VUhaRGRHYURSVFFFYndGTjViMEcGA1UdETFAEz42dnUyYnhraTc3N2l0M2NwYXl2NmZxNnZwbDRrZTNremo3Z3hpY2Z5Z201NWRoaHRwaHlmZHZ5ZC5vbmlvbjAKBggqhkjOPQQDAgNJADBGAiEAt+f1u/bchg5AZHv6NTGNoXeejTRWUhX3ioGwW6TGg84CIQCHqKNzDh2JjS/hUHx5PApAmfNnQTSf19X6LnNHQweU1g==',

        // o
        'MIIDHTCCAsMCAQAwSTFHMEUGA1UEAxM+eTd5Y3ptdWdsMnRla2FtaTdzYmR6NXBmYWVtdng3YmFod3RocmR2Y2J6dzV2ZXgyY3JzcjI2cWQub25pb24wWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAATMq0l4bCmjdb0grtzpwtDVLM9E1IQpL9vrB4+lD9OBZzlrx2365jV7shVu9utas8w8fxtKoBZSnT5+32ZMFTB4oIICFjAuBgkqhkiG9w0BCQ4xITAfMB0GA1UdDgQWBBSoDQpTZdEvi1/Rr/muVXT1clyKRDCCAUcGCSqGSIb3DQEJDDGCATgEggE0BQvyvkiiXEf/PLKnsR1Ba9AhYsVO8o56bnftUnoVzBlRZgUzLJvOSroPk/EmbVz+okhMrcYNgCWHvxrAqHVVq0JRP6bi98BtCUotx6OPFHp5K5QCL60hod1uAnhKocyJG9tsoM9aS+krn/k+g4RCBjiPZ25cC7QG/UNr6wyIQ8elBho4MKm8iOp7EShSsZOV1f6xrnXYCC/zyUc85GEuycLzVImgAQvPATbdMzY4zSGnNLHxkvSUNxaR9LnEWf+i1jeqcOiXOvmdyU5Be3ZqhGKvvBg/5vyLQiCIfeapjZemnLqFHQBitglDm2xnKL6HzMyfZoAHPV7YcWYR4spU9Ju8Q8aqSeAryx7sx55eSR4GO5UQTo5DrQn6xtkwOZ/ytsOknFthF8jcA9uTAMDKA2TylCUwEQYKKwYBBAGDjBsCATEDEwFvMD0GCSsGAQIBDwMBATEwEy5RbVQxOFV2blVCa3NlTWMzU3FuZlB4cEh3TjhuekxySmVOU0xadGM4ckFGWGh6MEcGA1UdETFAEz55N3ljem11Z2wydGVrYW1pN3NiZHo1cGZhZW12eDdiYWh3dGhyZHZjYnp3NXZleDJjcnNyMjZxZC5vbmlvbjAKBggqhkjOPQQDAgNIADBFAiEAoFrAglxmk7ciD6AHQOB1qEoLu0NARcxgwmIry8oeTHwCICyXp5NJQ9Z8vReIAQNng2H2+/XjHifZEWzhoN0VkcBx',
      ]

      await storageService.init(peerId)
      // @ts-ignore
      storageService.certificatesRequestsStore = {
        getCsrs: jest.fn(() => {
          return csrs
        }),
      }
      // @ts-ignore
      storageService.certificatesStore = {
        getCertificates: jest.fn(() => {
          return certs
        }),
      }

      const allUsers = await storageService.getAllUsers()

      expect(allUsers).toStrictEqual([
        {
          onionAddress: 'zghidexs7qt24ivu3jobjqdtzzwtyau4lppnunx5pkif76pkpyp7qcid.onion',
          peerId: 'QmePbB25h1fX7WAFN6rFR4aVDWUFQMStRHGDDS4RQZQ4Yq',
          username: 'b',
        },
        {
          onionAddress: 'nhliujn66e346evvvxeaf4qma7pqshcgbu6t7wseoannc2fy4cnscryd.onion',
          peerId: 'QmVcXQMufEcYKDtwsEJTHPbsspByM6SHTbRGGeDvEEuMQA',
          username: 'c',
        },
        {
          onionAddress: '6vu2bxki777it3cpayv6fq6vpl4ke3kzj7gxicfygm55dhhtphyfdvyd.onion',
          peerId: 'QmXRY4rhAx8Muq8dMGkr9qknJdE6UHZDdGaDRTQEbwFN5b',
          username: 'o',
        },
        {
          onionAddress: 'y7yczmugl2tekami7sbdz5pfaemvx7bahwthrdvcbzw5vex2crsr26qd.onion',
          peerId: 'QmT18UvnUBkseMc3SqnfPxpHwN8nzLrJeNSLZtc8rAFXhz',
          username: 'o',
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
