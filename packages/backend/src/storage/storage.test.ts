import fs from 'fs'
import path from 'path'
import PeerId from 'peer-id'
import { DirResult } from 'tmp'
import { Config } from '../constants'
import { createLibp2p, createTmpDir, tmpQuietDirPath, rootPermsData, createMinConnectionManager, createFile } from '../common/testUtils'
import { Storage } from './storage'
import * as utils from '../common/utils'
import { FactoryGirl } from 'factory-girl'
import {
  createUserCert,
  keyFromCertificate,
  parseCertificate
} from '@quiet/identity'
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
  FileMetadata,
  DownloadState
} from '@quiet/state-manager'
import { ConnectionsManager } from '../libp2p/connectionsManager'

jest.setTimeout(30_000)

let tmpDir: DirResult
let tmpAppDataPath: string
let tmpOrbitDbDir: string
let tmpIpfsPath: string
let connectionsManager: ConnectionsManager
let storage: Storage
let store: Store
let factory: FactoryGirl
let community: Community
let channel: PublicChannelStorage
let alice: Identity
let message: ChannelMessage
let channelio: PublicChannelStorage
let filePath: string

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
  const { controlPort } = await utils.getPorts()
  connectionsManager = createMinConnectionManager({ env: { appDataPath: tmpAppDataPath }, torControlPort: controlPort })
  storage = null
  filePath = path.join(__dirname, '/testUtils/500kB-file.txt')
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

    storage = new Storage(tmpAppDataPath, connectionsManager.ioProxy, 'communityId')

    const peerId = await PeerId.create()
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

    storage = new Storage(tmpAppDataPath, connectionsManager.ioProxy, 'communityId', { createPaths: false })

    const peerId = await PeerId.create()
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

    storage = new Storage(tmpAppDataPath, connectionsManager.ioProxy, 'communityId', { createPaths: false })

    const peerId = await PeerId.create()
    const libp2p = await createLibp2p(peerId)

    await storage.init(libp2p, peerId)

    await storage.initDatabases()

    const result = await storage.saveCertificate({ certificate: userCertificate.userCertString, rootPermsData })

    expect(result).toBe(true)
  })

  it('is not saved to db if did not pass verification', async () => {
    const oldUserCertificate = await createUserCert(
      rootPermsData.certificate,
      rootPermsData.privKey,
      alice.userCsr.userCsr,
      new Date(2021, 1, 1),
      new Date(2021, 1, 2)
    )

    storage = new Storage(tmpAppDataPath, connectionsManager.ioProxy, community.id, { createPaths: false })

    const peerId = await PeerId.create()
    const libp2p = await createLibp2p(peerId)

    await storage.init(libp2p, peerId)

    await storage.initDatabases()

    const result = await storage.saveCertificate({ certificate: oldUserCertificate.userCertString, rootPermsData })

    expect(result).toBe(false)
  })

  it('is not saved to db if empty', async () => {
    storage = new Storage(tmpAppDataPath, connectionsManager.ioProxy, community.id, { createPaths: false })

    const peerId = await PeerId.create()
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

    storage = new Storage(tmpAppDataPath, connectionsManager.ioProxy, 'communityId', { createPaths: false })

    const peerId = await PeerId.create()
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
    storage = new Storage(tmpAppDataPath, connectionsManager.ioProxy, community.id, { createPaths: false })

    const peerId = await PeerId.create()
    const libp2p = await createLibp2p(peerId)

    await storage.init(libp2p, peerId)

    await storage.initDatabases()

    const usernameCert = storage.usernameCert('alice')

    expect(usernameCert).toBeNull()
  })

  it('Certificates and peers list are updated on replicated event', async () => {
    storage = new Storage(tmpAppDataPath, connectionsManager.ioProxy, community.id, { createPaths: false })

    const peerId = await PeerId.create()
    const libp2p = await createLibp2p(peerId)

    await storage.init(libp2p, peerId)

    await storage.initDatabases()
    const spyOnLoadCertificates = jest.spyOn(storage.io, 'loadCertificates')
    const spyOnUpdatePeersList = jest.spyOn(storage.io, 'updatePeersList')
    // @ts-ignore - Property 'certificates' is private
    storage.certificates.events.emit('replicated')

    expect(spyOnLoadCertificates).toBeCalled()
    expect(spyOnUpdatePeersList).toBeCalledWith({
      communityId: storage.communityId,
      peerId: peerId.toB58String()
    })
  })

  it('Certificates and peers list are updated on write event', async () => {
    storage = new Storage(tmpAppDataPath, connectionsManager.ioProxy, community.id, { createPaths: false })

    const peerId = await PeerId.create()
    const libp2p = await createLibp2p(peerId)

    await storage.init(libp2p, peerId)

    await storage.initDatabases()
    const spyOnLoadCertificates = jest.spyOn(storage.io, 'loadCertificates')
    const spyOnUpdatePeersList = jest.spyOn(storage.io, 'updatePeersList')
    // @ts-ignore - Property 'certificates' is private
    storage.certificates.events.emit('write', 'address', { payload: { value: 'something' } }, [])

    expect(spyOnLoadCertificates).toBeCalled()
    expect(spyOnUpdatePeersList).toBeCalledWith({
      communityId: storage.communityId,
      peerId: peerId.toB58String()
    })
  })
})

