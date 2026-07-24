import { Alert } from 'react-native'
import DeviceInfo from 'react-native-device-info'
import RNFS from 'react-native-fs'
import Share from 'react-native-share'
import { zip } from 'react-native-zip-archive'

import { shareAllData } from './shareAllData'

jest.mock('react-native-device-info', () => ({
  __esModule: true,
  default: {
    getVersion: jest.fn(() => '9.0.0-alpha.1'),
    getBuildNumber: jest.fn(() => '637'),
    getBrand: jest.fn(() => 'Quiet'),
    getModel: jest.fn(() => 'Test Device'),
  },
}))

jest.mock('react-native-fs', () => ({
  __esModule: true,
  default: {
    CachesDirectoryPath: '/cache',
    DocumentDirectoryPath: '/documents',
    copyFile: jest.fn(),
    exists: jest.fn(),
    mkdir: jest.fn(),
    readDir: jest.fn(),
    unlink: jest.fn(),
    writeFile: jest.fn(),
  },
}))

jest.mock('react-native-share', () => ({
  __esModule: true,
  default: {
    open: jest.fn(),
  },
}))

jest.mock('react-native-zip-archive', () => ({
  zip: jest.fn(),
}))

describe('shareAllData', () => {
  const dataDir = '/documents/backend/files9'

  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(Alert, 'alert').mockImplementation(() => undefined)
    ;(RNFS.exists as jest.Mock).mockImplementation(async path => path === dataDir)
    ;(RNFS.readDir as jest.Mock).mockResolvedValue([])
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('archives data from the version 9 mobile directory', async () => {
    await shareAllData()

    expect(RNFS.exists).toHaveBeenCalledWith(dataDir)
    expect(RNFS.readDir).toHaveBeenCalledWith(dataDir)
    expect(zip).toHaveBeenCalledWith(
      expect.stringMatching(/^\/cache\/quiet-data-share\/staging-/),
      expect.stringMatching(/^\/cache\/quiet-data-share\/quiet-data-/)
    )
    expect(Share.open).toHaveBeenCalledWith(expect.objectContaining({ type: 'application/zip' }))
    expect(DeviceInfo.getVersion).toHaveBeenCalled()
  })
})
