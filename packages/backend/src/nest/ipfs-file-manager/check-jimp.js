// This script is a simple standalone test for Jimp functionality
// Run with: node check-jimp.js

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import * as jimpModule from 'jimp'

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function runTest() {
  try {
    console.log('Testing Jimp functionality...')

    // Get Jimp from the module
    const Jimp = jimpModule.Jimp || jimpModule.default

    console.log('Jimp imported successfully')
    console.log('Jimp type:', typeof Jimp)
    console.log('Jimp constructor:', !!Jimp)

    // Log available properties and methods
    console.log('\nJimp properties:')
    for (const prop in Jimp) {
      console.log(`- ${prop}: ${typeof Jimp[prop]}`)
    }

    // Try creating a small test image
    console.log('\nCreating test image...')
    const width = 200
    const height = 100

    try {
      // Try to create a blank image
      console.log('Attempting to create a new image...')
      let image

      try {
        // First try reading a file since direct creation might not work
        image = await Jimp.read(Buffer.alloc(width * height * 4, 255))
        console.log('Created image from buffer')
      } catch (err) {
        console.error('Failed to create from buffer:', err.message)
        // If that fails, try another approach
        try {
          image = await new Jimp(width, height)
          console.log('Created image with new Jimp(width, height)')
        } catch (err) {
          console.error('Failed with new Jimp(width, height):', err.message)
          // Last resort - read from an existing small JPG if one exists
          try {
            image = await Jimp.read('/home/hwilson/quiet/test-cottage.jpg')
            console.log('Loaded existing image as fallback')
          } catch (err) {
            console.error('All image creation attempts failed')
            return
          }
        }
      }

      console.log('Image loaded/created successfully')
      console.log('Image width:', image.bitmap.width)
      console.log('Image height:', image.bitmap.height)

      // Try resizing
      console.log('\nResizing image...')
      // Try different resize approaches
      try {
        image.resize(100, 50) // Standard approach
        console.log('Resize with two parameters succeeded')
      } catch (err) {
        console.error('Resize with two parameters failed:', err.message)
        try {
          image.resize({ width: 100, height: 50 }) // Object with width/height
          console.log('Resize with {width, height} succeeded')
        } catch (err) {
          console.error('Resize with {width, height} failed:', err.message)
          try {
            image.resize({ w: 100, h: 50 }) // Object with w/h
            console.log('Resize with {w, h} succeeded')
          } catch (err) {
            console.error('Resize with {w, h} failed:', err.message)
            try {
              image.resize(100) // Just width
              console.log('Resize with width only succeeded')
            } catch (err) {
              console.error('All resize attempts failed:', err.message)
            }
          }
        }
      }

      // Save the test image
      const outputPath = path.join(__dirname, 'test-output.jpg')
      console.log('\nSaving image to:', outputPath)
      await image.write(outputPath)
      console.log('Image saved successfully')

      // Check the file size
      const stats = fs.statSync(outputPath)
      console.log('File size:', stats.size, 'bytes')
    } catch (createErr) {
      console.error('Error creating/using Jimp image:', createErr)
    }
  } catch (err) {
    console.error('Error in test:', err)
  }
}

runTest()
