import path from 'path'

import { getAppDataPath } from './dir'

describe('getAppDataPath', () => {
  const originalNodeEnv = process.env.NODE_ENV
  const originalDataDir = process.env.DATA_DIR

  afterEach(() => {
    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV
    } else {
      process.env.NODE_ENV = originalNodeEnv
    }

    if (originalDataDir === undefined) {
      delete process.env.DATA_DIR
    } else {
      process.env.DATA_DIR = originalDataDir
    }
  })

  it('uses the version 9 production data directory by default', () => {
    process.env.NODE_ENV = 'production'
    delete process.env.DATA_DIR

    expect(getAppDataPath({ appDataPath: '/app-data' })).toBe(path.join('/app-data', 'Quiet9'))
  })
})