describe('Message', () => {
  it('is saved to db if passed signature verification', async () => {
    storage = new Storage(tmpAppDataPath, connectionsManager.ioProxy, community.id, { createPaths: false })

    const peerId = await PeerId.create()
    const libp2p = await createLibp2p(peerId)

    await storage.init(libp2p, peerId)

    await storage.initDatabases()

    await storage.subscribeToChannel(channelio)

    const spy = jest.spyOn(storage.publicChannelsRepos.get(message.channelAddress).db, 'add')

    await storage.sendMessage(message)

    // Confirm message has passed orbitdb validator (check signature verification only)
    expect(spy).toHaveBeenCalled()
  })

  // TODO: Message signature verification doesn't work, our theory is that our AccessController performs check after message is added to db.
  xit('is not saved to db if did not pass signature verification', async () => {
    const john = await factory.create<
    ReturnType<typeof identity.actions.addNewIdentity>['payload']
    >('Identity', { id: community.id, nickname: 'john' })

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

    storage = new Storage(tmpAppDataPath, connectionsManager.ioProxy, community.id, { createPaths: false })

    const peerId = await PeerId.create()
    const libp2p = await createLibp2p(peerId)

    await storage.init(libp2p, peerId)

    await storage.initDatabases()

    await storage.subscribeToChannel(channelio)

    const spy = jest.spyOn(storage.publicChannelsRepos.get(spoofedMessage.channelAddress).db, 'add')

    await storage.sendMessage(spoofedMessage)

    // Confirm message has passed orbitdb validator (check signature verification only)
    expect(spy).not.toHaveBeenCalled()
  })
})

