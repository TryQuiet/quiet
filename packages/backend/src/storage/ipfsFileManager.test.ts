import fs from 'fs'
import path from 'path'
import type { IPFS } from 'ipfs-core'

import { fileURLToPath } from 'url'
import { type DirResult } from 'tmp'

import { jest, beforeEach, describe, it, expect, afterEach } from '@jest/globals'
import { create } from 'ipfs-core'
import waitForExpect from 'wait-for-expect'
import { IpfsFilesManager, IpfsFilesManagerEvents } from './ipfsFileManager'
import { type FileMetadata } from '@quiet/types'
import { StorageEvents } from './types'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const { createTmpDir, tmpQuietDirPath, createFile } = await import('../common/testUtils')

let tmpDir: DirResult
let tmpAppDataPath: string
let filePath: string
let ipfsInstance: IPFS
let fileManager: IpfsFilesManager

beforeEach(async () => {
  jest.clearAllMocks()
  tmpDir = createTmpDir()
  tmpAppDataPath = tmpQuietDirPath(tmpDir.name)
  filePath = path.join(
    dirname, '/testUtils/500kB-file.txt')
})

afterEach(async () => {
  tmpDir?.removeCallback()
  if (fs.existsSync(filePath)) {
    fs.rmSync(filePath)
  }
  await fileManager?.stop()
  await ipfsInstance?.stop()
})

