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

/**
 * Reads an image from the given source
 * This is a wrapper around Jimp.read that handles the type issues
 */
export async function readImage(source: string): Promise<JimpImage> {
  return await Jimp.read(source)
}