describe('Files', () => {
  it('uploads file', async () => {
    storage = new Storage(tmpAppDataPath, connectionsManager.ioProxy, community.id, { createPaths: false })

    const peerId = await PeerId.create()
    const libp2p = await createLibp2p(peerId)

    await storage.init(libp2p, peerId)

    await storage.initDatabases()

    // Uploading
    const uploadSpy = jest.spyOn(storage.io, 'uploadedFile')
    const statusSpy = jest.spyOn(storage.io, 'updateDownloadProgress')
    const copyFileSpy = jest.spyOn(storage, 'copyFile')
    const metadata: FileMetadata = {
      path: path.join(__dirname, '/testUtils/test-image.png'),
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
    const newFilePath = copyFileSpy.mock.results[0].value
    metadata.path = newFilePath
    expect(uploadSpy).toBeCalledWith(expect.objectContaining({
      ...metadata,
      cid: expect.stringContaining('Qm'),
      width: 824,
      height: 44
    }))
    expect(statusSpy).toBeCalledWith(expect.objectContaining({
      cid: expect.stringContaining('Qm'),
      downloadState: DownloadState.Hosted,
      downloadProgress: undefined
    }))
  })

  it('uploads file other than image', async () => {
    storage = new Storage(tmpAppDataPath, connectionsManager.ioProxy, community.id, { createPaths: false })

    const peerId = await PeerId.create()
    const libp2p = await createLibp2p(peerId)

    await storage.init(libp2p, peerId)

    await storage.initDatabases()

    // Uploading
    const uploadSpy = jest.spyOn(storage.io, 'uploadedFile')
    const statusSpy = jest.spyOn(storage.io, 'updateDownloadProgress')
    const copyFileSpy = jest.spyOn(storage, 'copyFile')

    const metadata: FileMetadata = {
      path: path.join(__dirname, '/testUtils/test-file.pdf'),
      name: 'test-file',
      ext: '.pdf',
      cid: 'uploading_id',
      message: {
        id: 'id',
        channelAddress: 'channelAddress'
      }
    }

    await storage.uploadFile(metadata)
    expect(copyFileSpy).toHaveBeenCalled()
    const newFilePath = copyFileSpy.mock.results[0].value
    metadata.path = newFilePath
    expect(uploadSpy).toHaveBeenCalled()
    expect(uploadSpy).toBeCalledWith(expect.objectContaining({
      ...metadata,
      cid: expect.stringContaining('Qm'),
      width: null,
      height: null
    }))
    expect(statusSpy).toBeCalledWith(expect.objectContaining({
      cid: expect.stringContaining('Qm'),
      downloadState: DownloadState.Hosted,
      downloadProgress: undefined
    }))
  })

  it("throws error if file doesn't exists", async () => {
    storage = new Storage(tmpAppDataPath, connectionsManager.ioProxy, community.id, { createPaths: false })

    const peerId = await PeerId.create()
    const libp2p = await createLibp2p(peerId)

    await storage.init(libp2p, peerId)

    await storage.initDatabases()
    // Uploading
    const uploadSpy = jest.spyOn(storage.io, 'uploadedFile')

    const metadata: FileMetadata = {
      path: path.join(__dirname, '/testUtils/non-existent.png'),
      name: 'test-image',
      ext: '.png',
      cid: 'uploading_id',
      message: {
        id: 'id',
        channelAddress: 'channelAddress'
      }
    }

    await expect(storage.uploadFile(metadata)).rejects.toThrow()
    expect(uploadSpy).not.toHaveBeenCalled()
  })

  it('throws error if reported file size is malicious', async () => {
    storage = new Storage(tmpAppDataPath, connectionsManager.ioProxy, community.id, { createPaths: false })

    const peerId = await PeerId.create()
    const libp2p = await createLibp2p(peerId)

    await storage.init(libp2p, peerId)

    await storage.initDatabases()

    // Uploading
    const uploadSpy = jest.spyOn(storage.io, 'uploadedFile')

    const metadata: FileMetadata = {
      path: path.join(__dirname, '/testUtils/test-file.pdf'),
      name: 'test-file',
      ext: '.pdf',
      cid: 'uploading_id',
      message: {
        id: 'id',
        channelAddress: 'channelAddress'
      }
    }

    await storage.uploadFile(metadata)

    expect(uploadSpy).toHaveBeenCalled()

    // Downloading
    const progressSpy = jest.spyOn(storage.io, 'updateDownloadProgress')
    const downloadSpy = jest.spyOn(storage.io, 'updateMessageMedia')

    const uploadMetadata = uploadSpy.mock.calls[0][0]

    await storage.downloadFile({
      ...uploadMetadata,
      size: 20400
    })

    expect(progressSpy).toHaveBeenCalledWith(expect.objectContaining({
      downloadState: DownloadState.Malicious
    }))

    expect(downloadSpy).not.toHaveBeenCalled()
  })

  it('cancels download on demand', async () => {
    storage = new Storage(tmpAppDataPath, connectionsManager.ioProxy, community.id, { createPaths: false })

    const peerId = await PeerId.create()
    const libp2p = await createLibp2p(peerId)

    await storage.init(libp2p, peerId)

    await storage.initDatabases()

    // Uploading
    const uploadSpy = jest.spyOn(storage.io, 'uploadedFile')

    const metadata: FileMetadata = {
      path: path.join(__dirname, '/testUtils/test-file.pdf'),
      name: 'test-file',
      ext: '.pdf',
      cid: 'uploading_id',
      message: {
        id: 'id',
        channelAddress: 'channelAddress'
      }
    }

    await storage.uploadFile(metadata)

    expect(uploadSpy).toHaveBeenCalled()

    // Downloading
    const progressSpy = jest.spyOn(storage.io, 'updateDownloadProgress')
    const downloadSpy = jest.spyOn(storage.io, 'updateMessageMedia')

    const uploadMetadata = uploadSpy.mock.calls[0][0]

    await storage.cancelDownload('id')
    expect(storage.downloadCancellations.length).toBe(1)

    await storage.downloadFile({
      ...uploadMetadata
    })

    expect(progressSpy).toHaveBeenCalledWith(expect.objectContaining({
      downloadState: DownloadState.Canceled
    }))

    expect(downloadSpy).not.toHaveBeenCalled()

    // Confirm cancellation signal is cleared (download can be resumed)
    expect(storage.downloadCancellations.length).toBe(0)
  })

  it('is uploaded to IPFS then can be downloaded', async () => {
    storage = new Storage(tmpAppDataPath, connectionsManager.ioProxy, community.id, { createPaths: false })

    const peerId = await PeerId.create()
    const libp2p = await createLibp2p(peerId)

    await storage.init(libp2p, peerId)

    await storage.initDatabases()

    // Uploading
    const uploadSpy = jest.spyOn(storage.io, 'uploadedFile')

    const metadata: FileMetadata = {
      path: path.join(__dirname, '/testUtils/test-image.png'),
      name: 'test-image',
      ext: '.png',
      cid: 'uploading_id',
      message: {
        id: 'id',
        channelAddress: 'channelAddress'
      }
    }

    await storage.uploadFile(metadata)

    expect(uploadSpy).toHaveBeenCalled()

    // Downloading
    const progressSpy = jest.spyOn(storage.io, 'updateDownloadProgress')
    const downloadSpy = jest.spyOn(storage.io, 'updateMessageMedia')

    const uploadMetadata = uploadSpy.mock.calls[0][0]

    await storage.downloadFile(uploadMetadata)

    expect(progressSpy).toHaveBeenCalled()
    expect(progressSpy).toBeCalledWith(expect.objectContaining({
      cid: expect.stringContaining('Qm'),
      downloadState: DownloadState.Completed,
      downloadProgress: {
        size: uploadMetadata.size,
        downloaded: uploadMetadata.size,
        transferSpeed: 0
      }
    }))
    expect(downloadSpy).toHaveBeenCalled()
  })

  it('downloaded file matches uploaded file', async () => {
    storage = new Storage(tmpAppDataPath, connectionsManager.ioProxy, community.id, { createPaths: false })

    const peerId = await PeerId.create()
    const libp2p = await createLibp2p(peerId)

    await storage.init(libp2p, peerId)

    await storage.initDatabases()

    // Uploading
    const uploadSpy = jest.spyOn(storage.io, 'uploadedFile')
    const downloadSpy = jest.spyOn(storage.io, 'updateMessageMedia')

    const metadata: FileMetadata = {
      path: path.join(__dirname, '/testUtils/test-image.png'),
      name: 'test-image',
      ext: '.png',
      cid: 'uploading_id',
      message: {
        id: 'id',
        channelAddress: 'channelAddress'
      }
    }

    await storage.uploadFile(metadata)

    const uploadMetadata = uploadSpy.mock.calls[0][0]

    await storage.downloadFile(uploadMetadata)

    const downloadMetadata = downloadSpy.mock.calls[0][0]

    const uploadFileBuffer = fs.readFileSync(metadata.path)
    const downloadFileBuffer = fs.readFileSync(downloadMetadata.path)

    expect(uploadFileBuffer).toStrictEqual(downloadFileBuffer)
  })

  it('downloaded file chunk returns proper transferSpeed when no delay between entries', async () => {
    const fileSize = 524288 // 0.5MB
    createFile(filePath, fileSize)
    const mockDateNow = jest.fn()

    global.Date.now = mockDateNow
    mockDateNow.mockReturnValue(new Date('2022-04-07T10:20:30Z'))

    storage = new Storage(tmpAppDataPath, connectionsManager.ioProxy, community.id, { createPaths: false })

    const peerId = await PeerId.create()
    const libp2p = await createLibp2p(peerId)

    await storage.init(libp2p, peerId)

    await storage.initDatabases()

    // Uploading
    const uploadSpy = jest.spyOn(storage.io, 'uploadedFile')

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

    expect(uploadSpy).toHaveBeenCalled()

    // Downloading
    const progressSpy = jest.spyOn(storage.io, 'updateDownloadProgress')
    const uploadMetadata = uploadSpy.mock.calls[0][0]

    await storage.downloadFile(uploadMetadata)

    expect(progressSpy).toHaveBeenCalledTimes(3)

    const transferSpeeds = progressSpy.mock.calls.map((call) => call[0].downloadProgress.transferSpeed)
    const unwantedValues = [undefined, null, Infinity]
    for (const value of unwantedValues) {
      expect(transferSpeeds).not.toContain(value)
    }
  })

  it('copies file and returns a new path', () => {
    storage = new Storage(tmpAppDataPath, connectionsManager.ioProxy, community.id, { createPaths: false })
    const originalPath = path.join(__dirname, '/testUtils/test-image.png')
    const newPath = storage.copyFile(originalPath, '12345_test-image.png')
    expect(fs.existsSync(newPath)).toBeTruthy()
    expect(originalPath).not.toEqual(newPath)
  })

  it('tries to copy files, returns original path on error', () => {
    storage = new Storage(tmpAppDataPath, connectionsManager.ioProxy, community.id, { createPaths: false })
    const originalPath = path.join(__dirname, '/testUtils/test-image-non-existing.png')
    const newPath = storage.copyFile(originalPath, '12345_test-image.png')
    expect(originalPath).toEqual(newPath)
  })
})

describe('Users', () => {
  it('gets all users from db', async () => {
    storage = new Storage(tmpAppDataPath, connectionsManager.ioProxy, community.id, { createPaths: false })
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
