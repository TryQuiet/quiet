import PeerId from 'peer-id'
import { DirResult } from 'tmp'
import { createTmpDir, tmpQuietDirPath } from '../common/testUtils'
let compare, createPaths, removeDirs, removeFiles, getUsersAddresses, getFilesRecursively, getDirsRecursively, createLibp2pAddress, createLibp2pListenAddress, removeFilesFromDir, fetchAbsolute, getPorts, DummyIOServer, torBinForPlatform, torDirForPlatform

(async () => {
  const { 
  createPaths: createPathsImported,
  compare: compareImported,
  removeDirs: removeDirsImported,
  removeFiles: removeFilesImported,
  getUsersAddresses: getUsersAddressesImported,
  getFilesRecursively: getFilesRecursivelyImported,
  getDirsRecursively: getDirsRecursivelyImported,
  createLibp2pAddress: createLibp2pAddressImported,

  createLibp2pListenAddress: createLibp2pListenAddressImported,
  removeFilesFromDir: removeFilesFromDirImproted,
  fetchAbsolute: fetchAbsoluteImported,
  getPorts: getPortsImported,
  DummyIOServer: DummyIOServerImported,
  torBinForPlatform: torBinForPlatformImported,
  torDirForPlatform: torDirForPlatformImported,
  } = await import('../common/utils')

  createPaths = createPathsImported
  compare =  compareImported
  removeDirs = removeDirsImported
  removeFiles = removeFilesImported
  getUsersAddresses = getUsersAddressesImported
  getFilesRecursively = getFilesRecursivelyImported
  getDirsRecursively = getDirsRecursivelyImported
  createLibp2pAddress = createLibp2pAddressImported
  createLibp2pListenAddress =createLibp2pListenAddressImported
  removeFilesFromDir = removeFilesFromDirImproted
  fetchAbsolute = fetchAbsoluteImported
  getPorts =getPortsImported
  DummyIOServer = DummyIOServerImported
  torBinForPlatform = torBinForPlatformImported
  torDirForPlatform = torDirForPlatformImported


})()

import { ConnectionsManager } from './connectionsManager'
import { jest, beforeEach, describe, it, expect, afterEach, beforeAll } from '@jest/globals'

jest.setTimeout(100_000)

let tmpDir: DirResult
let tmpAppDataPath: string
let connectionsManager: ConnectionsManager

beforeEach(() => {
  jest.clearAllMocks()
  tmpDir = createTmpDir()
  tmpAppDataPath = tmpQuietDirPath(tmpDir.name)
  connectionsManager = null
})

describe('Connections manager', () => {
  it('runs tor by default', async () => {
    const ports = await getPorts()
    connectionsManager = new ConnectionsManager({
      torBinaryPath: '../../3rd-party/tor/linux/tor',
      torResourcesPath: '../../3rd-party/tor/linux',
      socketIOPort: ports.socksPort,
      options: {
        env: {
          appDataPath: tmpAppDataPath
        },
      }
    })
    await connectionsManager.init()
    expect(connectionsManager.tor.process).not.toBeNull()
    await connectionsManager.closeAllServices()
  })

  it('creates network', async () => {
    const ports = await getPorts()
    connectionsManager = new ConnectionsManager({
      torBinaryPath: '../../3rd-party/tor/linux/tor',
      torResourcesPath: '../../3rd-party/tor/linux',
      socketIOPort: ports.socksPort,
      options: {
        env: {
          appDataPath: tmpAppDataPath
        },
      }
    })
    await connectionsManager.init()
    const spyOnDestroyHiddenService = jest.spyOn(connectionsManager.tor, 'destroyHiddenService')
    const network = await connectionsManager.getNetwork()
    expect(network.hiddenService.onionAddress.split('.')[0]).toHaveLength(56)
    expect(network.hiddenService.privateKey).toHaveLength(99)
    const peerId = await PeerId.createFromJSON(network.peerId)
    expect(PeerId.isPeerId(peerId)).toBeTruthy()
    expect(await spyOnDestroyHiddenService.mock.results[0].value).toBeTruthy()
    await connectionsManager.closeAllServices()
  })
})
