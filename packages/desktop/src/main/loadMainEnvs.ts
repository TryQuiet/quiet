import fs from 'fs'
import path from 'path'
import { createLogger } from './logger'

const logger = createLogger('loadMainEnvs')

if (process.env.NODE_ENV !== 'development') {
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
