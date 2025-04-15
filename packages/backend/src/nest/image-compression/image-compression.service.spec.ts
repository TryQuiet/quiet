import { Test, TestingModule } from '@nestjs/testing'
import { ImageCompressionService } from './image-compression.service'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import * as crypto from 'crypto'
import { readImage } from './jimp-utils'
import { fileURLToPath } from 'url'

// Get the directory of the current file (ESM compatible)
const currentFilePath = fileURLToPath(import.meta.url)
const dirname = path.dirname(currentFilePath)
// Path to test images folder
const TEST_IMAGES_DIR = path.join(dirname, 'test-images')

describe('ImageCompressionService Tests', () => {
  let service: ImageCompressionService
  let tempDir: string

  beforeEach(async () => {
    // Create a temp directory for test files
    const testId = process.env.JEST_WORKER_ID || crypto.randomBytes(4).toString('hex')
    tempDir = path.join(os.tmpdir(), `image-compression-test-${testId}`)
    fs.mkdirSync(tempDir, { recursive: true })

    // Set up the service
    const module: TestingModule = await Test.createTestingModule({
      providers: [ImageCompressionService],
    }).compile()

    service = module.get<ImageCompressionService>(ImageCompressionService)
  })

  afterEach(() => {
    // Clean up temp files
    if (fs.existsSync(tempDir)) {
      const files = fs.readdirSync(tempDir)
      for (const file of files) {
        fs.unlinkSync(path.join(tempDir, file))
      }
      fs.rmdirSync(tempDir)
    }
  })

  // Test case for verifying the service's ability to handle images already under the target size
  it('should not process images already under the target size', async () => {
    const targetMaxSize = service['TARGET_MAX_SIZE']

    // Use the small test image
    const smallImagePath = path.join(TEST_IMAGES_DIR, 'test-image-small-pexels-melisa-uygun-2150369123-31102047.jpg')
    expect(fs.existsSync(smallImagePath)).toBeTruthy()

    // Copy to temp directory for testing
    const testImagePath = path.join(tempDir, 'small-test.jpg')
    fs.copyFileSync(smallImagePath, testImagePath)

    // Verify the file size
    const originalSize = fs.statSync(testImagePath).size
    console.log(
      `Original file size: ${(originalSize / 1024).toFixed(1)}KB (under target of ${(targetMaxSize / 1024).toFixed(1)}KB)`
    )
    expect(originalSize).toBeLessThan(targetMaxSize)

    // Save original modification time and content for comparison
    const originalModTime = fs.statSync(testImagePath).mtime.getTime()
    const originalContent = fs.readFileSync(testImagePath)

    // Process the image
    const resultPath = await service.processImage(testImagePath, '.jpg')

    // The service should return a path to a copy file
    expect(resultPath).not.toBe(testImagePath)
    expect(resultPath.includes('_compressed')).toBeTruthy()

    // Verify both files exist
    expect(fs.existsSync(testImagePath)).toBeTruthy()
    expect(fs.existsSync(resultPath)).toBeTruthy()

    // Verify the original file was not changed
    const originalAfterStats = fs.statSync(testImagePath)
    expect(originalAfterStats.size).toBe(originalSize)
    expect(originalAfterStats.mtime.getTime()).toBe(originalModTime)

    // Verify original content is unchanged
    const originalAfterContent = fs.readFileSync(testImagePath)
    expect(Buffer.compare(originalContent, originalAfterContent)).toBe(0)

    // For small files, compressed should be the same size (just a copy)
    const compressedSize = fs.statSync(resultPath).size
    expect(compressedSize).toBe(originalSize)

    console.log(
      `Original file unchanged, compressed copy has size: ${(compressedSize / 1024).toFixed(1)}KB (copied as expected)`
    )
  })

  // Test to verify the service properly handles errors
  it('should handle file errors gracefully', async () => {
    // Create an invalid file path
    const nonexistentPath = path.join(tempDir, 'nonexistent.jpg')

    // The service should catch errors and return the original path
    const result = await service.processImage(nonexistentPath, '.jpg')

    // Even with errors, the service should return the original path as the fallback
    expect(result).toBe(nonexistentPath)
  })

  // Test with a large image that's larger than the target size
  it('should compress a large image file without modifying the original', async () => {
    // Use the large test image
    const largeImagePath = path.join(TEST_IMAGES_DIR, 'test-image-large-pexels-melisa-uygun-2150369123-31102047.jpg')
    expect(fs.existsSync(largeImagePath)).toBeTruthy()

    // Copy to temp directory for testing
    const testImagePath = path.join(tempDir, 'large-test.jpg')
    fs.copyFileSync(largeImagePath, testImagePath)

    // Get the original image dimensions
    const originalImage = await readImage(testImagePath)
    // Need to cast to known type to access bitmap properties
    const typedOriginalImage = originalImage as { bitmap: { width: number; height: number } }
    const originalWidth = typedOriginalImage.bitmap.width
    const originalHeight = typedOriginalImage.bitmap.height
    console.log(`Original large image dimensions: ${originalWidth}x${originalHeight}`)

    // Verify original file size
    const originalStats = fs.statSync(testImagePath)
    const originalSize = originalStats.size
    const originalModifiedTime = originalStats.mtime.getTime()
    const originalContent = fs.readFileSync(testImagePath)

    console.log(`Original large image size: ${(originalSize / 1024).toFixed(1)}KB`)

    // Verify the image is over the TARGET_MAX_SIZE
    expect(originalSize).toBeGreaterThan(service['TARGET_MAX_SIZE'])

    // Process the image
    const resultPath = await service.processImage(testImagePath, '.jpg')

    // Should return a new path, not the original
    expect(resultPath).not.toBe(testImagePath)
    expect(resultPath.includes('_compressed')).toBeTruthy()

    // Verify both files exist
    expect(fs.existsSync(testImagePath)).toBeTruthy()
    expect(fs.existsSync(resultPath)).toBeTruthy()

    // Verify original is untouched
    const originalAfterStats = fs.statSync(testImagePath)
    expect(originalAfterStats.size).toBe(originalSize)
    expect(originalAfterStats.mtime.getTime()).toBe(originalModifiedTime)

    // Verify content is identical
    const originalAfterContent = fs.readFileSync(testImagePath)
    expect(Buffer.compare(originalContent, originalAfterContent)).toBe(0)

    // Check the compressed file size
    const newStats = fs.statSync(resultPath)
    const newSize = newStats.size
    console.log(`Compressed large image size: ${(newSize / 1024).toFixed(1)}KB`)

    // Verify file size has been reduced
    expect(newSize).toBeLessThan(originalSize)

    // Image should be compressed close to target size
    const targetMaxSize = service['TARGET_MAX_SIZE']
    console.log(`Target max size: ${(targetMaxSize / 1024).toFixed(1)}KB`)

    // The compressed image should be reasonably sized
    expect(newSize).toBeLessThanOrEqual(targetMaxSize * 1.5)

    // Check that the dimensions were properly handled
    const processedImage = await readImage(resultPath)
    // Need to cast to known type to access bitmap properties
    const typedProcessedImage = processedImage as { bitmap: { width: number; height: number } }
    const newWidth = typedProcessedImage.bitmap.width
    const newHeight = typedProcessedImage.bitmap.height
    console.log(`Compressed large image dimensions: ${newWidth}x${newHeight}`)

    // Verify aspect ratio is maintained
    const originalRatio = originalWidth / originalHeight
    const newRatio = newWidth / newHeight
    expect(Math.abs(originalRatio - newRatio)).toBeLessThan(0.1)
  })

  // Test with a very large image that's much larger than the target size
  it('should compress a very large image file with significant reduction', async () => {
    // Use the very large test image
    const veryLargeImagePath = path.join(TEST_IMAGES_DIR, 'test-image-very-large-nasa-photo-archive.jpg')
    expect(fs.existsSync(veryLargeImagePath)).toBeTruthy()

    // Copy to temp directory for testing
    const testImagePath = path.join(tempDir, 'very-large-test.jpg')
    fs.copyFileSync(veryLargeImagePath, testImagePath)

    // Get the original image dimensions
    const originalImage = await readImage(testImagePath)
    // Need to cast to known type to access bitmap properties
    const typedOriginalImage = originalImage as { bitmap: { width: number; height: number } }
    const originalWidth = typedOriginalImage.bitmap.width
    const originalHeight = typedOriginalImage.bitmap.height
    console.log(`Original very large image dimensions: ${originalWidth}x${originalHeight}`)

    // Verify original file size
    const originalStats = fs.statSync(testImagePath)
    const originalSize = originalStats.size
    const originalModifiedTime = originalStats.mtime.getTime()

    console.log(
      `Original very large image size: ${(originalSize / 1024).toFixed(1)}KB (${(originalSize / (1024 * 1024)).toFixed(2)}MB)`
    )

    // Verify the image is over the TARGET_MAX_SIZE
    expect(originalSize).toBeGreaterThan(service['TARGET_MAX_SIZE'])

    // Process the image
    const resultPath = await service.processImage(testImagePath, '.jpg')

    // Should return a new path, not the original
    expect(resultPath).not.toBe(testImagePath)
    expect(resultPath.includes('_compressed')).toBeTruthy()

    // Verify both files exist
    expect(fs.existsSync(testImagePath)).toBeTruthy()
    expect(fs.existsSync(resultPath)).toBeTruthy()

    // Verify original is untouched
    const originalAfterStats = fs.statSync(testImagePath)
    expect(originalAfterStats.size).toBe(originalSize)
    expect(originalAfterStats.mtime.getTime()).toBe(originalModifiedTime)

    // Check the compressed file size
    const newStats = fs.statSync(resultPath)
    const newSize = newStats.size
    console.log(
      `Compressed very large image size: ${(newSize / 1024).toFixed(1)}KB (${(newSize / (1024 * 1024)).toFixed(2)}MB)`
    )

    // Verify file size has been reduced
    expect(newSize).toBeLessThan(originalSize)

    // For very large images, compression should be significant
    const compressionRatio = originalSize / newSize
    console.log(`Compression ratio: ${compressionRatio.toFixed(1)}x`)
    expect(compressionRatio).toBeGreaterThan(5) // At least 5x compression

    // Target size
    const targetMaxSize = service['TARGET_MAX_SIZE']
    console.log(`Target max size: ${(targetMaxSize / 1024).toFixed(1)}KB`)

    // For very large NASA image, allow up to 300KB (which is still a massive reduction)
    expect(newSize).toBeLessThanOrEqual(300 * 1024)

    // Check that the dimensions were properly resized
    const processedImage = await readImage(resultPath)
    // Need to cast to known type to access bitmap properties
    const typedProcessedImage = processedImage as { bitmap: { width: number; height: number } }
    const newWidth = typedProcessedImage.bitmap.width
    const newHeight = typedProcessedImage.bitmap.height
    console.log(`Compressed very large image dimensions: ${newWidth}x${newHeight}`)

    // Verify aspect ratio is maintained
    const originalRatio = originalWidth / originalHeight
    const newRatio = newWidth / newHeight
    expect(Math.abs(originalRatio - newRatio)).toBeLessThan(0.1)

    // Check maximum dimension - very large images should be resized
    const maxDimension = Math.max(originalWidth, originalHeight)
    if (maxDimension > service['DIMENSIONS'].LARGE) {
      const newMaxDimension = Math.max(newWidth, newHeight)
      expect(newMaxDimension).toBeLessThanOrEqual(service['DIMENSIONS'].LARGE)
    }
  })
})
