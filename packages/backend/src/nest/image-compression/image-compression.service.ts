import { Injectable } from '@nestjs/common'
import { createLogger } from '../common/logger'
import fs from 'fs'
import path from 'path'
// Import Jimp utilities to handle type issues
import { readImage } from './jimp-utils'

@Injectable()
export class ImageCompressionService {
  private readonly logger = createLogger(ImageCompressionService.name)

  // Target size range for compressed images:
  // - Typical target: ~200KB for most images
  // - For medium-quality images (~1MB): 200-300KB to maintain good quality
  // - For high-quality images (>3MB): ~150-250KB to balance size and quality
  private readonly TARGET_MAX_SIZE = 200 * 1024 // 200KB in bytes

  // Compression settings based on messaging app best practices
  private readonly JPEG_QUALITY_VERY_HIGH = 92 // Very high quality for images close to target size
  private readonly JPEG_QUALITY_HIGH = 85 // High quality for small images
  private readonly JPEG_QUALITY_MEDIUM = 75 // Medium quality for larger images
  private readonly JPEG_QUALITY_LOW = 60 // Lower quality for very large images
  private readonly JPEG_QUALITY_VERY_LOW = 35 // Very low quality for extremely large images
  private readonly JPEG_QUALITY_ULTRA_LOW = 20 // Ultra low quality for enormous images

  // Standard dimensions for various image sizes - following common messaging app patterns
  private readonly DIMENSIONS = {
    SMALL: 1024, // 1024px max for small images
    MEDIUM: 1600, // 1600px max for medium images
    LARGE: 2048, // 2048px max for very large images (similar to popular messaging apps)
  }

