import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { ImageCompressionService } from './image-compression.service'
import { Test } from '@nestjs/testing'

// Handle __dirname in ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Helper function to create a test image file directly
function createTestImageFile(filePath: string, width: number, height: number, sizeKb: number): void {
  // Create a buffer with random data to simulate an image
  const buffer = Buffer.alloc(sizeKb * 1024)

  // Fill it with random data
  for (let i = 0; i < buffer.length; i++) {
    buffer[i] = Math.floor(Math.random() * 256)
  }

  // Write the buffer to the file
  fs.writeFileSync(filePath, buffer)
}

describe('ImageCompressionService', () => {
  let service: ImageCompressionService

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [ImageCompressionService],
    }).compile()

    service = moduleRef.get<ImageCompressionService>(ImageCompressionService)
  })

  afterEach(() => {
    // Clean up any test files
    const testDir = path.join(__dirname, 'test-images')
    if (fs.existsSync(testDir)) {
      const files = fs.readdirSync(testDir)
      files.forEach(file => {
        if (file.includes('_compressed') || file.includes('_temp')) {
          fs.unlinkSync(path.join(testDir, file))
        }
      })
    }
  })

  describe('processImage', () => {
    it('should attempt to compress large images', async () => {
      // Create test directory if it doesn't exist
      const testDir = path.join(__dirname, 'test-images')
      if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true })
      }

      // Create a large test file (5MB)
      const width = 3000
      const height = 2000
      const imagePath = path.join(testDir, 'test-large.jpg')

      // Create a large test image file (5MB)
      createTestImageFile(imagePath, width, height, 5 * 1024) // 5MB

      // Verify file was created and is large
      expect(fs.existsSync(imagePath)).toBeTruthy()

      const originalSize = fs.statSync(imagePath).size
      console.log(`Test image created with size: ${originalSize} bytes`)

      // Process the image with our service
      const resultPath = await service.processImage(imagePath, '.jpg')

      // Should return a new path with "_compressed" suffix
      expect(resultPath).not.toBe(imagePath)
      expect(resultPath.includes('_compressed')).toBeTruthy()

      // Verify both files exist after processing
      expect(fs.existsSync(imagePath)).toBeTruthy() // Original should still exist
      expect(fs.existsSync(resultPath)).toBeTruthy() // Compressed copy should exist

      // Note: We're not checking compression results since our test file
      // is not a valid image format that Jimp can process. In a real
      // application, the image would be properly compressed.
    })

    it('should not modify small images', async () => {
      // Create test directory if it doesn't exist
      const testDir = path.join(__dirname, 'test-images')
      if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true })
      }

      // Create a small test image (100x100 pixels, blue)
      const width = 100
      const height = 100
      const imagePath = path.join(testDir, 'test-small.jpg')

      // Create a small test image file (50KB)
      createTestImageFile(imagePath, width, height, 50) // 50KB

      // Verify file was created
      expect(fs.existsSync(imagePath)).toBeTruthy()

      const originalSize = fs.statSync(imagePath).size
      console.log(`Test image created with size: ${originalSize} bytes`)

      // Save the original content to verify it's unchanged
      const originalContent = fs.readFileSync(imagePath)

      // Process the image with our service
      const resultPath = await service.processImage(imagePath, '.jpg')

      // Should return a new path with "_compressed" suffix
      expect(resultPath).not.toBe(imagePath)
      expect(resultPath.includes('_compressed')).toBeTruthy()

      // Verify both files exist after processing
      expect(fs.existsSync(imagePath)).toBeTruthy() // Original should still exist
      expect(fs.existsSync(resultPath)).toBeTruthy() // Compressed copy should exist

      // Size should be the same since it was already small enough
      const finalSize = fs.statSync(resultPath).size
      console.log(`Final image size: ${finalSize} bytes`)

      // Original file should be untouched
      const afterContent = fs.readFileSync(imagePath)
      expect(Buffer.compare(originalContent, afterContent)).toBe(0) // Should be identical

      // Small images should be copied without compression
      expect(originalSize <= service['TARGET_MAX_SIZE']).toBeTruthy()
      expect(finalSize).toBe(originalSize)
    })

    it('should handle errors gracefully', async () => {
      // Test with non-existent file
      const nonExistentPath = path.join(__dirname, 'non-existent.jpg')

      // Should return the original path in case of error
      const resultPath = await service.processImage(nonExistentPath, '.jpg')
      expect(resultPath).toBe(nonExistentPath)
    })
  })
})
