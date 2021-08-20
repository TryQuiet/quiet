import fs from 'fs'
import path from 'path'
import PeerId from 'peer-id'
import { Config, dataFromRootPems } from '../constants'
import { createLibp2p, createTmpDir, TmpDir, tmpZbayDirPath } from '../testUtils'
import { Storage } from './storage'
import * as utils from '../utils'
import { createUserCsr, createUserCert, configCrypto } from '@zbayapp/identity'
jest.setTimeout(30_000)

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
  try {
    storage && await storage.stopOrbitDb()
  } catch (e) {
    console.error(e)
  }
  tmpDir.removeCallback()
})

describe('Storage', () => {
  it('creates paths by default', async () => {
    expect(fs.existsSync(tmpOrbitDbDir)).toBe(false)
    expect(fs.existsSync(tmpIpfsPath)).toBe(false)
    storage = new Storage(tmpAppDataPath, new utils.DummyIOServer())
    const peerId = await PeerId.create()
    const libp2p = createLibp2p(peerId)
    const createPathsSpy = jest.spyOn(utils, 'createPaths')
    await storage.init(libp2p, peerId)
    expect(createPathsSpy).toHaveBeenCalled()
    expect(fs.existsSync(tmpOrbitDbDir)).toBe(true)
    expect(fs.existsSync(tmpIpfsPath)).toBe(true)
  })

  it('should not create paths if createPaths is set to false', async () => {
    // Note: paths are being created by IPFS and OrbitDb
    expect(fs.existsSync(tmpOrbitDbDir)).toBe(false)
    expect(fs.existsSync(tmpIpfsPath)).toBe(false)
    storage = new Storage(tmpAppDataPath, new utils.DummyIOServer(), { createPaths: false })
    const peerId = await PeerId.create()
    const libp2p = createLibp2p(peerId)
    const createPathsSpy = jest.spyOn(utils, 'createPaths')
    await storage.init(libp2p, peerId)
    expect(createPathsSpy).not.toHaveBeenCalled()
  })
})

describe('Certificate', () => {
  it('is saved to db if passed verification', async () => {
    const user = await createUserCsr({
      zbayNickname: 'userName',
      commonName: 'nqnw4kc4c77fb47lk52m5l57h4tcxceo7ymxekfn7yh5m66t4jv2olad.onion',
      peerId: 'Qmf3ySkYqLET9xtAtDzvAr5Pp3egK1H3C5iJAZm1SpLEp6',
      dmPublicKey: 'testdmPublicKey',
      signAlg: configCrypto.signAlg,
      hashAlg: configCrypto.hashAlg
    })
    const userCert = await createUserCert(dataFromRootPems.certificate, dataFromRootPems.privKey, user.userCsr, new Date(), new Date(2030, 1, 1))
    storage = new Storage(tmpAppDataPath, new utils.DummyIOServer(), { createPaths: false })
    const peerId = await PeerId.create()
    const libp2p = createLibp2p(peerId)
    await storage.init(libp2p, peerId)
    const result = await storage.saveCertificate(userCert.userCertString)
    expect(result).toBe(true)
  })

  it('is not saved to db if did not pass verification', async () => {
    const user = await createUserCsr({
      zbayNickname: 'userName',
      commonName: 'nqnw4kc4c77fb47lk52m5l57h4tcxceo7ymxekfn7yh5m66t4jv2olad.onion',
      peerId: 'Qmf3ySkYqLET9xtAtDzvAr5Pp3egK1H3C5iJAZm1SpLEp6',
      dmPublicKey: 'testdmPublicKey',
      signAlg: configCrypto.signAlg,
      hashAlg: configCrypto.hashAlg
    })
    const userCertOld = await createUserCert(dataFromRootPems.certificate, dataFromRootPems.privKey, user.userCsr, new Date(2021, 1, 1), new Date(2021, 1, 2))
    storage = new Storage(tmpAppDataPath, new utils.DummyIOServer(), { createPaths: false })
    const peerId = await PeerId.create()
    const libp2p = createLibp2p(peerId)
    await storage.init(libp2p, peerId)
    const result = await storage.saveCertificate(userCertOld.userCertString)
    expect(result).toBe(false)
  })

  it('is not saved to db if empty', async () => {
    storage = new Storage(tmpAppDataPath, new utils.DummyIOServer(), { createPaths: false })
    const peerId = await PeerId.create()
    const libp2p = createLibp2p(peerId)
    await storage.init(libp2p, peerId)
    for (const empty of [null, '', undefined]) {
      const result = await storage.saveCertificate(empty)
      expect(result).toBe(false)
    }
  })

  it('username check fails if username is already in use', async () => {
    const user = await createUserCsr({
      zbayNickname: 'userName',
      commonName: 'nqnw4kc4c77fb47lk52m5l57h4tcxceo7ymxekfn7yh5m66t4jv2olad.onion',
      peerId: 'Qmf3ySkYqLET9xtAtDzvAr5Pp3egK1H3C5iJAZm1SpLEp6',
      dmPublicKey: 'testdmPublicKey',
      signAlg: configCrypto.signAlg,
      hashAlg: configCrypto.hashAlg
    })
    const userCert = await createUserCert(dataFromRootPems.certificate, dataFromRootPems.privKey, user.userCsr, new Date(), new Date(2030, 1, 1))
    storage = new Storage(tmpAppDataPath, new utils.DummyIOServer(), { createPaths: false })
    const peerId = await PeerId.create()
    const libp2p = createLibp2p(peerId)
    await storage.init(libp2p, peerId)
    await storage.saveCertificate(userCert.userCertString)
    for (const username of ['userName', 'username', 'userNąme']) {
      const usernameExists = storage.usernameExists(username)
      expect(usernameExists).toBe(true)
    }
  })

  it('username check passes if username is not found in certificates', async () => {
    storage = new Storage(tmpAppDataPath, new utils.DummyIOServer(), { createPaths: false })
    const peerId = await PeerId.create()
    const libp2p = createLibp2p(peerId)
    await storage.init(libp2p, peerId)
    const usernameExists = storage.usernameExists('userName')
    expect(usernameExists).toBe(false)
  })
})
