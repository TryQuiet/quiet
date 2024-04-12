import path from 'path'
import { DESKTOP_DATA_DIR, DESKTOP_DEV_DATA_DIR } from './static'

export type GetDataAppPathDefaults = {
  appDataPath?: string
  dataDir?: string
}

export const getAppDataPath = (defaults: GetDataAppPathDefaults = {}): string => {
  const defaultAppDataPath = defaults.appDataPath || process.env.APPDATA
  const defaultDataDir = defaults.dataDir || process.env.DATA_DIR

  const dataPath =
    defaultAppDataPath ||
    (process.platform === 'darwin' ? process.env.HOME + '/Library/Application Support' : process.env.HOME + '/.config')
  const appPath = defaultDataDir || (process.env.NODE_ENV === 'development' ? DESKTOP_DEV_DATA_DIR : DESKTOP_DATA_DIR)

  return path.join(dataPath, appPath)
}
