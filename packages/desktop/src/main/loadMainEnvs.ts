import fs from 'fs'
import path from 'path'
import { app } from 'electron'
import { DESKTOP_DATA_DIR, DESKTOP_DEV_DATA_DIR } from '@quiet/common'
import { __nodeConsoleLogger } from '@quiet/logger'

const isDev = process.env.NODE_ENV === 'development'
if (!isDev) {
  try {
    const pathProd = path.join.apply(null, [process.resourcesPath, 'mainEnvs.json'])
    const envsFile = fs.readFileSync(pathProd, { encoding: 'utf8' })
    const envs = JSON.parse(envsFile)
    process.env.TEST_MODE = envs.TEST_MODE
  } catch (e) {
    __nodeConsoleLogger.error(`Error occurred while loading main envs`, e)
  }
}

let dataDir = DESKTOP_DATA_DIR
if (isDev || process.env.DATA_DIR) {
  dataDir = process.env.DATA_DIR || DESKTOP_DEV_DATA_DIR
}

process.env.APP_DATA_PATH = path.join(app.getPath('appData'), dataDir)
process.env.LOG_DIR = path.join(process.env.APP_DATA_PATH, 'logs')
