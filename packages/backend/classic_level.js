
import { createRequire } from 'node:module';
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url';
const require = createRequire(import.meta.url);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let bindings = null

const binaryPath = path.normalize(path.join(__dirname, 'deps', process.platform, process.arch, 'classic-level', 'classic_level.node'))

if (!fs.existsSync(binaryPath)) throw new Error(`Unfortunately we do not support this platform! There is no classic_level bindings binary for ${process.platform}-${process.arch}`)

bindings = require(binaryPath);

export default bindings