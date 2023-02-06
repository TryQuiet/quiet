import { DataServer } from './DataServer'
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
import { expect, test } from '@jest/globals'

test.skip('start and stop data server', async () => {
  const ports = await getPorts()
  const dataServer = new DataServer(ports.dataServer)
  // TODO:JEST
  // expect(dataServer.io.engine.opts.cors).toBe(false) // No cors should be set by default
  await dataServer.listen()
  await dataServer.close()
})
