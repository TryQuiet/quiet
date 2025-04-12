import { Injectable } from '@nestjs/common'
import { createLogger } from '../common/logger'
import fs from 'fs'
import path from 'path'
// Import Jimp correctly with the module pattern
import * as jimpModule from 'jimp'

@Injectable()
export class ImageCompressionService {
  private readonly logger = createLogger(ImageCompressionService.name)

  // Target maximum size for compressed images (approximately 100-200KB)
  private readonly TARGET_MAX_SIZE = 200 * 1024 // 200KB in bytes

  // Compression settings based on messaging app best practices
  private readonly JPEG_QUALITY_HIGH = 85 // High quality for small images
  private readonly JPEG_QUALITY_MEDIUM = 75 // Medium quality for larger images
  private readonly JPEG_QUALITY_LOW = 60 // Lower quality for very large images

  // Standard dimensions for various image sizes - following common messaging app patterns
  private readonly DIMENSIONS = {
    SMALL: 1024, // 1024px max for small images
    MEDIUM: 1600, // 1600px max for medium images
    LARGE: 2048, // 2048px max for very large images (similar to popular messaging apps)
  }

  /**
   * Process an image file, compressing it if needed and removing metadata
   *
   * @param filePath Path to the image file
   * @param ext Image file extension (.jpg, .png, etc)
   * @returns Path to the processed image (may be different from input)
   */
  public async processImage(filePath: string, ext: string): Promise<string> {
    this.logger.info(`Processing image ${filePath}`)

    try {
      // Get original file size
      const originalStats = fs.statSync(filePath)
      const originalSize = originalStats.size

      this.logger.info(`Original image size: ${originalSize} bytes (${(originalSize / 1024).toFixed(1)}KB)`)

      // If image is already small enough, return it as is
      if (originalSize <= this.TARGET_MAX_SIZE) {
        this.logger.info(`Image is already under ${this.TARGET_MAX_SIZE} bytes, using original`)
        return filePath
      }

      // Create temporary output path for processing
      const parsedPath = path.parse(filePath)
      const tempOutputPath = path.join(parsedPath.dir, `${parsedPath.name}_temp${parsedPath.ext}`)

      try {
        // Read the image
        const image = await jimpModule.Jimp.read(filePath)
        this.logger.info(`Image loaded, dimensions: ${image.bitmap.width}x${image.bitmap.height}`)

        const originalWidth = image.bitmap.width
        const originalHeight = image.bitmap.height

        // Determine appropriate compression settings based on image dimensions
        const { maxDimension, quality } = this.determineCompressionSettings(originalWidth, originalHeight, originalSize)

        // Calculate new dimensions while maintaining aspect ratio
        let newWidth, newHeight

        if (originalWidth > originalHeight) {
          // Landscape orientation
          if (originalWidth > maxDimension) {
            newWidth = maxDimension
            newHeight = Math.floor(originalHeight * (maxDimension / originalWidth))
          } else {
            newWidth = originalWidth
            newHeight = originalHeight
          }
        } else {
          // Portrait or square orientation
          if (originalHeight > maxDimension) {
            newHeight = maxDimension
            newWidth = Math.floor(originalWidth * (maxDimension / originalHeight))
          } else {
            newWidth = originalWidth
            newHeight = originalHeight
          }
        }

        // Resize if needed using v1 syntax with object params
        if (newWidth !== originalWidth || newHeight !== originalHeight) {
          this.logger.info(`Resizing image from ${originalWidth}x${originalHeight} to ${newWidth}x${newHeight}`)
          // Cast to any to work around TypeScript issues with Jimp types
          ;(image as any).resize({ w: newWidth, h: newHeight })
        }

        // Get the MIME type based on extension - maintain original format
        const mime = ext.toLowerCase() === '.png' ? 'image/png' : 'image/jpeg'

        // Get buffer with quality option using v1 syntax
        // Use any type to work around TypeScript issues with Jimp types
        this.logger.info(`Applying quality setting: ${quality} for ${mime}`)
        const buffer = await (image as any).getBuffer(mime, {
          quality: quality,
        })

        // Write the buffer to the temp file
        fs.writeFileSync(tempOutputPath, buffer)

        // Check resulting size
        const stats = fs.statSync(tempOutputPath)
        const currentSize = stats.size

        this.logger.info(`Compressed image size: ${currentSize} bytes (${(currentSize / 1024).toFixed(1)}KB)`)
        this.logger.info(`Compression ratio: ${(originalSize / currentSize).toFixed(2)}x`)

        // Replace the original file with the compressed version
        try {
          fs.unlinkSync(filePath)
          fs.renameSync(tempOutputPath, filePath)
          this.logger.info(`Successfully compressed image and replaced original`)
        } catch (err) {
          this.logger.error(`Error replacing original file: ${err.message}`, err)
          try {
            fs.copyFileSync(tempOutputPath, filePath)
            fs.unlinkSync(tempOutputPath)
          } catch (copyErr) {
            this.logger.error(`Error copying compressed file: ${copyErr.message}`, copyErr)
            return tempOutputPath
          }
        }

        return filePath
      } catch (error) {
        this.logger.error(`Error compressing image: ${error.message}`, error)
        return filePath
      }
    } catch (error) {
      this.logger.error(`Error processing image: ${error.message}`, error)
      return filePath
    }
  }

  /**
   * Determine appropriate compression settings based on image characteristics
   * This follows a similar approach to messaging apps (like WhatsApp, Telegram, etc)
   * by using different quality and size settings based on the original dimensions.
   */
  private determineCompressionSettings(
    width: number,
    height: number,
    size: number
  ): { maxDimension: number; quality: number } {
    // Get the larger dimension
    const largerDimension = Math.max(width, height)

    // Determine the appropriate size category and quality based on image dimensions
    if (largerDimension <= this.DIMENSIONS.SMALL || size < 500 * 1024) {
      // Small image (under 1024px) or under 500KB - maintain higher quality but ensure max dimension
      return {
        maxDimension: this.DIMENSIONS.SMALL,
        quality: this.JPEG_QUALITY_HIGH,
      }
    } else if (largerDimension <= this.DIMENSIONS.MEDIUM || size < 2 * 1024 * 1024) {
      // Medium image (1024-1600px) or 0.5-2MB - medium quality
      return {
        maxDimension: this.DIMENSIONS.MEDIUM,
        quality: this.JPEG_QUALITY_MEDIUM,
      }
    } else {
      // Large image (over 1600px) or over 2MB - lower quality to ensure reasonable file size
      return {
        maxDimension: this.DIMENSIONS.LARGE,
        quality: this.JPEG_QUALITY_LOW,
      }
    }
  }
}
