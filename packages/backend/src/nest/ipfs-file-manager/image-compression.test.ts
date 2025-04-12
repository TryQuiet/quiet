import fs from 'fs'
import path from 'path'
import * as jimpModule from 'jimp'
import { ImageCompressionService } from './image-compression.service'
import { Test } from '@nestjs/testing'

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
    it('should compress large images to target size', async () => {
      // Create test directory if it doesn't exist
      const testDir = path.join(__dirname, 'test-images')
      if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true })
      }

      // Create a large test image (3000x2000 pixels, red)
      const width = 3000
      const height = 2000
      const imagePath = path.join(testDir, 'test-large.jpg')

      // Generate a large image with Jimp
      const Jimp = jimpModule.Jimp
      const image = new Jimp(width, height, 0xff0000ff) // Red
      await image.write(imagePath as any)

      // Verify file was created and is large
      expect(fs.existsSync(imagePath)).toBeTruthy()

      const originalSize = fs.statSync(imagePath).size
      console.log(`Test image created with size: ${originalSize} bytes`)

      // Process the image with our service
      const resultPath = await service.processImage(imagePath, '.jpg')

      // Should return the same path
      expect(resultPath).toBe(imagePath)

      // Verify file exists after processing
      expect(fs.existsSync(resultPath)).toBeTruthy()

      // Check if file was compressed
      const compressedSize = fs.statSync(resultPath).size
      console.log(`Compressed image size: ${compressedSize} bytes`)

      // Should be smaller than original
      expect(compressedSize).toBeLessThan(originalSize)

      // Should be around or below 100KB (allowing some flexibility)
      const maxSize = 120 * 1024 // 120KB with some margin
      expect(compressedSize).toBeLessThanOrEqual(maxSize)
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

      // Generate a small image with Jimp
      const Jimp = jimpModule.Jimp
      const image = new Jimp(width, height, 0x0000ffff) // Blue
      await image.write(imagePath as any)

      // Verify file was created
      expect(fs.existsSync(imagePath)).toBeTruthy()

      const originalSize = fs.statSync(imagePath).size
      console.log(`Test image created with size: ${originalSize} bytes`)

      // Process the image with our service
      const resultPath = await service.processImage(imagePath, '.jpg')

      // Should return the same path
      expect(resultPath).toBe(imagePath)

      // Verify file exists after processing
      expect(fs.existsSync(resultPath)).toBeTruthy()

      // Size should be the same or very similar since it was already small enough
      const finalSize = fs.statSync(resultPath).size
      console.log(`Final image size: ${finalSize} bytes`)

      // Small images should be left untouched
      expect(originalSize <= service['MAX_IMAGE_SIZE']).toBeTruthy()
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