  /**
   * Process an image file, compressing it if needed and removing metadata
   * Creates a new compressed file without modifying the original
   *
   * @param filePath Path to the original image file
   * @param ext Image file extension (.jpg, .png, etc)
   * @returns Path to the compressed image (different from input)
   */
  public async processImage(filePath: string, ext: string): Promise<string> {
    this.logger.info(`Processing image ${filePath}`)

    try {
      // Get original file size
      const originalStats = fs.statSync(filePath)
      const originalSize = originalStats.size

      this.logger.info(`Original image size: ${originalSize} bytes (${(originalSize / 1024).toFixed(1)}KB)`)

      // Create paths for compressed output file
      const parsedPath = path.parse(filePath)
      const compressedFileName = `${parsedPath.name}_compressed${parsedPath.ext}`
      const compressedOutputPath = path.join(parsedPath.dir, compressedFileName)

      // If image is already small enough, just make a copy
      if (originalSize <= this.TARGET_MAX_SIZE) {
        this.logger.info(`Image is already under ${this.TARGET_MAX_SIZE} bytes, making a copy`)
        fs.copyFileSync(filePath, compressedOutputPath)
        return compressedOutputPath
      }

      // Create temporary output path for processing
      const tempOutputPath = path.join(parsedPath.dir, `${parsedPath.name}_temp${parsedPath.ext}`)

      try {
        // Read the image
        const image = await readImage(filePath)
        // TypeScript needs help with the type
        type ImageType = {
          bitmap: { width: number; height: number }
          resize: (options: { w: number; h: number }) => any
          getBuffer: (mime: string, options: { quality: number }) => Promise<Buffer>
        }
        // Cast image to proper type
        const typedImage = image as ImageType
        this.logger.info(`Image loaded, dimensions: ${typedImage.bitmap.width}x${typedImage.bitmap.height}`)

        const originalWidth = typedImage.bitmap.width
        const originalHeight = typedImage.bitmap.height

        // Get the MIME type based on extension - maintain original format
        const mime = ext.toLowerCase() === '.png' ? 'image/png' : 'image/jpeg'

        // Determine initial compression settings
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

        // Resize if needed
        if (newWidth !== originalWidth || newHeight !== originalHeight) {
          this.logger.info(`Resizing image from ${originalWidth}x${originalHeight} to ${newWidth}x${newHeight}`)
          typedImage.resize({ w: newWidth, h: newHeight })
        } else {
          this.logger.info(`No resize needed, using original dimensions ${originalWidth}x${originalHeight}`)
        }

        let bestBuffer: Buffer | null = null
        let bestSize = 0
        let bestQuality = 0

        // Start at the predicted quality. If the first encode misses the target, retry once at a
        // quality adjusted in the direction of the target: lower if the result is too big, higher
        // if it's over-compressed (too small). The retry quality depends on the first result's
        // size, so it can't be precomputed.
        const qualitiesToTry = [quality]

        for (let i = 0; i < qualitiesToTry.length; i++) {
          const testQuality = qualitiesToTry[i]
          this.logger.info(`Testing quality setting: ${testQuality} for ${mime}`)

          // Get buffer with this quality setting
          const testBuffer = await typedImage.getBuffer(mime, {
            quality: testQuality,
          })

          const testSize = testBuffer.length
          this.logger.info(
            `Quality ${testQuality} resulted in size: ${testSize} bytes (${(testSize / 1024).toFixed(1)}KB)`
          )

          if (
            bestBuffer === null ||
            this.isBetterCompressionCandidate({
              originalSize,
              currentSize: bestSize,
              currentQuality: bestQuality,
              testSize,
              testQuality,
            })
          ) {
            bestBuffer = testBuffer
            bestSize = testSize
            bestQuality = testQuality
          }

          if (this.isAcceptableCompressedSize(originalSize, testSize)) {
            this.logger.info(`Quality ${testQuality} is within target range, stopping early`)
            break
          }

          // Queue a single direction-aware retry, only after the first encode.
          if (i === 0) {
            const retryQuality = this.getRetryQuality(testQuality, originalSize, testSize)
            if (retryQuality != null && !qualitiesToTry.includes(retryQuality)) {
              qualitiesToTry.push(retryQuality)
            }
          }
        }

        this.logger.info(`Selected best quality: ${bestQuality} with size: ${(bestSize / 1024).toFixed(1)}KB`)

        // Write the buffer to the temp file
        if (bestBuffer) {
          fs.writeFileSync(tempOutputPath, bestBuffer)
        } else {
          // Should never happen, but just in case
          throw new Error('Failed to generate valid compressed image')
        }

        // Check resulting size
        const stats = fs.statSync(tempOutputPath)
        const currentSize = stats.size

        this.logger.info(`Final compressed image size: ${currentSize} bytes (${(currentSize / 1024).toFixed(1)}KB)`)
        this.logger.info(`Compression ratio: ${(originalSize / currentSize).toFixed(2)}x`)

        // Move the temp file to the compressed output path (not modifying original)
        try {
          fs.renameSync(tempOutputPath, compressedOutputPath)
          this.logger.info(`Successfully compressed image to ${compressedOutputPath}`)
        } catch (err) {
          this.logger.error(`Error moving temp file to final location: ${err.message}`, err)
          try {
            // Try a copy if rename fails
            fs.copyFileSync(tempOutputPath, compressedOutputPath)
            fs.unlinkSync(tempOutputPath)
            this.logger.info(`Successfully copied compressed image to ${compressedOutputPath}`)
          } catch (copyErr) {
            this.logger.error(`Error creating compressed file: ${copyErr.message}`, copyErr)
            return tempOutputPath // Return temp path as fallback
          }
        }

        // Return path to the compressed file (not the original)
        return compressedOutputPath
      } catch (error) {
        this.logger.error(`Error compressing image: ${error.message}`, error)
        // In case of error, make a simple copy so we still have a separate file
        try {
          fs.copyFileSync(filePath, compressedOutputPath)
          this.logger.info(`Compression failed, creating an uncompressed copy instead`)
          return compressedOutputPath
        } catch (copyErr) {
          this.logger.error(`Error creating copy: ${copyErr.message}`, copyErr)
          return filePath // Last resort, return original path
        }
      }
    } catch (error) {
      this.logger.error(`Error processing image: ${error.message}`, error)
      // Try to make a copy even if processing failed
      try {
        const parsedPath = path.parse(filePath)
        const compressedFileName = `${parsedPath.name}_compressed${parsedPath.ext}`
        const compressedOutputPath = path.join(parsedPath.dir, compressedFileName)
        fs.copyFileSync(filePath, compressedOutputPath)
        return compressedOutputPath
      } catch (copyErr) {
        // If all else fails, return original path
        return filePath
      }
    }
  }

  private getRetryQuality(currentQuality: number, originalSize: number, currentSize: number): number | null {
    // Result is too large: drop quality to shrink the file (matches the previous fallback steps).
    if (currentSize > this.TARGET_MAX_SIZE) {
      const lowered =
        originalSize > 4 * 1024 * 1024 ? Math.max(currentQuality - 20, 10) : Math.max(currentQuality - 25, 15)
      return lowered < currentQuality ? lowered : null
    }

    // Result is over-compressed (too small): raise quality to recover detail and climb back toward
    // the target range. This only happens for large images, where the acceptable band has a floor.
    const raised = Math.min(currentQuality + 20, this.JPEG_QUALITY_VERY_HIGH)
    return raised > currentQuality ? raised : null
  }

  private isAcceptableCompressedSize(originalSize: number, compressedSize: number): boolean {
    if (originalSize > 4 * 1024 * 1024) {
      return compressedSize >= 100 * 1024 && compressedSize <= this.TARGET_MAX_SIZE
    }

    return compressedSize <= this.TARGET_MAX_SIZE * 1.5
  }

