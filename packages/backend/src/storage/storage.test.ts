import fs from 'fs'
import path from 'path'
import { DirResult } from 'tmp'
import { Config } from '../constants'
import { FactoryGirl } from 'factory-girl'
import waitForExpect from 'wait-for-expect'
import { fileURLToPath } from 'url'
import {
  createUserCert,
  keyFromCertificate,
  parseCertificate
} from '@quiet/identity'
import { jest, beforeEach, describe, it, expect, afterEach, beforeAll } from '@jest/globals'
import { sleep } from '../sleep'
import { StorageEvents } from './types'
import type { Storage as StorageType } from './storage'
import { ChannelMessage, Community, Identity, MessageType, PublicChannel, TestMessage } from '@quiet/types'
import { Store, getFactory, prepareStore, publicChannels, generateMessageFactoryContentWithId, FileMetadata } from '@quiet/state-manager'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const actual = await import('../common/utils')
jest.unstable_mockModule('../common/utils', async () => {
  return {
    ...(actual as object),
    createPaths: jest.fn((paths: string[]) => {
      console.log('creating paths in fn')
      for (const path of paths) {
        if (!fs.existsSync(path)) {
          fs.mkdirSync(path, { recursive: true })
        }
      }
    })
    }
})
type ComonUtilsModuleType = typeof import('../common/utils')

const { createLibp2p, createTmpDir, tmpQuietDirPath, rootPermsData, createFile, createPeerId } = await import('../common/testUtils')

let tmpDir: DirResult
let tmpAppDataPath: string
let tmpOrbitDbDir: string
let tmpIpfsPath: string
let storage: StorageType
let Storage: typeof StorageType
let store: Store
let factory: FactoryGirl
let community: Community
let channel: PublicChannel
let alice: Identity
let john: Identity
let message: ChannelMessage
let channelio: PublicChannel
let filePath: string
let utils: ComonUtilsModuleType

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
    id: channel.id
  }

  alice = await factory.create<Identity>(
    'Identity',
    { id: community.id, nickname: 'alice' }
  )

  john = await factory.create<Identity>(
    'Identity',
    { id: community.id, nickname: 'john' }
  )

  message = (
    await factory.create<TestMessage>(
      'Message',
      {
        identity: alice,
        message: generateMessageFactoryContentWithId(channel.id)
      }
    )
  ).message
})

beforeEach(async () => {
  jest.clearAllMocks()
  tmpDir = createTmpDir()
  tmpAppDataPath = tmpQuietDirPath(tmpDir.name)
  tmpOrbitDbDir = path.join(tmpAppDataPath, Config.ORBIT_DB_DIR)
  tmpIpfsPath = path.join(tmpAppDataPath, Config.IPFS_REPO_PATH)
  Storage = (await import('./storage')).Storage
  utils = await import('../common/utils')
  storage = new Storage(tmpAppDataPath, 'communityId')
  filePath = path.join(
  dirname, '/testUtils/500kB-file.txt')
})

afterEach(async () => {
  try {
    storage && (await storage.stopOrbitDb())
  } catch (e) {
    console.error(e)
  }
  tmpDir.removeCallback()
  if (fs.existsSync(filePath)) {
    fs.rmSync(filePath)
  }
})

describe('Storage', () => {
  it('creates paths by default', async () => {
    expect(fs.existsSync(tmpOrbitDbDir)).toBe(false)
    expect(fs.existsSync(tmpIpfsPath)).toBe(false)

    storage = new Storage(tmpAppDataPath, 'communityId')

    const peerId = await createPeerId()
    const libp2p = await createLibp2p(peerId)

    const createPathsSpy = jest.spyOn(utils, 'createPaths')

    await storage.init(libp2p, peerId)

    expect(createPathsSpy).toHaveBeenCalled()

    expect(fs.existsSync(tmpOrbitDbDir)).toBe(true)

    expect(fs.existsSync(tmpIpfsPath)).toBe(true)
  })

  it('should not create paths if createPaths is set to false', async () => {
    expect(fs.existsSync(tmpOrbitDbDir)).toBe(false)
    expect(fs.existsSync(tmpIpfsPath)).toBe(false)

    storage = new Storage(tmpAppDataPath, 'communityId', { createPaths: false })

    const peerId = await createPeerId()
    const libp2p = await createLibp2p(peerId)

    const createPathsSpy = jest.spyOn(utils, 'createPaths')

    await storage.init(libp2p, peerId)

    expect(createPathsSpy).not.toHaveBeenCalled()
  })
})

