import fs from 'fs'
import path from 'path'
import PeerId from 'peer-id'
import { DirResult } from 'tmp'
import { Config } from '../constants'
import { createLibp2p, createTmpDir, tmpQuietDirPath, createFile } from '../common/testUtils'
import { Storage } from './storage'
import { FactoryGirl } from 'factory-girl'
import {
  communities,
  Community,
  getFactory,
  identity,
  prepareStore,
  publicChannels,
  Store,
  Identity,
  PublicChannelStorage,
  FileMetadata
} from '@quiet/state-manager'

describe('Storage', () => {
  let tmpDir: DirResult
  let tmpAppDataPath: string
  let tmpOrbitDbDir: string
  let tmpIpfsPath: string
  let storage: Storage
  let store: Store
  let factory: FactoryGirl
  let community: Community
  let channel: PublicChannelStorage
  let alice: Identity
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
  })

  beforeEach(async () => {
    jest.clearAllMocks()
    tmpDir = createTmpDir()
    tmpAppDataPath = tmpQuietDirPath(tmpDir.name)
    tmpOrbitDbDir = path.join(tmpAppDataPath, Config.ORBIT_DB_DIR)
    tmpIpfsPath = path.join(tmpAppDataPath, Config.IPFS_REPO_PATH)
    storage = null
    filePath = path.join(__dirname, '/testUtils/large-file.txt')
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

  it.skip('uploads large files', async () => {
    // Generate 2.1GB file
    createFile(filePath, 2147483648)

    storage = new Storage(tmpAppDataPath, community.id, { createPaths: false })

    const peerId = await PeerId.create()
    const libp2p = await createLibp2p(peerId)

    await storage.init(libp2p, peerId)

    await storage.initDatabases()

    // Uploading
    const eventSpy = jest.spyOn(storage, 'emit')
    const copyFileSpy = jest.spyOn(storage, 'copyFile')
    const metadata: FileMetadata = {
      path: filePath,
      name: 'test-large-file',
      ext: '.txt',
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
    expect(eventSpy).toHaveBeenNthCalledWith(1, 'adsf')
    // expect(uploadSpy).toHaveBeenCalled()
    // expect(uploadSpy).toBeCalledWith(expect.objectContaining({
    //   ...metadata,
    //   cid: expect.stringContaining('Qm'),
    //   width: null,
    //   height: null
    // }))
    // expect(statusSpy).toBeCalledWith(expect.objectContaining({
    //   cid: expect.stringContaining('Qm'),
    //   downloadState: DownloadState.Hosted,
    //   downloadProgress: undefined
    // }))
  }, 1000000) // IPFS needs around 5 minutes to write 2.1GB file
})