  private isBetterCompressionCandidate({
    originalSize,
    currentSize,
    currentQuality,
    testSize,
    testQuality,
  }: {
    originalSize: number
    currentSize: number
    currentQuality: number
    testSize: number
    testQuality: number
  }): boolean {
    if (originalSize > 4 * 1024 * 1024) {
      const minTargetSize = 100 * 1024
      const maxTargetSize = this.TARGET_MAX_SIZE
      const currentInRange = currentSize >= minTargetSize && currentSize <= maxTargetSize
      const testInRange = testSize >= minTargetSize && testSize <= maxTargetSize

      if (testInRange && !currentInRange) return true
      if (testInRange && currentInRange) return testQuality > currentQuality
      if (testSize > maxTargetSize && currentSize > maxTargetSize) return testSize < currentSize
      if (testSize < minTargetSize && currentSize < minTargetSize) return testSize > currentSize

      const targetMidpoint = (minTargetSize + maxTargetSize) / 2
      return Math.abs(testSize - targetMidpoint) < Math.abs(currentSize - targetMidpoint)
    }

    if (currentSize > this.TARGET_MAX_SIZE * 1.5) return testSize < currentSize

    return (
      testSize <= this.TARGET_MAX_SIZE * 1.5 &&
      Math.abs(testSize - this.TARGET_MAX_SIZE) < Math.abs(currentSize - this.TARGET_MAX_SIZE)
    )
  }

  /**
   * Determine appropriate compression settings based on image characteristics
   * This follows a similar approach to messaging apps (like WhatsApp, Telegram, etc)
   * by using different quality and size settings based on the original dimensions.
   *
   * Optimized to target the specified TARGET_MAX_SIZE more precisely.
   */
  private determineCompressionSettings(
    width: number,
    height: number,
    size: number
  ): { maxDimension: number; quality: number } {
    // Get the larger dimension
    const largerDimension = Math.max(width, height)

    // Calculate compression ratio needed to reach the target size
    const sizeRatio = size / this.TARGET_MAX_SIZE

    // For very large images, we need to be more aggressive with dimensions
    // The more we reduce dimensions, the better quality we can maintain
    let maxDimension: number

    // Calculate an appropriate dimension for the image based on its size
    if (sizeRatio > 20) {
      // Only for truly gigantic images (over 4MB)
      // restrict to smaller dimensions but still keep reasonable quality
      maxDimension = Math.min(this.DIMENSIONS.SMALL, 1024)
    } else if (sizeRatio > 10) {
      // Large images (2-4MB) - use standard dimensions
      maxDimension = Math.min(this.DIMENSIONS.MEDIUM * 0.9, 1440) // Around 1440px
    } else if (sizeRatio > 5) {
      // Medium-large images
      maxDimension = this.DIMENSIONS.MEDIUM // 1600px
    } else if (sizeRatio > 2) {
      // For images that are 2-5x the target size
      maxDimension = this.DIMENSIONS.MEDIUM // 1600px
    } else {
      maxDimension = this.DIMENSIONS.LARGE // 2048px
    }

    // Adjust for very high resolution images
    if (largerDimension > 4000 && sizeRatio > 15) {
      // For giant high-res images, be somewhat more aggressive with dimensions
      // but still maintain reasonable detail
      maxDimension = Math.min(maxDimension, 1200)
    }

    // Determine the appropriate quality based on image size and ratio to target
    let quality: number

    if (size < this.TARGET_MAX_SIZE * 1.5) {
      // Images already close to target size - use high quality
      quality = this.JPEG_QUALITY_VERY_HIGH
    } else if (size < 1 * 1024 * 1024) {
      // Less than 1MB
      if (sizeRatio > 3) {
        // Images 3-5x target size but under 1MB need lower quality
        quality = this.JPEG_QUALITY_MEDIUM - 10 // Around 65%
      } else {
        quality = this.JPEG_QUALITY_HIGH
      }
    } else if (size < 2 * 1024 * 1024) {
      // 1-2MB
      quality = this.JPEG_QUALITY_MEDIUM - 15 // More aggressive - around 60%
    } else if (size < 4 * 1024 * 1024) {
      // 2-4MB
      quality = this.JPEG_QUALITY_MEDIUM // Using medium quality instead of low
    } else if (size < 10 * 1024 * 1024) {
      // 4-10MB - adjusted to target 100-200KB range
      quality = this.JPEG_QUALITY_LOW - 10 // Lower quality to hit target range
    } else {
      // Extremely large images (over 10MB)
      quality = this.JPEG_QUALITY_ULTRA_LOW
    }

    this.logger.info(`Setting initial compression parameters: dimension=${maxDimension}px, quality=${quality}`)

    return { maxDimension, quality }
  }
}
