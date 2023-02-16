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
import {
  communities,
  Community,
  getFactory,
  identity,
  prepareStore,
  publicChannels,
  Store,
  Identity,
  ChannelMessage,
  PublicChannelStorage,
  FileMetadata
} from '@quiet/state-manager'
import { sleep } from '../sleep'
import { StorageEvents } from './types'
import type { Storage as StorageType } from './storage'

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

const { createLibp2p, createTmpDir, tmpQuietDirPath, rootPermsData, createFile, createPeerId } = await import('../common/testUtils')

let tmpDir: DirResult
let tmpAppDataPath: string
let tmpOrbitDbDir: string
let tmpIpfsPath: string
let storage: StorageType
let Storage
let store: Store
let factory: FactoryGirl
let community: Community
let channel: PublicChannelStorage
let alice: Identity
let john: Identity
let message: ChannelMessage
let channelio: PublicChannelStorage
let filePath: string
let utils

jest.setTimeout(50000)

beforeAll(async () => {
  store = prepareStore().store
  factory = await getFactory(store)

  community = await factory.create<
    ReturnType<typeof communities.actions.addNewCommunity>['payload']
  >('Community')

  channel = publicChannels.selectors.publicChannels(store.getState())[0]

  channelio = {
    ...channel
  }

  delete channelio.messages

  alice = await factory.create<ReturnType<typeof identity.actions.addNewIdentity>['payload']>(
    'Identity',
    { id: community.id, nickname: 'alice' }
  )

  john = await factory.create<ReturnType<typeof identity.actions.addNewIdentity>['payload']>(
    'Identity',
    { id: community.id, nickname: 'john' }
  )

  message = (
    await factory.create<ReturnType<typeof publicChannels.actions.test_message>['payload']>(
      'Message',
      {
        identity: alice
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
  storage = null
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

describe('Certificate', () => {
  it('is saved to db if passed verification', async () => {
    const userCertificate = await createUserCert(
      rootPermsData.certificate,
      rootPermsData.privKey,
      alice.userCsr.userCsr,
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
    // expect(result).toBe(true)
  })

  it('is not saved to db if did not pass verification', async () => {
    const oldUserCertificate = await createUserCert(
      rootPermsData.certificate,
      rootPermsData.privKey,
      alice.userCsr.userCsr,
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
      const result = await storage.saveCertificate({ certificate: empty, rootPermsData })
      expect(result).toBe(false)
    }
  })

  it('username check fails if username is already in use', async () => {
    const userCertificate = await createUserCert(rootPermsData.certificate, rootPermsData.privKey, alice.userCsr.userCsr, new Date(), new Date(2030, 1, 1))

    storage = new Storage(tmpAppDataPath, 'communityId', { createPaths: false })

    const peerId = await createPeerId()
    const libp2p = await createLibp2p(peerId)

    await storage.init(libp2p, peerId)

    await storage.initDatabases()

    await storage.saveCertificate({ certificate: userCertificate.userCertString, rootPermsData })

    for (const username of ['alice', 'Alice', 'Ąlice']) {
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

  it.each(['write, replicate.progress'])('The message is verified valid on "%s" db event', async () => {
    const eventName = 'write'
    const aliceMessage = await factory.create<
      ReturnType<typeof publicChannels.actions.test_message>['payload']
    >('Message', {
      identity: alice
    })

    storage = new Storage(tmpAppDataPath, community.id, { createPaths: false })

    const peerId = await createPeerId()
    const libp2p = await createLibp2p(peerId)

    await storage.init(libp2p, peerId)
    await storage.initDatabases()
    await storage.subscribeToChannel(channelio)

    const eventSpy = jest.spyOn(storage, 'emit')

    const db = storage.publicChannelsRepos.get(message.channelAddress).db
    const messagePayload = {
      payload: {
        value: aliceMessage.message
      }
    }

    switch (eventName) {
      case 'write':
        db.events.emit(eventName, 'address', messagePayload, [])
        break
      // @ts-ignore
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
      identity: alice
    })

    const johnMessage = await factory.create<
      ReturnType<typeof publicChannels.actions.test_message>['payload']
    >('Message', {
      identity: john
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

    const db = storage.publicChannelsRepos.get(message.channelAddress).db
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

describe('Message', () => {
  it('is saved to db if passed signature verification', async () => {
    storage = new Storage(tmpAppDataPath, community.id, { createPaths: false })

    const peerId = await createPeerId()
    const libp2p = await createLibp2p(peerId)

    await storage.init(libp2p, peerId)

    await storage.initDatabases()

    await storage.subscribeToChannel(channelio)

    const eventSpy = jest.spyOn(storage.publicChannelsRepos.get(message.channelAddress).db, 'add')

    await storage.sendMessage(message)

    // Confirm message has passed orbitdb validator (check signature verification only)
    expect(eventSpy).toHaveBeenCalled()
  })

  // FIXME: Message signature verification doesn't work, our theory is that our AccessController performs check after message is added to db.
  it.skip('is not saved to db if did not pass signature verification', async () => {
    const aliceMessage = await factory.create<
      ReturnType<typeof publicChannels.actions.test_message>['payload']
    >('Message', {
      identity: alice
    })

    const johnPublicKey = keyFromCertificate(parseCertificate(john.userCertificate))

    const spoofedMessage = {
      ...aliceMessage.message,
      channelAddress: channel.address,
      pubKey: johnPublicKey
    }

    storage = new Storage(tmpAppDataPath, community.id, { createPaths: false })

    const peerId = await createPeerId()
    const libp2p = await createLibp2p(peerId)

    await storage.init(libp2p, peerId)

    await storage.initDatabases()

    await storage.subscribeToChannel(channelio)

    const eventSpy = jest.spyOn(storage.publicChannelsRepos.get(spoofedMessage.channelAddress).db, 'add')

    await storage.sendMessage(spoofedMessage)

    // Confirm message has passed orbitdb validator (check signature verification only)
    expect(eventSpy).not.toHaveBeenCalled()
  })
})

describe('Files', () => {
  it('uploads image', async () => {
    storage = new Storage(tmpAppDataPath, community.id, { createPaths: false })

    const peerId = await createPeerId()
    const libp2p = await createLibp2p(peerId)

    await storage.init(libp2p, peerId)

    await storage.initDatabases()

    // Uploading
    const eventSpy = jest.spyOn(storage, 'emit')
    const copyFileSpy = jest.spyOn(storage, 'copyFile')
    const metadata: FileMetadata = {
      path: path.join(dirname, '/testUtils/test-image.png'),
      name: 'test-image',
      ext: '.png',
      cid: 'uploading_id',
      message: {
        id: 'id',
        channelAddress: 'channelAddress'
      }
    }

    await storage.uploadFile(metadata)
    expect(copyFileSpy).toHaveBeenCalled()
    const newFilePath = copyFileSpy.mock.results[0].value as string
    metadata.path = newFilePath

    const cid = 'QmPWwAxgGofmXZF5RqKE4K8rVeL6oAuCnAfoR4CZWTkJ5T'
    expect(eventSpy).toHaveBeenNthCalledWith(1, 'removeDownloadStatus', { cid: 'uploading_id' })
    expect(eventSpy).toHaveBeenNthCalledWith(2, 'uploadedFile', expect.objectContaining({ cid: cid, ext: '.png', height: 44, message: { channelAddress: 'channelAddress', id: 'id' }, name: 'test-image', size: 15847, width: 824 })
    )
    expect(eventSpy).toHaveBeenNthCalledWith(3, 'updateDownloadProgress', { cid: cid, downloadProgress: undefined, downloadState: 'hosted', mid: 'id' })
  })

  it('uploads file other than image', async () => {
    storage = new Storage(tmpAppDataPath, community.id, { createPaths: false })

    const peerId = await createPeerId()
    const libp2p = await createLibp2p(peerId)

    await storage.init(libp2p, peerId)

    await storage.initDatabases()

    // Uploading
    const eventSpy = jest.spyOn(storage, 'emit')

    const metadata: FileMetadata = {
      path: path.join(dirname, '/testUtils/test-file.pdf'),
      name: 'test-file',
      ext: '.pdf',
      cid: 'uploading_id',
      message: {
        id: 'id',
        channelAddress: 'channelAddress'
      }
    }

    await storage.uploadFile(metadata)
    const cid = 'QmaA1C173ZDtoo7K6tLqq6o2eRce3kgwoVQpxsTfQgNjDZ'
    expect(eventSpy).toHaveBeenNthCalledWith(1, 'removeDownloadStatus', { cid: 'uploading_id' })
    expect(eventSpy).toHaveBeenNthCalledWith(2, 'uploadedFile', expect.objectContaining({ cid: cid, ext: '.pdf', height: null, message: { channelAddress: 'channelAddress', id: 'id' }, name: 'test-file', size: 761797, width: null }
    )
    )
    expect(eventSpy).toHaveBeenNthCalledWith(3, 'updateDownloadProgress', { cid: cid, downloadProgress: undefined, downloadState: 'hosted', mid: 'id' })
    expect(eventSpy).toHaveBeenNthCalledWith(4, 'updateMessageMedia', expect.objectContaining({ cid: cid, ext: '.pdf', height: null, message: { channelAddress: 'channelAddress', id: 'id' }, name: 'test-file', size: 761797, width: null })
    )
  })

  it("throws error if file doesn't exists", async () => {
    storage = new Storage(tmpAppDataPath, community.id, { createPaths: false })

    const peerId = await createPeerId()
    const libp2p = await createLibp2p(peerId)

    await storage.init(libp2p, peerId)

    await storage.initDatabases()
    // Uploading
    const eventSpy = jest.spyOn(storage, 'emit')

    const metadata: FileMetadata = {
      path: path.join(dirname, '/testUtils/non-existent.png'),
      name: 'test-image',
      ext: '.png',
      cid: 'uploading_id',
      message: {
        id: 'id',
        channelAddress: 'channelAddress'
      }
    }

    await expect(storage.uploadFile(metadata)).rejects.toThrow()
    expect(eventSpy).not.toHaveBeenCalled()
  })

  it('throws error if reported file size is malicious', async () => {
    storage = new Storage(tmpAppDataPath, community.id, { createPaths: false })

    const peerId = await createPeerId()
    const libp2p = await createLibp2p(peerId)

    await storage.init(libp2p, peerId)

    await storage.initDatabases()

    // Uploading
    const eventSpy = jest.spyOn(storage, 'emit')

    const metadata: FileMetadata = {
      path: path.join(dirname, '/testUtils/test-file.pdf'),
      name: 'test-file',
      ext: '.pdf',
      cid: 'uploading_id',
      message: {
        id: 'id',
        channelAddress: 'channelAddress'
      }
    }

    await storage.uploadFile(metadata)
    const cid = 'QmaA1C173ZDtoo7K6tLqq6o2eRce3kgwoVQpxsTfQgNjDZ'
    expect(eventSpy).toHaveBeenNthCalledWith(1, 'removeDownloadStatus', { cid: 'uploading_id' })
    expect(eventSpy).toHaveBeenNthCalledWith(2, 'uploadedFile', expect.objectContaining({ cid: cid, ext: '.pdf', height: null, message: { channelAddress: 'channelAddress', id: 'id' }, name: 'test-file', size: 761797, width: null }))
    expect(eventSpy).toHaveBeenNthCalledWith(3, 'updateDownloadProgress', { cid: cid, downloadProgress: undefined, downloadState: 'hosted', mid: 'id' })
    expect(eventSpy).toHaveBeenNthCalledWith(4, 'updateMessageMedia', expect.objectContaining({ cid: cid, ext: '.pdf', height: null, message: { channelAddress: 'channelAddress', id: 'id' }, name: 'test-file', size: 761797, width: null }))

    // Downloading

    const uploadMetadata = eventSpy.mock.calls[1][1]

    await storage.downloadFile({
      ...uploadMetadata,
      size: 20400
    })

    expect(eventSpy).toHaveBeenNthCalledWith(5, 'updateDownloadProgress', { cid: cid, downloadProgress: undefined, downloadState: 'malicious', mid: 'id' })

    expect(eventSpy).toBeCalledTimes(5)
  })

  it('cancels download on demand', async () => {
    storage = new Storage(tmpAppDataPath, community.id, { createPaths: false })

    const peerId = await createPeerId()
    const libp2p = await createLibp2p(peerId)

    await storage.init(libp2p, peerId)

    await storage.initDatabases()

    // Uploading
    const eventSpy = jest.spyOn(storage, 'emit')

    const metadata: FileMetadata = {
      path: path.join(dirname, '/testUtils/test-file.pdf'),
      name: 'test-file',
      ext: '.pdf',
      cid: 'uploading_id',
      message: {
        id: 'id',
        channelAddress: 'channelAddress'
      }
    }

    await storage.uploadFile(metadata)

    // Downloading
    const cid = 'QmaA1C173ZDtoo7K6tLqq6o2eRce3kgwoVQpxsTfQgNjDZ'
    expect(eventSpy).toHaveBeenNthCalledWith(1, 'removeDownloadStatus', { cid: 'uploading_id' })
    expect(eventSpy).toHaveBeenNthCalledWith(2, 'uploadedFile', expect.objectContaining({ cid: cid, ext: '.pdf', height: null, message: { channelAddress: 'channelAddress', id: 'id' }, name: 'test-file', size: 761797, width: null })
    )
    expect(eventSpy).toHaveBeenNthCalledWith(3, 'updateDownloadProgress', { cid: cid, downloadProgress: undefined, downloadState: 'hosted', mid: 'id' }
    )
    expect(eventSpy).toHaveBeenNthCalledWith(4, 'updateMessageMedia', expect.objectContaining({ cid: cid, ext: '.pdf', height: null, message: { channelAddress: 'channelAddress', id: 'id' }, name: 'test-file', size: 761797, width: null })
    )

    storage.cancelDownload('id')

    expect(storage.downloadCancellations.length).toBe(1)

    const uploadMetadata = eventSpy.mock.calls[1][1]

    await storage.downloadFile({
      ...uploadMetadata
    })

    expect(eventSpy).toHaveBeenNthCalledWith(5, 'updateDownloadProgress', { cid: cid, downloadProgress: { downloaded: 0, size: 761797, transferSpeed: 0 }, downloadState: 'canceled', mid: 'id' }
    )

    expect(eventSpy).toBeCalledTimes(5)

    // Confirm cancellation signal is cleared (download can be resumed)
    expect(storage.downloadCancellations.length).toBe(0)
  })

  it('is uploaded to IPFS then can be downloaded', async () => {
    storage = new Storage(tmpAppDataPath, community.id, { createPaths: false })

    const peerId = await createPeerId()
    const libp2p = await createLibp2p(peerId)

    await storage.init(libp2p, peerId)

    await storage.initDatabases()

    // Uploading
    const eventSpy = jest.spyOn(storage, 'emit')

    const metadata: FileMetadata = {
      path: path.join(dirname, '/testUtils/test-image.png'),
      name: 'test-image',
      ext: '.png',
      cid: 'uploading_id',
      message: {
        id: 'id',
        channelAddress: 'channelAddress'
      }
    }

    await storage.uploadFile(metadata)
    const cid = 'QmPWwAxgGofmXZF5RqKE4K8rVeL6oAuCnAfoR4CZWTkJ5T'
    expect(eventSpy).toHaveBeenNthCalledWith(1, 'removeDownloadStatus', { cid: 'uploading_id' }
    )

    expect(eventSpy).toHaveBeenNthCalledWith(2, 'uploadedFile', expect.objectContaining({ cid: cid, ext: '.png', height: 44, message: { channelAddress: 'channelAddress', id: 'id' }, name: 'test-image', size: 15847, width: 824 })
    )

    expect(eventSpy).toHaveBeenNthCalledWith(3, 'updateDownloadProgress', { cid: cid, downloadProgress: undefined, downloadState: 'hosted', mid: 'id' }
    )

    expect(eventSpy).toHaveBeenNthCalledWith(4, 'updateMessageMedia', expect.objectContaining({ cid: cid, ext: '.png', height: 44, message: { channelAddress: 'channelAddress', id: 'id' }, name: 'test-image', size: 15847, width: 824 })
    )

    // Downloading

    const uploadMetadata = eventSpy.mock.calls[1][1]

    await storage.downloadFile(uploadMetadata)

    // Potetential bug?
    expect(eventSpy).toHaveBeenNthCalledWith(5, 'updateDownloadProgress', { cid: cid, downloadProgress: { downloaded: 15847, size: 15847, transferSpeed: -1 }, downloadState: 'downloading', mid: 'id' }
    )

    expect(eventSpy).toHaveBeenNthCalledWith(6, 'updateDownloadProgress', { cid: cid, downloadProgress: { downloaded: 15847, size: 15847, transferSpeed: 0 }, downloadState: 'completed', mid: 'id' }

    )
    expect(eventSpy).toHaveBeenNthCalledWith(7, 'updateMessageMedia', expect.objectContaining({ cid: cid, ext: '.png', height: 44, message: { channelAddress: 'channelAddress', id: 'id' }, name: 'test-image', size: 15847, width: 824 })
    )

    expect(eventSpy).toBeCalledTimes(7)
  })

  it('downloaded file matches uploaded file', async () => {
    storage = new Storage(tmpAppDataPath, community.id, { createPaths: false })

    const peerId = await createPeerId()
    const libp2p = await createLibp2p(peerId)

    await storage.init(libp2p, peerId)

    await storage.initDatabases()

    // Uploading
    const eventSpy = jest.spyOn(storage, 'emit')

    const metadata: FileMetadata = {
      path: path.join(dirname, '/testUtils/test-image.png'),
      name: 'test-image',
      ext: '.png',
      cid: 'uploading_id',
      message: {
        id: 'id',
        channelAddress: 'channelAddress'
      }
    }

    await storage.uploadFile(metadata)

    const uploadMetadata = eventSpy.mock.calls[1][1]

    await storage.downloadFile(uploadMetadata)

    const downloadMetadata = eventSpy.mock.calls[3][1]

    const uploadFileBuffer = fs.readFileSync(metadata.path)
    const downloadFileBuffer = fs.readFileSync(downloadMetadata.path)

    expect(uploadFileBuffer).toStrictEqual(downloadFileBuffer)
  })

  // Test fails because of bug in transfer speed logic https://github.com/TryQuiet/quiet/issues/1009
  it.skip('downloaded file chunk returns proper transferSpeed when no delay between entries', async () => {
    const fileSize = 524288 // 0.5MB
    createFile(filePath, fileSize)

    const mockDateNow = jest.fn<() => number>()

    global.Date.now = mockDateNow
    mockDateNow.mockReturnValue(new Date('2022-04-07T10:20:30Z') as unknown as number)

    storage = new Storage(tmpAppDataPath, community.id, { createPaths: false })

    const peerId = await createPeerId()
    const libp2p = await createLibp2p(peerId)

    await storage.init(libp2p, peerId)

    await storage.initDatabases()

    // Uploading
    const eventSpy = jest.spyOn(storage, 'emit')

    const metadata: FileMetadata = {
      path: filePath,
      name: 'new-file',
      ext: '.txt',
      cid: 'uploading_id',
      message: {
        id: 'id',
        channelAddress: 'channelAddress'
      }
    }

    await storage.uploadFile(metadata)

    // Downloading
    const uploadMetadata = eventSpy.mock.calls[1][1]

    await storage.downloadFile(uploadMetadata)

    const transferSpeeds = []

    eventSpy.mock.calls.map((call) => {
      if (call[0] === 'updateDownloadProgress') {
        transferSpeeds.push(call[1].downloadProgress?.transferSpeed)
      }
    }
    )
    const unwantedValues = [undefined, null, Infinity]
    for (const value of unwantedValues) {
      expect(transferSpeeds).not.toContain(value)
    }
  })

  it('copies file and returns a new path', () => {
    storage = new Storage(tmpAppDataPath, community.id, { createPaths: false })
    const originalPath = path.join(dirname, '/testUtils/test-image.png')
    const newPath = storage.copyFile(originalPath, '12345_test-image.png')
    expect(fs.existsSync(newPath)).toBeTruthy()
    expect(originalPath).not.toEqual(newPath)
  })

  it('tries to copy files, returns original path on error', () => {
    storage = new Storage(tmpAppDataPath, community.id, { createPaths: false })
    const originalPath = path.join(dirname, '/testUtils/test-image-non-existing.png')
    const newPath = storage.copyFile(originalPath, '12345_test-image.png')
    expect(originalPath).toEqual(newPath)
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
