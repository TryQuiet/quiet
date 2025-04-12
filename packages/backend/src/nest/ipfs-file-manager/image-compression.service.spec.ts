import { Test, TestingModule } from '@nestjs/testing'
import { ImageCompressionService } from './image-compression.service'
import * as fs from 'fs'
import * as path from 'path'
import * as jimpModule from 'jimp'

// Mock the fs module
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  statSync: jest.fn(),
  unlinkSync: jest.fn(),
  renameSync: jest.fn(),
  copyFileSync: jest.fn(),
}))

// Mock Jimp
// Mock Jimp
jest.mock('jimp', () => {
  // Create a mock Jimp instance
  const mockJimpInstance = {
    bitmap: {
      width: 3000,
      height: 2000,
    },
    // Add required mock methods
    resize: jest.fn().mockReturnThis(),
    write: jest.fn().mockResolvedValue(undefined),
    // Add these properties to satisfy the type checker
    background: 0,
    formats: [],
    mime: 'image/jpeg',
    getWidth: jest.fn().mockReturnValue(3000),
    getHeight: jest.fn().mockReturnValue(2000),
  }

  return {
    Jimp: {
      read: jest.fn().mockResolvedValue(mockJimpInstance),
    },
  }
})

describe('ImageCompressionService', () => {
  let service: ImageCompressionService
  let mockFilePath: string

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ImageCompressionService],
    }).compile()

    service = module.get<ImageCompressionService>(ImageCompressionService)

    // Reset all mocks
    jest.clearAllMocks()

    // Set up common test data
    mockFilePath = '/path/to/test-image.jpg'
  })

  describe('processImage', () => {
    it('should return the original path if file size is already small enough', async () => {
      // Mock file stats to return a small file size (under 100KB)
      const smallFileSize = 50 * 1024 // 50KB
      jest.spyOn(fs, 'existsSync').mockReturnValue(true)
      jest.spyOn(fs, 'statSync').mockReturnValue({ size: smallFileSize } as any)

      const result = await service.processImage(mockFilePath, '.jpg')

      // Should return original path for small files
      expect(result).toBe(mockFilePath)

      // Validate that compression was not attempted
      expect(jimpModule.Jimp.read).not.toHaveBeenCalled()
    })

    it('should compress large images and replace the original file', async () => {
      // Mock file stats to return a large file size (over 100KB)
      const largeFileSize = 500 * 1024 // 500KB
      const smallFileSize = 80 * 1024 // 80KB after compression

      // Setup mocks
      jest.spyOn(fs, 'existsSync').mockReturnValue(true)

      // First call returns large size, subsequent call returns compressed size
      jest
        .spyOn(fs, 'statSync')
        .mockReturnValueOnce({ size: largeFileSize } as any)
        .mockReturnValueOnce({ size: smallFileSize } as any)

      // Mock path functions
      jest.spyOn(path, 'parse').mockReturnValue({
        dir: '/path/to',
        name: 'test-image',
        ext: '.jpg',
      } as any)

      const result = await service.processImage(mockFilePath, '.jpg')

      // Should return the original path after compression
      expect(result).toBe(mockFilePath)

      // Validate that image was loaded and processed
      expect(jimpModule.Jimp.read).toHaveBeenCalledWith(mockFilePath)

      // Validate that files were manipulated correctly
      expect(fs.unlinkSync).toHaveBeenCalledWith(mockFilePath)
      expect(fs.renameSync).toHaveBeenCalledWith('/path/to/test-image_temp.jpg', mockFilePath)
    })

    it('should try multiple scaling factors until target size is reached', async () => {
      // Mock file stats to return sizes that require multiple resize attempts
      const originalSize = 1000 * 1024 // 1MB
      const firstResizeSize = 300 * 1024 // 300KB after first resize
      const secondResizeSize = 80 * 1024 // 80KB after second resize

      // Setup mocks
      jest.spyOn(fs, 'existsSync').mockReturnValue(true)

      // Return different sizes for each call
      jest
        .spyOn(fs, 'statSync')
        .mockReturnValueOnce({ size: originalSize } as any)
        .mockReturnValueOnce({ size: firstResizeSize } as any)
        .mockReturnValueOnce({ size: secondResizeSize } as any)

      // Mock path functions
      jest.spyOn(path, 'parse').mockReturnValue({
        dir: '/path/to',
        name: 'test-image',
        ext: '.jpg',
      } as any)

      // We're using the mock instance from the jest.mock above

      // Use a different implementation for each read call
      // Get the mockJimpInstance from the jest mock setup
      const mockJimpInstance = await jimpModule.Jimp.read('')
      jest
        .spyOn(jimpModule.Jimp, 'read')
        .mockResolvedValueOnce(mockJimpInstance) // First call
        .mockResolvedValueOnce(mockJimpInstance) // Second call

      const result = await service.processImage(mockFilePath, '.jpg')

      // Should return the original path after compression
      expect(result).toBe(mockFilePath)

      // Verify Jimp.read was called multiple times
      expect(jimpModule.Jimp.read).toHaveBeenCalledTimes(2)

      // Verify resize was called with different dimensions
      expect(mockJimpInstance.resize).toHaveBeenCalledTimes(2)

      // Verify file operations
      expect(fs.unlinkSync).toHaveBeenCalledWith(mockFilePath)
      expect(fs.renameSync).toHaveBeenCalledWith('/path/to/test-image_temp.jpg', mockFilePath)
    })

    it('should handle errors during image processing', async () => {
      // Mock a file that exists
      jest.spyOn(fs, 'existsSync').mockReturnValue(true)

      // Mock statSync to return a large file
      jest.spyOn(fs, 'statSync').mockReturnValue({ size: 500 * 1024 } as any)

      // Mock Jimp.read to throw an error
      jest.spyOn(jimpModule.Jimp, 'read').mockRejectedValue(new Error('Test error'))

      const result = await service.processImage(mockFilePath, '.jpg')

      // Should return original path when errors occur
      expect(result).toBe(mockFilePath)

      // File operations should not be called
      expect(fs.unlinkSync).not.toHaveBeenCalled()
      expect(fs.renameSync).not.toHaveBeenCalled()
    })
  })
})
