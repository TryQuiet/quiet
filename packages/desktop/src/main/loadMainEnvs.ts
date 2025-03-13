import fs from 'fs'
import path from 'path'
import { app } from 'electron'
import { createLogger } from './logger'
import { DESKTOP_DATA_DIR, DESKTOP_DEV_DATA_DIR } from '@quiet/common'

const isDev = process.env.NODE_ENV === 'development'
let dataDir = DESKTOP_DATA_DIR
if (isDev || process.env.DATA_DIR) {
  dataDir = process.env.DATA_DIR || DESKTOP_DEV_DATA_DIR
}

process.env.APP_DATA_PATH = path.join(app.getPath('appData'), dataDir)
process.env.LOG_DIR = path.join(process.env.APP_DATA_PATH, 'logs')

const logger = createLogger('loadMainEnvs')

if (!isDev) {
  try {
    const pathProd = path.join.apply(null, [process.resourcesPath, 'mainEnvs.json'])
    const envsFile = fs.readFileSync(pathProd, { encoding: 'utf8' })
    const envs = JSON.parse(envsFile)
    logger.info('Read extra envs:', envs)
    process.env.TEST_MODE = envs.TEST_MODE
  } catch (e) {
    logger.error(`Error occurred while loading main envs`, e)
  }
}
