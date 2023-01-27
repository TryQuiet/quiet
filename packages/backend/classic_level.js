
import { createRequire } from 'node:module';
import path from 'path'
import fs from 'fs'
const require = createRequire(import.meta.url);

let bindings = null

console.log('process.platform', process.platform)
console.log('process.arch', process.arch)

const binaryPath = path.normalize(path.join('..', '/deps', process.platform, process.arch, 'classic-level', 'classic_level.node'))

if (!fs.existsSync(binaryPath)) throw new Error(`Unfortunately we do not support this platform! There is no classic_level bindings binary for ${process.platform}-${process.arch}`)

bindings = require(binaryPath);

console.log(bindings)

export default bindings