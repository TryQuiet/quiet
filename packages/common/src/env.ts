import path from 'path'
import { DESKTOP_DATA_DIR, DESKTOP_DEV_DATA_DIR } from './static'

export enum ExecEnv {
  DESKTOP = 'DESKTOP',
  ANDROID = 'ANDROID',
  MOBILE = 'MOBILE',
}

export function getAppDataPath(): string {
  return path.join(getBaseDataPath(), getDataDir())
}

export function getBaseDataPath(): string {
  return (
    process.env.APPDATA ||
    (process.platform === 'darwin' ? process.env.HOME + '/Library/Application Support' : process.env.HOME + '/.config')
  )
}

export function getDataDir(): string {
  switch (process.env.EXEC_ENV as ExecEnv) {
    case ExecEnv.DESKTOP:
      return getDesktopDataDir()
    default:
      throw new Error(`Unknown EXEC_ENV value: ${process.env.EXEC_ENV}`)
  }
}

function getDesktopDataDir(): string {
  let dataDir = DESKTOP_DATA_DIR
  if (process.env.NODE_ENV === 'development' || process.env.DATA_DIR) {
    dataDir = process.env.DATA_DIR || DESKTOP_DEV_DATA_DIR
  }
  return dataDir
}
