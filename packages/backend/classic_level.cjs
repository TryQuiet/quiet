import { createRequire } from 'node:module'
import path from 'path'
import fs from 'fs'

const require = createRequire(import.meta.url)

let bindings = null

let binaryPath = path.normalize(path.join(__dirname, '/deps', process.platform, process.arch, 'classic-level', 'classic_level.node'))
let exists = fs.existsSync(binaryPath)

if (!exists && process.platform === 'android') {
  // Get rid of extra nesting levels
  binaryPath = path.normalize(path.join(__dirname, process.arch, 'classic-level', 'classic_level.node'))
  // Reassign boolean value for further comparision
  exists = fs.existsSync(binaryPath)
}

if (!exists) {
  throw new Error(`Unfortunately we do not support this platform! There is no classic_level bindings binary for ${process.platform}-${process.arch}`)
}

bindings = require(binaryPath)

export default bindings
