import fs from 'fs'
import path from 'path'
import PeerId from 'peer-id'
import { Config } from '../constants'
import { createLibp2p, createTmpDir, TmpDir, tmpZbayDirPath } from '../testUtils'
import { Storage } from './storage'
import * as utils from '../utils'

let tmpDir: TmpDir
let tmpAppDataPath: string
let tmpOrbitDbDir: string
let tmpIpfsPath: string
let storage: Storage

beforeEach(() => {
  jest.clearAllMocks()
  tmpDir = createTmpDir()
  tmpAppDataPath = tmpZbayDirPath(tmpDir.name)
  tmpOrbitDbDir = path.join(tmpAppDataPath, Config.ORBIT_DB_DIR)
  tmpIpfsPath = path.join(tmpAppDataPath, Config.IPFS_REPO_PATH)
  storage = null
})

afterEach(async () => {
  tmpDir.removeCallback()
  storage && await storage.stopOrbitDb()
})

test('Create storage paths by default', async () => {
  expect(fs.existsSync(tmpOrbitDbDir)).toBe(false)
  expect(fs.existsSync(tmpIpfsPath)).toBe(false)
  storage = new Storage(tmpAppDataPath, null)
  const peerId = await PeerId.create()
  const libp2p = createLibp2p(peerId)
  const createPathsSpy = jest.spyOn(utils, 'createPaths')
  await storage.init(libp2p, peerId)
  expect(createPathsSpy).toHaveBeenCalled()
  expect(fs.existsSync(tmpOrbitDbDir)).toBe(true)
  expect(fs.existsSync(tmpIpfsPath)).toBe(true)
})

test('Storage paths should not be created if createPaths is set to false', async () => {
  // Note: paths are being created by IPFS and OrbitDb
  expect(fs.existsSync(tmpOrbitDbDir)).toBe(false)
  expect(fs.existsSync(tmpIpfsPath)).toBe(false)
  storage = new Storage(tmpAppDataPath, null, { createPaths: false })
  const peerId = await PeerId.create()
  const libp2p = createLibp2p(peerId)
  const createPathsSpy = jest.spyOn(utils, 'createPaths')
  await storage.init(libp2p, peerId)
  expect(createPathsSpy).not.toHaveBeenCalled()
})
