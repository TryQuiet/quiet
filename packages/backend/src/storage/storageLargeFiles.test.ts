import fs from 'fs'
import { DirResult } from 'tmp'
import { createTmpDir, tmpQuietDirPath, createFile } from '../common/testUtils'
import { create } from 'ipfs-core'

import {
  FileMetadata,
  DownloadState
} from '@quiet/state-manager'
import { jest, beforeEach, describe, it, expect, afterEach } from '@jest/globals'
import { StorageEvents } from './types'

import { IpfsFilesManager } from './ipfsFileManager'
import waitForExpect from 'wait-for-expect'

describe('Storage', () => {
  let tmpDir: DirResult
  let tmpAppDataPath: string

  let filePath: string

  beforeEach(async () => {
    jest.clearAllMocks()
    tmpDir = createTmpDir()
    tmpAppDataPath = tmpQuietDirPath(tmpDir.name)
    filePath = new URL('./testUtils/large-file.txt', import.meta.url).pathname
  })

  afterEach(async () => {
    tmpDir.removeCallback()
    if (fs.existsSync(filePath)) {
      fs.rmSync(filePath)
    }
  })

  it('uploads large files', async () => {
    // Generate 2.1GB file
    createFile(filePath, 2147483648)

    const ipfsInstance = await create()

    const fileManager = new IpfsFilesManager(ipfsInstance, tmpAppDataPath)

    // Uploading
    const eventSpy = jest.spyOn(fileManager, 'emit')
    const copyFileSpy = jest.spyOn(fileManager, 'copyFile')
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

    await fileManager.uploadFile(metadata)
    expect(copyFileSpy).toHaveBeenCalled()
    const newFilePath = copyFileSpy.mock.results[0].value
    metadata.path = newFilePath as string

    await waitForExpect(() => {
      expect(eventSpy).toHaveBeenCalledTimes(4)
    })
    await waitForExpect(() => {
      expect(eventSpy).toHaveBeenNthCalledWith(1, StorageEvents.REMOVE_DOWNLOAD_STATUS, { cid: metadata.cid })
    })
    await waitForExpect(() => {
      expect(eventSpy).toHaveBeenNthCalledWith(2, StorageEvents.UPLOADED_FILE, expect.objectContaining({
        ...metadata,
        cid: expect.stringContaining('Qm'),
        width: null,
        height: null
      }))
    })
    await waitForExpect(() => {
      expect(eventSpy).toHaveBeenNthCalledWith(3, StorageEvents.UPDATE_DOWNLOAD_PROGRESS, expect.objectContaining({
        cid: expect.stringContaining('Qm'),
        downloadState: DownloadState.Hosted,
        downloadProgress: undefined
      }))
    })
    await waitForExpect(() => {
      expect(eventSpy).toHaveBeenNthCalledWith(4, StorageEvents.UPDATE_MESSAGE_MEDIA, expect.objectContaining({
        ...metadata,
        cid: expect.stringContaining('Qm'),
        width: null,
        height: null
      }))
    })

    await fileManager.stop()
    await ipfsInstance.stop()
  }, 1000000) // IPFS needs around 5 minutes to write 2.1GB file
})