describe('Ipfs file manager', () => {
  it('uploads image', async () => {
    ipfsInstance = await create()

    fileManager = new IpfsFilesManager(ipfsInstance, tmpAppDataPath)

    // Uploading
    const eventSpy = jest.spyOn(fileManager, 'emit')
    const copyFileSpy = jest.spyOn(fileManager, 'copyFile')
    const metadata: FileMetadata = {
      path: path.join(dirname, '/testUtils/test-image.png'),
      name: 'test-image',
      ext: '.png',
      cid: 'uploading_id',
      message: {
        id: 'id',
        channelId: 'channelId'
      }
    }

    await fileManager.uploadFile(metadata)
    expect(copyFileSpy).toHaveBeenCalled()
    const newFilePath = copyFileSpy.mock.results[0].value as string
    metadata.path = newFilePath

    const cid = 'QmSaK2joeTBYukh8L7besrvm56wSzMhn64nqLqtvxS3ths'
    await waitForExpect(() => {
      expect(eventSpy).toHaveBeenNthCalledWith(1, StorageEvents.REMOVE_DOWNLOAD_STATUS, { cid: 'uploading_id' })
    })
    await waitForExpect(() => {
      expect(eventSpy).toHaveBeenNthCalledWith(2, StorageEvents.UPLOADED_FILE, expect.objectContaining({ cid, ext: '.png', height: 44, message: { channelId: 'channelId', id: 'id' }, name: 'test-image', size: 15858, width: 824 })
      )
    })
    await waitForExpect(() => {
      expect(eventSpy).toHaveBeenNthCalledWith(3, StorageEvents.UPDATE_DOWNLOAD_PROGRESS, { cid, downloadProgress: undefined, downloadState: 'hosted', mid: 'id' })
    })
  })

  it('uploads file other than image', async () => {
    ipfsInstance = await create()

    fileManager = new IpfsFilesManager(ipfsInstance, tmpAppDataPath)

    // Uploading
    const eventSpy = jest.spyOn(fileManager, 'emit')

    const metadata: FileMetadata = {
      path: path.join(dirname, '/testUtils/test-file.pdf'),
      name: 'test-file',
      ext: '.pdf',
      cid: 'uploading_id',
      message: {
        id: 'id',
        channelId: 'channelId'
      }
    }

    await fileManager.uploadFile(metadata)
    const cid = 'QmR5NiFh2bTZCpdxZkYTMaceJFaYTPuxEt8J9BhKKdSv1o'
    await waitForExpect(() => {
      expect(eventSpy).toHaveBeenNthCalledWith(1, StorageEvents.REMOVE_DOWNLOAD_STATUS, { cid: 'uploading_id' })
    })
    await waitForExpect(() => {
      expect(eventSpy).toHaveBeenNthCalledWith(2, StorageEvents.UPLOADED_FILE, expect.objectContaining({ cid, ext: '.pdf', height: undefined, message: { channelId: 'channelId', id: 'id' }, name: 'test-file', size: 761991, width: undefined }
      )
      )
    })
    await waitForExpect(() => {
      expect(eventSpy).toHaveBeenNthCalledWith(3, StorageEvents.UPDATE_DOWNLOAD_PROGRESS, { cid, downloadProgress: undefined, downloadState: 'hosted', mid: 'id' })
    })
    await waitForExpect(() => {
      expect(eventSpy).toHaveBeenNthCalledWith(4, StorageEvents.UPDATE_MESSAGE_MEDIA, expect.objectContaining({ cid, ext: '.pdf', height: undefined, message: { channelId: 'channelId', id: 'id' }, name: 'test-file', size: 761991, width: undefined })
      )
    })
  })

  it("throws error if file doesn't exists", async () => {
    ipfsInstance = await create()

    fileManager = new IpfsFilesManager(ipfsInstance, tmpAppDataPath)
    // Uploading
    const eventSpy = jest.spyOn(fileManager, 'emit')

    const metadata: FileMetadata = {
      path: path.join(dirname, '/testUtils/non-existent.png'),
      name: 'test-image',
      ext: '.png',
      cid: 'uploading_id',
      message: {
        id: 'id',
        channelId: 'channelId'
      }
    }

   await waitForExpect(async () => {
      await expect(fileManager.uploadFile(metadata)).rejects.toThrow()
    })
    await waitForExpect(() => {
      expect(eventSpy).not.toHaveBeenCalled()
    })
  })

  it('throws error if reported file size is malicious', async () => {
    ipfsInstance = await create()

    fileManager = new IpfsFilesManager(ipfsInstance, tmpAppDataPath)

    // Uploading
    const eventSpy = jest.spyOn(fileManager, 'emit')

    const metadata: FileMetadata = {
      path: path.join(dirname, '/testUtils/test-file.pdf'),
      name: 'test-file',
      ext: '.pdf',
      cid: 'uploading_id',
      message: {
        id: 'id',
        channelId: 'channelId'
      }
    }

    await fileManager.uploadFile(metadata)
    const cid = 'QmR5NiFh2bTZCpdxZkYTMaceJFaYTPuxEt8J9BhKKdSv1o'
    await waitForExpect(() => {
      expect(eventSpy).toHaveBeenNthCalledWith(1, StorageEvents.REMOVE_DOWNLOAD_STATUS, { cid: 'uploading_id' })
    })
    await waitForExpect(() => {
      expect(eventSpy).toHaveBeenNthCalledWith(2, StorageEvents.UPLOADED_FILE, expect.objectContaining({ cid, ext: '.pdf', height: undefined, message: { channelId: 'channelId', id: 'id' }, name: 'test-file', size: 761991, width: undefined }))
    })
    await waitForExpect(() => {
      expect(eventSpy).toHaveBeenNthCalledWith(3, StorageEvents.UPDATE_DOWNLOAD_PROGRESS, { cid, downloadProgress: undefined, downloadState: 'hosted', mid: 'id' })
    })
    await waitForExpect(() => {
      expect(eventSpy).toHaveBeenNthCalledWith(4, StorageEvents.UPDATE_MESSAGE_MEDIA, expect.objectContaining({ cid, ext: '.pdf', height: undefined, message: { channelId: 'channelId', id: 'id' }, name: 'test-file', size: 761991, width: undefined }))
    })

    // Downloading

    const uploadMetadata: any = eventSpy.mock.calls[1][1]

    fileManager.emit(IpfsFilesManagerEvents.DOWNLOAD_FILE, {
      ...uploadMetadata,
      size: 20400
    })

    await waitForExpect(() => {
      expect(eventSpy).toHaveBeenNthCalledWith(5, IpfsFilesManagerEvents.DOWNLOAD_FILE, { ...uploadMetadata, size: 20400 })
    })

    await waitForExpect(() => {
      expect(eventSpy).toHaveBeenNthCalledWith(6, StorageEvents.UPDATE_DOWNLOAD_PROGRESS, { cid, downloadProgress: undefined, downloadState: 'malicious', mid: 'id' })
    }, 20000)

    expect(eventSpy).toBeCalledTimes(6)
  })

  it.skip('cancels download on demand', async () => {
    ipfsInstance = await create()

    fileManager = new IpfsFilesManager(ipfsInstance, tmpAppDataPath)

    // Uploading
    const eventSpy = jest.spyOn(fileManager, 'emit')

    const cid = 'QmaA1C173ZDtoo7K6tLqq6o2eRce3kgwoVQpxsTfQgNjDZ'
    const metadata: FileMetadata = {
      path: path.join(dirname, '/testUtils/test-file.pdf'),
      name: 'test-file',
      ext: '.pdf',
      cid,
      message: {
        id: 'id',
        channelId: 'channelId'
      }
    }

    await fileManager.uploadFile(metadata)

    // Downloading
    await waitForExpect(() => {
      expect(eventSpy).toHaveBeenNthCalledWith(1, StorageEvents.REMOVE_DOWNLOAD_STATUS, { cid })
    })
    await waitForExpect(() => {
      expect(eventSpy).toHaveBeenNthCalledWith(2, StorageEvents.UPLOADED_FILE, expect.objectContaining({ cid, ext: '.pdf', height: undefined, message: { channelId: 'channelId', id: 'id' }, name: 'test-file', size: 761797, width: undefined })
      )
    })
    await waitForExpect(() => {
      expect(eventSpy).toHaveBeenNthCalledWith(3, StorageEvents.UPDATE_DOWNLOAD_PROGRESS, { cid, downloadProgress: undefined, downloadState: 'hosted', mid: 'id' }
      )
    })
    await waitForExpect(() => {
      expect(eventSpy).toHaveBeenNthCalledWith(4, StorageEvents.UPDATE_MESSAGE_MEDIA, expect.objectContaining({ cid, ext: '.pdf', height: undefined, message: { channelId: 'channelId', id: 'id' }, name: 'test-file', size: 761797, width: undefined })
      )
    })

    fileManager.emit(IpfsFilesManagerEvents.DOWNLOAD_FILE, metadata)

    await waitForExpect(() => {
      expect(eventSpy).toHaveBeenNthCalledWith(5, IpfsFilesManagerEvents.DOWNLOAD_FILE, metadata)
    })

    // TODO: Test fails here because download is too fast, we need to run those tests with 2 clients and tor. (integration tests are the best candidate for testing this)
    fileManager.emit(IpfsFilesManagerEvents.CANCEL_DOWNLOAD, cid)

    await waitForExpect(() => {
      expect(eventSpy).toHaveBeenNthCalledWith(6, IpfsFilesManagerEvents.CANCEL_DOWNLOAD, cid)
    })

    const uploadMetadata = eventSpy.mock.calls[1][1]

    await waitForExpect(() => {
      expect(eventSpy).toHaveBeenNthCalledWith(1, StorageEvents.UPDATE_DOWNLOAD_PROGRESS, { cid, downloadProgress: { downloaded: 0, size: 761797, transferSpeed: 0 }, downloadState: 'canceled', mid: 'id' }
      )
    })

    expect(eventSpy).toBeCalledTimes(5)
  })
  it('is uploaded to IPFS then can be downloaded', async () => {
    ipfsInstance = await create()

    fileManager = new IpfsFilesManager(ipfsInstance, tmpAppDataPath)

    // Uploading
    const eventSpy = jest.spyOn(fileManager, 'emit')

    const metadata: FileMetadata = {
      path: path.join(dirname, '/testUtils/test-image.png'),
      name: 'test-image',
      ext: '.png',
      cid: 'uploading_id',
      message: {
        id: 'id',
        channelId: 'channelId'
      }
    }

    await fileManager.uploadFile(metadata)
    const cid = 'QmSaK2joeTBYukh8L7besrvm56wSzMhn64nqLqtvxS3ths'
    expect(eventSpy).toHaveBeenNthCalledWith(1, StorageEvents.REMOVE_DOWNLOAD_STATUS, { cid: 'uploading_id' }
    )

    expect(eventSpy).toHaveBeenNthCalledWith(2, StorageEvents.UPLOADED_FILE, expect.objectContaining({ cid, ext: '.png', height: 44, message: { channelId: 'channelId', id: 'id' }, name: 'test-image', size: 15858, width: 824 })
    )

    expect(eventSpy).toHaveBeenNthCalledWith(3, StorageEvents.UPDATE_DOWNLOAD_PROGRESS, { cid, downloadProgress: undefined, downloadState: 'hosted', mid: 'id' }
    )

    expect(eventSpy).toHaveBeenNthCalledWith(4, StorageEvents.UPDATE_MESSAGE_MEDIA, expect.objectContaining({ cid, ext: '.png', height: 44, message: { channelId: 'channelId', id: 'id' }, name: 'test-image', size: 15858, width: 824 })
    )

    // Downloading

    const uploadMetadata = eventSpy.mock.calls[1][1]

    fileManager.emit(IpfsFilesManagerEvents.DOWNLOAD_FILE, uploadMetadata)

    await waitForExpect(() => {
      expect(eventSpy).toHaveBeenNthCalledWith(5, IpfsFilesManagerEvents.DOWNLOAD_FILE, uploadMetadata)
    })

    await waitForExpect(() => {
      expect(eventSpy).toHaveBeenNthCalledWith(6, StorageEvents.UPDATE_DOWNLOAD_PROGRESS, { cid, downloadProgress: { downloaded: 15855, size: 15858, transferSpeed: 0 }, downloadState: 'downloading', mid: 'id' }
      )
    }, 20000)
    await waitForExpect(() => {
      expect(eventSpy).toHaveBeenNthCalledWith(7, StorageEvents.UPDATE_DOWNLOAD_PROGRESS, { cid, downloadProgress: { downloaded: 15855, size: 15858, transferSpeed: 0 }, downloadState: 'completed', mid: 'id' }
      )
    }, 20000)
    expect(eventSpy).toHaveBeenNthCalledWith(8, StorageEvents.UPDATE_MESSAGE_MEDIA, expect.objectContaining({ cid, ext: '.png', height: 44, message: { channelId: 'channelId', id: 'id' }, name: 'test-image', size: 15858, width: 824 })
    )
  })
  it('downloaded file matches uploaded file', async () => {
    ipfsInstance = await create()

    fileManager = new IpfsFilesManager(ipfsInstance, tmpAppDataPath)

    // Uploading
    const eventSpy = jest.spyOn(fileManager, 'emit')
    const filePath = path.join(dirname, '/testUtils/test-image.png')
    const metadata: FileMetadata = {
      path: filePath,
      name: 'test-image',
      ext: '.png',
      cid: 'uploading_id',
      message: {
        id: 'id',
        channelId: 'channelId'
      }
    }

    await fileManager.uploadFile(metadata)

    const uploadMetadata = eventSpy.mock.calls[1][1]

    fileManager.emit(IpfsFilesManagerEvents.DOWNLOAD_FILE, uploadMetadata)

    const downloadMetadata = eventSpy.mock.calls[3][1]

    const uploadFileBuffer = fs.readFileSync(filePath)
    // @ts-ignore
    const downloadFileBuffer = fs.readFileSync(downloadMetadata.path)

    await waitForExpect(() => {
      expect(uploadFileBuffer).toStrictEqual(downloadFileBuffer)
    })
  })

  it.skip('downloaded file chunk returns proper transferSpeed when no delay between entries', async () => {
    const fileSize = 52428800 // 50MB
    createFile(filePath, fileSize)

    const mockDateNow = jest.fn<() => number>()

    global.Date.now = mockDateNow
    mockDateNow.mockReturnValue(new Date('2022-04-07T10:20:30Z') as unknown as number)

    ipfsInstance = await create()

    fileManager = new IpfsFilesManager(ipfsInstance, tmpAppDataPath)

    // Uploading
    const eventSpy = jest.spyOn(fileManager, 'emit')

    const metadata: FileMetadata = {
      path: filePath,
      name: 'new-file',
      ext: '.txt',
      cid: 'uploading_id',
      message: {
        id: 'id',
        channelId: 'channelId'
      }
    }

    await fileManager.uploadFile(metadata)

    // Downloading
    const uploadMetadata: FileMetadata = eventSpy.mock.calls[1][1]

    fileManager.emit(IpfsFilesManagerEvents.DOWNLOAD_FILE, uploadMetadata)

    const transferSpeeds: number[] = []

    eventSpy.mock.calls.map((call) => {
      if (call[0] === StorageEvents.UPDATE_DOWNLOAD_PROGRESS) {
        // @ts-ignore
        transferSpeeds.push(call[1].downloadProgress?.transferSpeed)
      }
    }
    )
    const unwantedValues = [undefined, null, Infinity]
    for (const value of unwantedValues) {
      await waitForExpect(() => {
        expect(transferSpeeds).not.toContain(value)
      })
    }
  })

  it('copies file and returns a new path', async () => {
    ipfsInstance = await create()
    fileManager = new IpfsFilesManager(ipfsInstance, tmpAppDataPath)
    const originalPath = path.join(dirname, '/testUtils/test-image.png')
    const newPath = fileManager.copyFile(originalPath, '12345_test-image.png')
    expect(fs.existsSync(newPath)).toBeTruthy()
    expect(originalPath).not.toEqual(newPath)
  })

  it('tries to copy files, returns original path on error', async () => {
    ipfsInstance = await create()
    fileManager = new IpfsFilesManager(ipfsInstance, tmpAppDataPath)
    const originalPath = path.join(dirname, '/testUtils/test-image-non-existing.png')
    const newPath = fileManager.copyFile(originalPath, '12345_test-image.png')
    expect(originalPath).toEqual(newPath)
  })
})
