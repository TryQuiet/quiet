import { LazyModuleLoader } from '@nestjs/core'
import { Test, TestingModule } from '@nestjs/testing'
import { DownloadState, FileMetadata } from '@quiet/types'
import path from 'path'
import PeerId from 'peer-id'
import { DirResult } from 'tmp'
import { fileURLToPath } from 'url'
import waitForExpect from 'wait-for-expect'
import { TestModule } from '../common/test.module'
import { createFile, createTmpDir, libp2pInstanceParams } from '../common/utils'
import { IpfsModule } from '../ipfs/ipfs.module'
import { IpfsService } from '../ipfs/ipfs.service'
import { Libp2pModule } from '../libp2p/libp2p.module'
import { Libp2pService } from '../libp2p/libp2p.service'
import { SocketModule } from '../socket/socket.module'
import { StorageEvents } from '../storage/storage.types'
import { IpfsFileManagerModule } from './ipfs-file-manager.module'
import { IpfsFileManagerService } from './ipfs-file-manager.service'
import { jest } from '@jest/globals'
import { sleep } from '../common/sleep'
import fs from 'fs'

describe('IpfsFileManagerService', () => {
  let module: TestingModule
  let ipfsFileManagerService: IpfsFileManagerService
  let ipfsService: IpfsService
  let libp2pService: Libp2pService
  let lazyModuleLoader: LazyModuleLoader
  let peerId: PeerId

  let tmpDir: DirResult
  // let tmpAppDataPath: string
  let filePath: string

  beforeEach(async () => {
    tmpDir = createTmpDir()
    filePath = new URL('./testUtils/large-file.txt', import.meta.url).pathname

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
    tmpDir.removeCallback()
    if (fs.existsSync(filePath)) {
      fs.rmSync(filePath)
    }

    await module.close()
  })

  it('uploads large files', async () => {
    // Generate 2.1GB file
    createFile(filePath, 2147483000)

    // Uploading
    const eventSpy = jest.spyOn(ipfsFileManagerService, 'emit')
    const copyFileSpy = jest.spyOn(ipfsFileManagerService, 'copyFile')
    const metadata: FileMetadata = {
      path: filePath,
      name: 'test-large-file',
      ext: '.txt',
      cid: 'uploading_id',
      message: {
        id: 'id',
        channelId: 'channelId',
      },
    }

    await ipfsFileManagerService.uploadFile(metadata)
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
      expect(eventSpy).toHaveBeenNthCalledWith(
        2,
        StorageEvents.UPLOADED_FILE,
        expect.objectContaining({
          ...metadata,
          cid: expect.stringContaining('Qm'),
          width: undefined,
          height: undefined,
        })
      )
    })
    await waitForExpect(() => {
      expect(eventSpy).toHaveBeenNthCalledWith(
        3,
        StorageEvents.UPDATE_DOWNLOAD_PROGRESS,
        expect.objectContaining({
          cid: expect.stringContaining('Qm'),
          downloadState: DownloadState.Hosted,
          downloadProgress: undefined,
        })
      )
    })
    await waitForExpect(() => {
      expect(eventSpy).toHaveBeenNthCalledWith(
        4,
        StorageEvents.UPDATE_MESSAGE_MEDIA,
        expect.objectContaining({
          ...metadata,
          cid: expect.stringContaining('Qm'),
          width: undefined,
          height: undefined,
        })
      )
    })

    await sleep(20_000)

    await ipfsFileManagerService.stop()
    console.time('Stopping ipfs')
    await ipfsService.ipfsInstance?.stop()
    console.timeEnd('Stopping ipfs')

    // The jest test doesn't exit cleanly because of some asynchronous actions need time to complete, I can't find what is it.
    await sleep(100000)
  }, 1000000) // IPFS needs around 5 minutes to write 2.1GB file
})
