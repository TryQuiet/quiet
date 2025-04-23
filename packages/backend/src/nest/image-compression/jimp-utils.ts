/**
 * This file provides a consistent way to work with Jimp across the codebase
 * It handles the type issues and ensures a consistent experience.
 */
// Cast the entire import to any to avoid TypeScript errors with Jimp's types
import * as jimpModule from 'jimp'
// Access Jimp constructor without TypeScript interference
const Jimp = (jimpModule as any).Jimp

// Define proper type for Jimp instances
export type JimpImage = ReturnType<typeof Jimp.read> extends Promise<infer R> ? R : never

// Utility type for options
export type JimpQualityOptions = {
  quality?: number
}

/**
 * Reads an image from the given source
 * This is a wrapper around Jimp.read that handles the type issues
 */
export async function readImage(source: string): Promise<JimpImage> {
  return await Jimp.read(source)
}

/**
 * Creates a blank image with the given width, height and background color
 * This is a wrapper around new Jimp() that handles the type issues
 */
export async function createImage(width: number, height: number, color?: number): Promise<JimpImage> {
  // Use a different approach to create images
  const colorValue = color || 0xffffffff
  const buf = Buffer.alloc(width * height * 4, 0)

  // Fill the buffer with the color
  for (let i = 0; i < width * height; i++) {
    const offset = i * 4
    buf[offset] = (colorValue >> 24) & 255 // R
    buf[offset + 1] = (colorValue >> 16) & 255 // G
    buf[offset + 2] = (colorValue >> 8) & 255 // B
    buf[offset + 3] = colorValue & 255 // A
  }

  // Create Jimp from the RGBA buffer
  return await Jimp.read({
    data: buf,
    width: width,
    height: height,
  })
}

// Export the original module for compatibility
export default Jimp
