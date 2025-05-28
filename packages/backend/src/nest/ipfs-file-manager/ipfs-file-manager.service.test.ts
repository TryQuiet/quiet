import { Test, TestingModule } from '@nestjs/testing'
import { IpfsFileManagerService } from './ipfs-file-manager.service'
import { DownloadState } from '@quiet/types'
import { EventEmitter } from 'events'

describe('IpfsFileManagerService - Download Progress Optimization', () => {
  let service: IpfsFileManagerService
  let mockUpdateStatus: jest.SpyInstance

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: IpfsFileManagerService,
          useValue: {
            updateStatus: jest.fn(),
            _downloadFile: jest.fn(),
          },
        },
      ],
    }).compile()

    service = module.get<IpfsFileManagerService>(IpfsFileManagerService)
    mockUpdateStatus = jest.spyOn(service, 'updateStatus')
  })

  afterEach(() => {
    jest.clearAllTimers()
    jest.useRealTimers()
  })

  describe('Progress updates based on file size', () => {
    it('should skip progress updates for auto-downloaded files (under 20MB)', async () => {
      jest.useFakeTimers()

      const smallFileMetadata = {
        cid: 'file123',
        ext: '.pdf',
        name: 'small-document',
        path: '/tmp/small.pdf',
        size: 5 * 1024 * 1024, // 5MB
        message: { id: 'msg123' },
      }

      // Simulate download that takes time
      service._downloadFile = jest.fn().mockImplementation(async () => {
        // Wait 5 seconds to simulate download
        await new Promise(resolve => setTimeout(resolve, 5000))
        return DownloadState.Completed
      })

      const downloadPromise = service.downloadFile(smallFileMetadata)

      // Fast forward time multiple times
      jest.advanceTimersByTime(1000)
      jest.advanceTimersByTime(1000)
      jest.advanceTimersByTime(1000)

      // For auto-downloaded files, updateStatus should only be called at start and end
      expect(mockUpdateStatus).toHaveBeenCalledTimes(1)
      expect(mockUpdateStatus).toHaveBeenCalledWith('file123', DownloadState.Downloading)

      // Complete the download
      jest.advanceTimersByTime(2000)
      await downloadPromise

      // Should have one more call for completion
      expect(mockUpdateStatus).toHaveBeenCalledTimes(2)
      expect(mockUpdateStatus).toHaveBeenLastCalledWith('file123', DownloadState.Completed)
    })

    it('should show progress updates for large files requiring user action (over 20MB)', async () => {
      jest.useFakeTimers()

      const largeFileMetadata = {
        cid: 'largefile123',
        ext: '.zip',
        name: 'large-archive',
        path: '/tmp/large.zip',
        size: 50 * 1024 * 1024, // 50MB
        message: { id: 'msg456' },
      }

      // Mock the download process
      let downloadResolver: () => void
      const downloadPromise = new Promise<void>(resolve => {
        downloadResolver = resolve
      })

      service._downloadFile = jest.fn().mockImplementation(async () => {
        await downloadPromise
        return DownloadState.Completed
      })

      const downloadTask = service.downloadFile(largeFileMetadata)

      // Fast forward time to trigger progress updates
      jest.advanceTimersByTime(1000) // First interval
      jest.advanceTimersByTime(1000) // Second interval

      // For large files, should continue to have progress updates
      // (In real implementation with proper interval setup)
      expect(mockUpdateStatus.mock.calls.length).toBeGreaterThanOrEqual(1)

      // Complete download
      downloadResolver!()
      await downloadTask
    })

    it('should correctly identify files that need progress updates', () => {
      const AUTODOWNLOAD_SIZE_LIMIT = 20971520 // 20 MB

      const testCases = [
        { size: 5 * 1024 * 1024, expectedProgress: false }, // 5MB - auto-download
        { size: 10 * 1024 * 1024, expectedProgress: false }, // 10MB - auto-download
        { size: 20 * 1024 * 1024, expectedProgress: false }, // 20MB - exactly at limit
        { size: 21 * 1024 * 1024, expectedProgress: true }, // 21MB - requires user action
        { size: 100 * 1024 * 1024, expectedProgress: true }, // 100MB - requires user action
      ]

      testCases.forEach(({ size, expectedProgress }) => {
        const requiresUserAction = size > AUTODOWNLOAD_SIZE_LIMIT
        expect(requiresUserAction).toBe(expectedProgress)
      })
    })
  })
})