describe('Channels', () => {
  it('deletes channel as owner', async () => {
    storage = new Storage(tmpAppDataPath, 'communityId', { createPaths: false })

    const peerId = await createPeerId()
    const libp2p = await createLibp2p(peerId)

    await storage.init(libp2p, peerId)

    await storage.initDatabases()
    await storage.subscribeToChannel(channelio)

    const eventSpy = jest.spyOn(storage, 'emit')

    await storage.deleteChannel({ channelId: channelio.id, ownerPeerId: peerId.toString() })

    const channelFromKeyValueStore = storage.channels.get(channelio.id)
    expect(channelFromKeyValueStore).toBeUndefined()
    expect(eventSpy).toBeCalledWith('channelDeletionResponse', {
      channelId: channelio.id
    })
  })

  it('delete channel as standard user', async () => {
    storage = new Storage(tmpAppDataPath, 'communityId', { createPaths: false })

    const peerId = await createPeerId()
    const libp2p = await createLibp2p(peerId)

    await storage.init(libp2p, peerId)

    await storage.initDatabases()
    await storage.subscribeToChannel(channelio)

    const eventSpy = jest.spyOn(storage, 'emit')

    await storage.deleteChannel({ channelId: channelio.id, ownerPeerId: 'random peer id' })

    const channelFromKeyValueStore = storage.channels.get(channelio.id)
    expect(channelFromKeyValueStore).toEqual(channelio)
    expect(eventSpy).toBeCalledWith('channelDeletionResponse', {
      channelId: channelio.id
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
    storage = new Storage(tmpAppDataPath, 'communityId', { createPaths: false })

    const peerId = await createPeerId()
    const libp2p = await createLibp2p(peerId)

    await storage.init(libp2p, peerId)

    await storage.initDatabases()

    const result = await storage.saveCertificate({ certificate: userCertificate.userCertString, rootPermsData })

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

    storage = new Storage(tmpAppDataPath, community.id, { createPaths: false })

    const peerId = await createPeerId()
    const libp2p = await createLibp2p(peerId)

    await storage.init(libp2p, peerId)

    await storage.initDatabases()

    const result = await storage.saveCertificate({ certificate: oldUserCertificate.userCertString, rootPermsData })

    expect(result).toBe(false)
  })

  it('is not saved to db if empty', async () => {
    storage = new Storage(tmpAppDataPath, community.id, { createPaths: false })

    const peerId = await createPeerId()
    const libp2p = await createLibp2p(peerId)

    await storage.init(libp2p, peerId)

    await storage.initDatabases()

    for (const empty of [null, '', undefined]) {
      // @ts-expect-error
      const result = await storage.saveCertificate({ certificate: empty, rootPermsData })
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

    storage = new Storage(tmpAppDataPath, 'communityId', { createPaths: false })

    const peerId = await createPeerId()
    const libp2p = await createLibp2p(peerId)

    await storage.init(libp2p, peerId)

    await storage.initDatabases()

    await storage.saveCertificate({ certificate: userCertificate.userCertString, rootPermsData })

    for (const username of ['alice', 'Alice', 'Ąlicę', 'álicẽ']) {
      const usernameCert = storage.usernameCert(username)
      expect(usernameCert).toEqual(userCertificate.userCertString)
    }
  })

  it('username check passes if username is not found in certificates', async () => {
    storage = new Storage(tmpAppDataPath, community.id, { createPaths: false })

    const peerId = await createPeerId()
    const libp2p = await createLibp2p(peerId)

    await storage.init(libp2p, peerId)

    await storage.initDatabases()

    const usernameCert = storage.usernameCert('alice')

    expect(usernameCert).toBeNull()
  })

  it('Certificates and peers list are updated on replicated event', async () => {
    storage = new Storage(tmpAppDataPath, community.id, { createPaths: false })

    const peerId = await createPeerId()
    const libp2p = await createLibp2p(peerId)

    await storage.init(libp2p, peerId)

    await storage.initDatabases()
    const eventSpy = jest.spyOn(storage, 'emit')
    const spyOnUpdatePeersList = jest.spyOn(storage, 'updatePeersList')
    // @ts-ignore - Property 'certificates' is private
    storage.certificates.events.emit('replicated')

    expect(eventSpy).toBeCalledWith('loadCertificates', {
      certificates: [

      ]
    })
    expect(spyOnUpdatePeersList).toBeCalled()
  })

  it.each(['write', 'replicate.progress'])('The message is verified valid on "%s" db event', async (eventName: string) => {
    const aliceMessage = await factory.create<
      ReturnType<typeof publicChannels.actions.test_message>['payload']
    >('Message', {
      identity: alice,
      message: generateMessageFactoryContentWithId(channel.id)
    })

    storage = new Storage(tmpAppDataPath, community.id, { createPaths: false })

    const peerId = await createPeerId()
    const libp2p = await createLibp2p(peerId)

    await storage.init(libp2p, peerId)
    await storage.initDatabases()

    await storage.subscribeToChannel(channelio)

    const eventSpy = jest.spyOn(storage, 'emit')
    console.log('storage.publicChannelsRepos.get(message.channelId)', storage.publicChannelsRepos.get(message.channelId))
    const publicChannelRepo = storage.publicChannelsRepos.get(message.channelId)
    expect(publicChannelRepo).not.toBeUndefined()
    // @ts-expect-error
    const db = publicChannelRepo.db
    const messagePayload = {
      payload: {
        value: aliceMessage.message
      }
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
      expect(eventSpy).toBeCalledWith('loadMessages', { isVerified: true, messages: [aliceMessage.message] }
      )
    })
  })

  it.each([
    ['write'],
    ['replicate.progress']
  ])('The message is verified not valid on "%s" db event', async (eventName: string) => {
    const aliceMessage = await factory.create<
      ReturnType<typeof publicChannels.actions.test_message>['payload']
    >('Message', {
      identity: alice,
      message: generateMessageFactoryContentWithId(channel.id)
    })

    const johnMessage = await factory.create<
      ReturnType<typeof publicChannels.actions.test_message>['payload']
    >('Message', {
      identity: john,
      message: generateMessageFactoryContentWithId(channel.id)

    })

    const aliceMessageWithJohnsPublicKey: ChannelMessage = {
      ...aliceMessage.message,
      pubKey: johnMessage.message.pubKey
    }

    storage = new Storage(tmpAppDataPath, community.id, { createPaths: false })

    const peerId = await createPeerId()
    const libp2p = await createLibp2p(peerId)

    await storage.init(libp2p, peerId)
    await storage.initDatabases()
    await storage.subscribeToChannel(channelio)

    const spyOnEmit = jest.spyOn(storage, 'emit')
    const publicChannelRepo = storage.publicChannelsRepos.get(message.channelId)
    expect(publicChannelRepo).not.toBeUndefined()
    // @ts-expect-error
    const db = publicChannelRepo.db
    const messagePayload = {
      payload: {
        value: aliceMessageWithJohnsPublicKey
      }
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
      expect(spyOnEmit).toBeCalledWith('loadMessages', { isVerified: false, messages: [aliceMessageWithJohnsPublicKey] }
      )
    })
  })

  it('Certificates and peers list are updated on write event', async () => {
    storage = new Storage(tmpAppDataPath, community.id, { createPaths: false })

    const peerId = await createPeerId()
    const libp2p = await createLibp2p(peerId)

    await storage.init(libp2p, peerId)

    await storage.initDatabases()
    const eventSpy = jest.spyOn(storage, 'emit')
    const spyOnUpdatePeersList = jest.spyOn(storage, 'updatePeersList')
    // @ts-ignore - Property 'certificates' is private
    storage.certificates.events.emit('write', 'address', { payload: { value: 'something' } }, [])

    expect(eventSpy).toBeCalledWith(StorageEvents.LOAD_CERTIFICATES, {
      certificates: [

      ]
    })
    expect(spyOnUpdatePeersList).toBeCalled()
  })
})

describe('Message access controller', () => {
  it('is saved to db if passed signature verification', async () => {
    storage = new Storage(tmpAppDataPath, community.id, { createPaths: false })

    const peerId = await createPeerId()
    const libp2p = await createLibp2p(peerId)

    await storage.init(libp2p, peerId)

    await storage.initDatabases()

    await storage.subscribeToChannel(channelio)

    const publicChannelRepo = storage.publicChannelsRepos.get(message.channelId)
    expect(publicChannelRepo).not.toBeUndefined()
    // @ts-expect-error
    const db = publicChannelRepo.db
    const eventSpy = jest.spyOn(db, 'add')

    const messageCopy = {
      ...message
    }
    delete messageCopy.media

    await storage.sendMessage(messageCopy)

    // Confirm message has passed orbitdb validator (check signature verification only)
    expect(eventSpy).toHaveBeenCalled()
    // @ts-expect-error
    const savedMessages = storage.getAllEventLogEntries(db)
    expect(savedMessages.length).toBe(1)
    expect(savedMessages[0]).toEqual(messageCopy)
  })

  it('is not saved to db if did not pass signature verification', async () => {
    const aliceMessage = await factory.create<
      ReturnType<typeof publicChannels.actions.test_message>['payload']
    >('Message', {
      identity: alice,
      message: generateMessageFactoryContentWithId(channel.id)
    })
    // @ts-expect-error userCertificate can be undefined
    const johnCertificate: string = john.userCertificate
    const johnPublicKey = keyFromCertificate(parseCertificate(johnCertificate))

    const spoofedMessage = {
      ...aliceMessage.message,
      channelId: channelio.id,
      pubKey: johnPublicKey
    }
    delete spoofedMessage.media // Media 'undefined' is not accepted by db.add

    storage = new Storage(tmpAppDataPath, community.id, { createPaths: false })

    const peerId = await createPeerId()
    const libp2p = await createLibp2p(peerId)

    await storage.init(libp2p, peerId)

    await storage.initDatabases()

    await storage.subscribeToChannel(channelio)

    const publicChannelRepo = storage.publicChannelsRepos.get(message.channelId)
    expect(publicChannelRepo).not.toBeUndefined()
    // @ts-expect-error
    const db = publicChannelRepo.db
    const eventSpy = jest.spyOn(db, 'add')

    await storage.sendMessage(spoofedMessage)

    // Confirm message has passed orbitdb validator (check signature verification only)
    expect(eventSpy).toHaveBeenCalled()
    // @ts-expect-error getAllEventLogEntries is protected
    expect(storage.getAllEventLogEntries(db).length).toBe(0)
  })
})

describe('Users', () => {
  it('gets all users from db', async () => {
    storage = new Storage(tmpAppDataPath, community.id, { createPaths: false })
    const mockGetCertificates = jest.fn()
    // @ts-ignore - Property 'getAllEventLogEntries' is protected
    storage.getAllEventLogEntries = mockGetCertificates
    mockGetCertificates.mockReturnValue([
      'MIICWzCCAgGgAwIBAgIGAYKIVrmoMAoGCCqGSM49BAMCMA8xDTALBgNVBAMTBG1haW4wHhcNMjIwODEwMTUxOTIxWhcNMzAwMTMxMjMwMDAwWjBJMUcwRQYDVQQDEz5wM29xZHI1M2RrZ2czbjVudWV6bHp5YXdoeHZpdDVlZnh6bHVudnpwN243bG12YTZmajNpNDNhZC5vbmlvbjBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABCAjxbiV781WC8O5emEdavPaQfR0FD8CaqC+P3R3uRdL9xuzGeUu8f5NIplSJ6abBMnanGgcMs34u82buiFROHqjggENMIIBCTAJBgNVHRMEAjAAMAsGA1UdDwQEAwIAgDAdBgNVHSUEFjAUBggrBgEFBQcDAgYIKwYBBQUHAwEwLwYJKoZIhvcNAQkMBCIEICSr5xj+pjBSb+YOZ7TMPQJHYs4KASfnc9TugSpKJUG/MBUGCisGAQQBg4wbAgEEBxMFZGV2dnYwPQYJKwYBAgEPAwEBBDATLlFtVlRrVWFkMkdxM01rQ2E4Z2YxMlIxZ3NXRGZrMnlpVEVxYjZZR1hERzJpUTMwSQYDVR0RBEIwQII+cDNvcWRyNTNka2dnM241bnVlemx6eWF3aHh2aXQ1ZWZ4emx1bnZ6cDduN2xtdmE2ZmozaTQzYWQub25pb24wCgYIKoZIzj0EAwIDSAAwRQIhAIXhkkgs3H6GcZ1GYrSL2qJYDRQcpZlmcbq7YjpJHaORAiBMfkwP75v08R/ud6BPWvdS36corT+596+HzpqFt6bffw==',
      'MIICYTCCAgegAwIBAgIGAYKIYnYuMAoGCCqGSM49BAMCMA8xDTALBgNVBAMTBG1haW4wHhcNMjIwODEwMTUzMjEwWhcNMzAwMTMxMjMwMDAwWjBJMUcwRQYDVQQDEz52bnl3dWl5bDdwN2lnMm11cmNzY2R5emtza281M2U0azNkcGRtMnlvb3B2dnUyNXA2d3dqcWJhZC5vbmlvbjBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABM0cOt7jMJ6YhRvL9nhbDCh42QJPKDet/Zc2PJ9rm6CzYz1IXc5uRUCUNZSnNykVMZknogAavp0FjV+cFXzV8gGjggETMIIBDzAJBgNVHRMEAjAAMAsGA1UdDwQEAwIAgDAdBgNVHSUEFjAUBggrBgEFBQcDAgYIKwYBBQUHAwEwLwYJKoZIhvcNAQkMBCIEIIsBwPwIhLSltj9dnkgkMq3sOe3RVha9Mhukop6XOoISMBsGCisGAQQBg4wbAgEEDRMLZHNrZmpia3NmaWcwPQYJKwYBAgEPAwEBBDATLlFtZDJVbjlBeW5va1pyY1pHc011YXFndXBUdGlkSEdRblVrTlZmRkZBZWY5N0MwSQYDVR0RBEIwQII+dm55d3VpeWw3cDdpZzJtdXJjc2NkeXprc2tvNTNlNGszZHBkbTJ5b29wdnZ1MjVwNnd3anFiYWQub25pb24wCgYIKoZIzj0EAwIDSAAwRQIgAiCmGfUuSG010CxLEzu9mAQOgDq//SHI9LkXbmCxaAUCIQC9xzmkRBxq5HmNomYJ9ZAJXaY3J6+VqBYthaVnv0bhMw=='
    ])
    const allUsers = storage.getAllUsers()
    expect(allUsers).toStrictEqual([
      {
        onionAddress: 'p3oqdr53dkgg3n5nuezlzyawhxvit5efxzlunvzp7n7lmva6fj3i43ad.onion',
        peerId: 'QmVTkUad2Gq3MkCa8gf12R1gsWDfk2yiTEqb6YGXDG2iQ3',
        dmPublicKey: '24abe718fea630526fe60e67b4cc3d024762ce0a0127e773d4ee812a4a2541bf',
        username: 'devvv'
      },
      {
        onionAddress: 'vnywuiyl7p7ig2murcscdyzksko53e4k3dpdm2yoopvvu25p6wwjqbad.onion',
        peerId: 'Qmd2Un9AynokZrcZGsMuaqgupTtidHGQnUkNVfFFAef97C',
        dmPublicKey: '8b01c0fc0884b4a5b63f5d9e482432adec39edd15616bd321ba4a29e973a8212',
        username: 'dskfjbksfig'
      }
    ])
  })
})

describe('Files deletion', () => {
    let realFilePath: string
    let messages: {
      messages: {
          [x: string]: ChannelMessage
      }
    }
  beforeEach(async () => {
    realFilePath = path.join(
      dirname, '/testUtils/real-file.txt')
    createFile(realFilePath, 2147483)
    storage = new Storage(tmpAppDataPath, 'communityId', { createPaths: false })

    const peerId = await createPeerId()
    const libp2p = await createLibp2p(peerId)

    await storage.init(libp2p, peerId)

    const metadata: FileMetadata = {
      path: realFilePath,
      name: 'test-large-file',
      ext: '.txt',
      cid: 'uploading_id',
      message: {
        id: 'id',
        channelId: channel.id,
      }
    }

    const aliceMessage = await factory.create<
    ReturnType<typeof publicChannels.actions.test_message>['payload']
  >('Message', {
    identity: alice,
    message: generateMessageFactoryContentWithId(channel.id, MessageType.File, metadata)
  })

   messages = {
    messages: {
      [aliceMessage.message.id]: aliceMessage.message
    }
  }
  })

  afterEach(async () => {
    if (fs.existsSync(realFilePath)) {
      fs.rmSync(realFilePath)
    }
  })

  it('delete file correctly', async () => {
   const isFileExist = await storage.checkIfFileExist(realFilePath)
    expect(isFileExist).toBeTruthy()

    await expect(
      storage.deleteFilesFromChannel(messages)
    ).resolves.not.toThrowError()

    await waitForExpect(async() => {
      expect(await storage.checkIfFileExist(realFilePath)).toBeFalsy()
    }, 2000)
  })
  it('file dont exist - not throw error', async () => {
    fs.rmSync(realFilePath)

    await waitForExpect(async() => {
      expect(await storage.checkIfFileExist(realFilePath)).toBeFalsy()
    }, 2000)

    await expect(
      storage.deleteFilesFromChannel(messages)
    ).resolves.not.toThrowError()
  })
})
