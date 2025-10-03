import path from 'path'
import { app } from 'electron'
import { DESKTOP_DATA_DIR, DESKTOP_DEV_DATA_DIR } from '@quiet/common'
// Defer loading to runtime to avoid Jest resolver issues with ESM subpath exports
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let dotenvx: any
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  dotenvx = require('@dotenvx/dotenvx')
} catch (e) {
  // If not available/resolveable in test, leave undefined; guarded use below
}

const isDev = process.env.NODE_ENV === 'development'
let dataDir = DESKTOP_DATA_DIR
if (isDev || process.env.DATA_DIR) {
  dataDir = process.env.DATA_DIR || DESKTOP_DEV_DATA_DIR
}

try {
  if (dotenvx?.config) {
    const loadedEnvVarsresult = dotenvx.config({ path: path.join(__dirname, '.env') })
    console.info('Loaded env vars', JSON.stringify(loadedEnvVarsresult.parsed, null, 2))
    if (loadedEnvVarsresult.error) {
      console.error(`Error occurred while loading main envs`, loadedEnvVarsresult.error)
    }
  }
} catch (e) {
  console.error(`Error occurred while loading main envs`, e)
}

process.env.APP_DATA_PATH = path.join(app.getPath('appData'), dataDir)
process.env.LOG_DIR = path.join(process.env.APP_DATA_PATH, 'logs')
