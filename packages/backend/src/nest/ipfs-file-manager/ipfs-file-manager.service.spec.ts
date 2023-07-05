import { LazyModuleLoader } from '@nestjs/core'
import { Test, TestingModule } from '@nestjs/testing'
import { FileMetadata } from '@quiet/types'
import path from 'path'
import fs from 'fs'
import PeerId from 'peer-id'
import { DirResult } from 'tmp'
import { fileURLToPath } from 'url'
import waitForExpect from 'wait-for-expect'
import { TestModule } from '../common/test.module'
import { createTmpDir, libp2pInstanceParams } from '../common/utils'
import { IpfsModule } from '../ipfs/ipfs.module'
import { IpfsService } from '../ipfs/ipfs.service'
import { Libp2pModule } from '../libp2p/libp2p.module'
import { Libp2pService } from '../libp2p/libp2p.service'
import { SocketModule } from '../socket/socket.module'
import { StorageEvents } from '../storage/storage.types'
import { IpfsFileManagerModule } from './ipfs-file-manager.module'
import { IpfsFileManagerService } from './ipfs-file-manager.service'
import { IpfsFilesManagerEvents } from './ipfs-file-manager.types'
import { jest } from '@jest/globals'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('IpfsFileManagerService', () => {
  let module: TestingModule
  let ipfsFileManagerService: IpfsFileManagerService
  let ipfsService: IpfsService
  let libp2pService: Libp2pService
  let lazyModuleLoader: LazyModuleLoader
  let peerId: PeerId

  let tmpDir: DirResult
  let filePath: string

  beforeEach(async () => {
    tmpDir = createTmpDir()
    // tmpAppDataPath = tmpQuietDirPath(tmpDir.name)
    filePath = path.join(dirname, '/testUtils/500kB-file.txt')

    module = await Test.createTestingModule({
      imports: [TestModule, IpfsFileManagerModule, IpfsModule, SocketModule, Libp2pModule],
    }).compile()

    ipfsFileManagerService = await module.resolve(IpfsFileManagerService)

    lazyModuleLoader = await module.resolve(LazyModuleLoader)

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

    await ipfsFileManagerService.init()
  })

  afterEach(async () => {
    await libp2pService.libp2pInstance?.stop()
    await ipfsService.ipfsInstance?.stop()
    await module.close()
  })

  it('uploads image', async () => {
    // Uploading
    const eventSpy = jest.spyOn(ipfsFileManagerService, 'emit')
    const copyFileSpy = jest.spyOn(ipfsFileManagerService, 'copyFile')
    const metadata: FileMetadata = {
      path: path.join(dirname, '/testUtils/test-image.png'),
      name: 'test-image',
      ext: '.png',
      cid: 'uploading_id',
      message: {
        id: 'id',
        channelId: 'channelId',
      },
    }

    await ipfsFileManagerService.uploadFile(metadata)
    expect(copyFileSpy).toHaveBeenCalled()
    const newFilePath = copyFileSpy.mock.results[0].value as string
    metadata.path = newFilePath

    const cid = 'QmSaK2joeTBYukh8L7besrvm56wSzMhn64nqLqtvxS3ths'
    await waitForExpect(() => {
      expect(eventSpy).toHaveBeenNthCalledWith(1, StorageEvents.REMOVE_DOWNLOAD_STATUS, { cid: 'uploading_id' })
    })
    await waitForExpect(() => {
      expect(eventSpy).toHaveBeenNthCalledWith(
        2,
        StorageEvents.UPLOADED_FILE,
        expect.objectContaining({
          cid,
          ext: '.png',
          height: 44,
          message: { channelId: 'channelId', id: 'id' },
          name: 'test-image',
          size: 15858,
          width: 824,
        })
      )
    })
    await waitForExpect(() => {
      expect(eventSpy).toHaveBeenNthCalledWith(3, StorageEvents.UPDATE_DOWNLOAD_PROGRESS, {
        cid,
        downloadProgress: undefined,
        downloadState: 'hosted',
        mid: 'id',
      })
    })
  })

  it('uploads file other than image', async () => {
    // Uploading
    const eventSpy = jest.spyOn(ipfsFileManagerService, 'emit')

    const metadata: FileMetadata = {
      path: path.join(dirname, '/testUtils/test-file.pdf'),
      name: 'test-file',
      ext: '.pdf',
      cid: 'uploading_id',
      message: {
        id: 'id',
        channelId: 'channelId',
      },
    }

    await ipfsFileManagerService.uploadFile(metadata)
    const cid = 'QmR5NiFh2bTZCpdxZkYTMaceJFaYTPuxEt8J9BhKKdSv1o'
    await waitForExpect(() => {
      expect(eventSpy).toHaveBeenNthCalledWith(1, StorageEvents.REMOVE_DOWNLOAD_STATUS, { cid: 'uploading_id' })
    })
    await waitForExpect(() => {
      expect(eventSpy).toHaveBeenNthCalledWith(
        2,
        StorageEvents.UPLOADED_FILE,
        expect.objectContaining({
          cid,
          ext: '.pdf',
          height: undefined,
          message: { channelId: 'channelId', id: 'id' },
          name: 'test-file',
          size: 761991,
          width: undefined,
        })
      )
    })
    await waitForExpect(() => {
      expect(eventSpy).toHaveBeenNthCalledWith(3, StorageEvents.UPDATE_DOWNLOAD_PROGRESS, {
        cid,
        downloadProgress: undefined,
        downloadState: 'hosted',
        mid: 'id',
      })
    })
    await waitForExpect(() => {
      expect(eventSpy).toHaveBeenNthCalledWith(
        4,
        StorageEvents.UPDATE_MESSAGE_MEDIA,
        expect.objectContaining({
          cid,
          ext: '.pdf',
          height: undefined,
          message: { channelId: 'channelId', id: 'id' },
          name: 'test-file',
          size: 761991,
          width: undefined,
        })
      )
    })
  })

  it("throws error if file doesn't exists", async () => {
    // Uploading
    const eventSpy = jest.spyOn(ipfsFileManagerService, 'emit')

    const metadata: FileMetadata = {
      path: path.join(dirname, '/testUtils/non-existent.png'),
      name: 'test-image',
      ext: '.png',
      cid: 'uploading_id',
      message: {
        id: 'id',
        channelId: 'channelId',
      },
    }

    await waitForExpect(async () => {
      await expect(ipfsFileManagerService.uploadFile(metadata)).rejects.toThrow()
    })
    await waitForExpect(() => {
      expect(eventSpy).not.toHaveBeenCalled()
    })
  })

  it('throws error if reported file size is malicious', async () => {
    // Uploading
    const eventSpy = jest.spyOn(ipfsFileManagerService, 'emit')

    const metadata: FileMetadata = {
      path: path.join(dirname, '/testUtils/test-file.pdf'),
      name: 'test-file',
      ext: '.pdf',
      cid: 'uploading_id',
      message: {
        id: 'id',
        channelId: 'channelId',
      },
    }

    await ipfsFileManagerService.uploadFile(metadata)
    const cid = 'QmR5NiFh2bTZCpdxZkYTMaceJFaYTPuxEt8J9BhKKdSv1o'
    await waitForExpect(() => {
      expect(eventSpy).toHaveBeenNthCalledWith(1, StorageEvents.REMOVE_DOWNLOAD_STATUS, { cid: 'uploading_id' })
    })
    await waitForExpect(() => {
      expect(eventSpy).toHaveBeenNthCalledWith(
        2,
        StorageEvents.UPLOADED_FILE,
        expect.objectContaining({
          cid,
          ext: '.pdf',
          height: undefined,
          message: { channelId: 'channelId', id: 'id' },
          name: 'test-file',
          size: 761991,
          width: undefined,
        })
      )
    })
    await waitForExpect(() => {
      expect(eventSpy).toHaveBeenNthCalledWith(3, StorageEvents.UPDATE_DOWNLOAD_PROGRESS, {
        cid,
        downloadProgress: undefined,
        downloadState: 'hosted',
        mid: 'id',
      })
    })
    await waitForExpect(() => {
      expect(eventSpy).toHaveBeenNthCalledWith(
        4,
        StorageEvents.UPDATE_MESSAGE_MEDIA,
        expect.objectContaining({
          cid,
          ext: '.pdf',
          height: undefined,
          message: { channelId: 'channelId', id: 'id' },
          name: 'test-file',
          size: 761991,
          width: undefined,
        })
      )
    })

    // Downloading

    const uploadMetadata: any = eventSpy.mock.calls[1][1]

    ipfsFileManagerService.emit(IpfsFilesManagerEvents.DOWNLOAD_FILE, {
      ...uploadMetadata,
      size: 20400,
    })

    await waitForExpect(() => {
      expect(eventSpy).toHaveBeenNthCalledWith(5, IpfsFilesManagerEvents.DOWNLOAD_FILE, {
        ...uploadMetadata,
        size: 20400,
      })
    })

    await waitForExpect(() => {
      expect(eventSpy).toHaveBeenNthCalledWith(6, StorageEvents.UPDATE_DOWNLOAD_PROGRESS, {
        cid,
        downloadProgress: undefined,
        downloadState: 'malicious',
        mid: 'id',
      })
    }, 20000)

    expect(eventSpy).toBeCalledTimes(6)
  })
  it('is uploaded to IPFS then can be downloaded', async () => {
    // Uploading
    const eventSpy = jest.spyOn(ipfsFileManagerService, 'emit')

    const metadata: FileMetadata = {
      path: path.join(dirname, '/testUtils/test-image.png'),
      name: 'test-image',
      ext: '.png',
      cid: 'uploading_id',
      message: {
        id: 'id',
        channelId: 'channelId',
      },
    }

    await ipfsFileManagerService.uploadFile(metadata)
    const cid = 'QmSaK2joeTBYukh8L7besrvm56wSzMhn64nqLqtvxS3ths'
    expect(eventSpy).toHaveBeenNthCalledWith(1, StorageEvents.REMOVE_DOWNLOAD_STATUS, { cid: 'uploading_id' })

    expect(eventSpy).toHaveBeenNthCalledWith(
      2,
      StorageEvents.UPLOADED_FILE,
      expect.objectContaining({
        cid,
        ext: '.png',
        height: 44,
        message: { channelId: 'channelId', id: 'id' },
        name: 'test-image',
        size: 15858,
        width: 824,
      })
    )

    expect(eventSpy).toHaveBeenNthCalledWith(3, StorageEvents.UPDATE_DOWNLOAD_PROGRESS, {
      cid,
      downloadProgress: undefined,
      downloadState: 'hosted',
      mid: 'id',
    })

    expect(eventSpy).toHaveBeenNthCalledWith(
      4,
      StorageEvents.UPDATE_MESSAGE_MEDIA,
      expect.objectContaining({
        cid,
        ext: '.png',
        height: 44,
        message: { channelId: 'channelId', id: 'id' },
        name: 'test-image',
        size: 15858,
        width: 824,
      })
    )

    // Downloading

    const uploadMetadata = eventSpy.mock.calls[1][1]

    ipfsFileManagerService.emit(IpfsFilesManagerEvents.DOWNLOAD_FILE, uploadMetadata)

    await waitForExpect(() => {
      expect(eventSpy).toHaveBeenNthCalledWith(5, IpfsFilesManagerEvents.DOWNLOAD_FILE, uploadMetadata)
    })

    await waitForExpect(() => {
      expect(eventSpy).toHaveBeenNthCalledWith(6, StorageEvents.UPDATE_DOWNLOAD_PROGRESS, {
        cid,
        downloadProgress: { downloaded: 15855, size: 15858, transferSpeed: 0 },
        downloadState: 'downloading',
        mid: 'id',
      })
    }, 20000)
    await waitForExpect(() => {
      expect(eventSpy).toHaveBeenNthCalledWith(7, StorageEvents.UPDATE_DOWNLOAD_PROGRESS, {
        cid,
        downloadProgress: { downloaded: 15855, size: 15858, transferSpeed: 0 },
        downloadState: 'completed',
        mid: 'id',
      })
    }, 20000)
    expect(eventSpy).toHaveBeenNthCalledWith(
      8,
      StorageEvents.UPDATE_MESSAGE_MEDIA,
      expect.objectContaining({
        cid,
        ext: '.png',
        height: 44,
        message: { channelId: 'channelId', id: 'id' },
        name: 'test-image',
        size: 15858,
        width: 824,
      })
    )
  })
  it('downloaded file matches uploaded file', async () => {
    // Uploading
    const eventSpy = jest.spyOn(ipfsFileManagerService, 'emit')
    const filePath = path.join(dirname, '/testUtils/test-image.png')
    const metadata: FileMetadata = {
      path: filePath,
      name: 'test-image',
      ext: '.png',
      cid: 'uploading_id',
      message: {
        id: 'id',
        channelId: 'channelId',
      },
    }

    await ipfsFileManagerService.uploadFile(metadata)

    const uploadMetadata = eventSpy.mock.calls[1][1]

    ipfsFileManagerService.emit(IpfsFilesManagerEvents.DOWNLOAD_FILE, uploadMetadata)

    const downloadMetadata = eventSpy.mock.calls[3][1]

    const uploadFileBuffer = fs.readFileSync(filePath)
    // @ts-ignore
    const downloadFileBuffer = fs.readFileSync(downloadMetadata.path)

    await waitForExpect(() => {
      expect(uploadFileBuffer).toStrictEqual(downloadFileBuffer)
    })
  })

  // it.skip('downloaded file chunk returns proper transferSpeed when no delay between entries', async () => {
  //   const fileSize = 52428800 // 50MB
  //   createFile(filePath, fileSize)

  //   const mockDateNow = jest.fn<() => number>()

  //   global.Date.now = mockDateNow
  //   mockDateNow.mockReturnValue(new Date('2022-04-07T10:20:30Z') as unknown as number)

  //   ipfsInstance = await create()

  //   fileManager = new IpfsFilesManager(ipfsInstance, tmpAppDataPath)

  //   // Uploading
  //   const eventSpy = jest.spyOn(fileManager, 'emit')

  //   const metadata: FileMetadata = {
  //     path: filePath,
  //     name: 'new-file',
  //     ext: '.txt',
  //     cid: 'uploading_id',
  //     message: {
  //       id: 'id',
  //       channelId: 'channelId',
  //     },
  //   }

  //   await fileManager.uploadFile(metadata)

  //   // Downloading
  //   const uploadMetadata: FileMetadata = eventSpy.mock.calls[1][1]

  //   fileManager.emit(IpfsFilesManagerEvents.DOWNLOAD_FILE, uploadMetadata)

  //   const transferSpeeds: number[] = []

  //   eventSpy.mock.calls.map(call => {
  //     if (call[0] === StorageEvents.UPDATE_DOWNLOAD_PROGRESS) {
  //       // @ts-ignore
  //       transferSpeeds.push(call[1].downloadProgress?.transferSpeed)
  //     }
  //   })
  //   const unwantedValues = [undefined, null, Infinity]
  //   for (const value of unwantedValues) {
  //     await waitForExpect(() => {
  //       expect(transferSpeeds).not.toContain(value)
  //     })
  //   }
  // })

  it('copies file and returns a new path', async () => {
    const originalPath = path.join(dirname, '/testUtils/test-image.png')
    const newPath = ipfsFileManagerService.copyFile(originalPath, '12345_test-image.png')
    expect(fs.existsSync(newPath)).toBeTruthy()
    expect(originalPath).not.toEqual(newPath)
  })

  it('tries to copy files, returns original path on error', async () => {
    const originalPath = path.join(dirname, '/testUtils/test-image-non-existing.png')
    const newPath = ipfsFileManagerService.copyFile(originalPath, '12345_test-image.png')
    expect(originalPath).toEqual(newPath)
  })
})
