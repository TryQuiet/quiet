import { createRequire } from 'node:module'
import path from 'path'
import fs from 'fs'

const require = createRequire(import.meta.url)

let bindings = null

let binaryPath = path.normalize(path.join(__dirname, '/deps', 'node_datachannel.node'))
let exists = fs.existsSync(binaryPath)

if (!exists) {
  throw new Error(
    `You must copy node_datachannel.node from the built verson of node-datachannel in node_modules before running webpack!  Rerun bootstrap!`
  )
}

bindings = require(binaryPath)

export default bindings
