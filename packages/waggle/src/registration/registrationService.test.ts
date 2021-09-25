import { createRootCA, createUserCert, createUserCsr, verifyUserCert, configCrypto } from '@zbayapp/identity'
import { SocksProxyAgent } from 'socks-proxy-agent'
import { CertificateRegistration } from '.'
import { Time } from 'pkijs'
import { createLibp2p, createTmpDir, spawnTorProcess, TmpDir, tmpZbayDirPath, TorMock, dataFromRootPems } from '../testUtils'
import { DummyIOServer, getPorts, Ports } from '../utils'
import fetch, { Response } from 'node-fetch'
import { Tor } from '../torManager'
import { RootCA } from '@zbayapp/identity/lib/generateRootCA'
import { Storage } from '../storage'
import PeerId from 'peer-id'
import { DataFromPems } from '../common/types'
// import {registerOwnerCertificate} from './index'
jest.setTimeout(50_000)

async function registerUserTest(csr: string, socksPort: number, localhost: boolean = true): Promise<Response> {
  // Connect to registration service locally or using tor
  let address = '127.0.0.1'
  let options = {
    method: 'POST',
    body: JSON.stringify({ data: csr }),
    headers: { 'Content-Type': 'application/json' }
  }
  if (!localhost) {
    options = Object.assign(options, { agent: new SocksProxyAgent({ port: socksPort, host: 'localhost', timeout: 100000 }) })
    address = '4avghtoehep5ebjngfqk5b43jolkiyyedfcvvq4ouzdnughodzoglzad.onion'
  }
  return await fetch(`http://${address}:7789/register`, options)
}

async function setupRegistrar(tor: Tor, storage: Storage, dataFromPems: DataFromPems, hiddenServiceKey?: string, port?: number) {
  const certRegister = new CertificateRegistration(
    tor,
    storage,
    dataFromPems,
    hiddenServiceKey,
    port
  )
  try {
    await certRegister.init()
  } catch (err) {
    console.error(`Couldn't initialize certificate registration service: ${err as string}`)
    return
  }
  try {
    await certRegister.listen()
  } catch (err) {
    console.error(`Certificate registration service couldn't start listening: ${err as string}`)
  }
  return certRegister
}

const getStorage = async (zbayDir: string) => {
  const peerId = await PeerId.create()
  const storage = new Storage(
    zbayDir,
    new DummyIOServer(),
    {
      ...{},
      orbitDbDir: `OrbitDB${peerId.toB58String()}`,
      ipfsDir: `Ipfs${peerId.toB58String()}`
    }
  )
  await storage.init(await createLibp2p(peerId), peerId)
  return storage
}

describe('Registration service', () => {
  let tmpDir: TmpDir
  let tmpAppDataPath: string
  let tor: Tor
  let registrationService: CertificateRegistration
  let storage: Storage
  let certRoot: RootCA
  let testHiddenService: string
  let ports: Ports

  beforeAll(() => {
    testHiddenService = 'ED25519-V3:iEp140DpauUp45TBx/IdjDm3/kinRPjwmsrXaGC9j39zhFsjI3MHdaiuIHJf3GiivF+hAi/5SUzYq4SzvbKzWQ=='
  })

  beforeEach(async () => {
    jest.clearAllMocks()
    tmpDir = createTmpDir()
    tmpAppDataPath = tmpZbayDirPath(tmpDir.name)
    tor = null
    registrationService = null
    certRoot = await createRootCA(new Time({ type: 1, value: new Date() }), new Time({ type: 1, value: new Date(2030, 1, 1) }), 'testRootCA')
    ports = await getPorts()
  })

  afterEach(async () => {
    tor && await tor.kill()
    storage && await storage.stopOrbitDb()
    registrationService && await registrationService.stop()
    tmpDir.removeCallback()
  })

  // This is skipped because test with registration service using Tor fails frequently on CI (Proxy connection timed out)
  it.skip('generates and saves certificate for a new user using tor', async () => {
    const user = await createUserCsr({
      zbayNickname: 'userName',
      commonName: 'nqnw4kc4c77fb47lk52m5l57h4tcxceo7ymxekfn7yh5m66t4jv2olad.onion',
      peerId: 'Qmf3ySkYqLET9xtAtDzvAr5Pp3egK1H3C5iJAZm1SpLEp6',
      dmPublicKey: 'testdmPublicKey',
      signAlg: configCrypto.signAlg,
      hashAlg: configCrypto.hashAlg
    })
    storage = await getStorage(tmpAppDataPath)
    const saveCertificate = jest.spyOn(storage, 'saveCertificate')
    tor = await spawnTorProcess(tmpAppDataPath, ports)
    await tor.init()
    registrationService = await setupRegistrar(
      tor,
      storage,
      { certificate: certRoot.rootCertString, privKey: certRoot.rootKeyString },
      testHiddenService
    )
    const response = await registerUserTest(user.userCsr, ports.socksPort, false)
    const returnedUserCertificate = await response.json()
    expect(saveCertificate).toBeCalledTimes(1)
    const isProperUserCert = await verifyUserCert(certRoot.rootCertString, returnedUserCertificate)
    expect(isProperUserCert.result).toBe(true)
  })

  it('generates and saves certificate for a new user', async () => {
    const user = await createUserCsr({
      zbayNickname: 'userName',
      commonName: 'nqnw4kc4c77fb47lk52m5l57h4tcxceo7ymxekfn7yh5m66t4jv2olad.onion',
      peerId: 'Qmf3ySkYqLET9xtAtDzvAr5Pp3egK1H3C5iJAZm1SpLEp6',
      dmPublicKey: 'testdmPublicKey',
      signAlg: configCrypto.signAlg,
      hashAlg: configCrypto.hashAlg
    })
    storage = await getStorage(tmpAppDataPath)
    registrationService = await setupRegistrar(
      // @ts-expect-error
      new TorMock(),
      storage,
      { certificate: certRoot.rootCertString, privKey: certRoot.rootKeyString }
    )
    const saveCertificate = jest.spyOn(storage, 'saveCertificate')
    const response = await registerUserTest(user.userCsr, ports.socksPort)
    const responseData = await response.json()
    console.log(responseData)
    expect(saveCertificate).toBeCalledTimes(1)
    const isProperUserCert = await verifyUserCert(certRoot.rootCertString, responseData.certificate)
    expect(isProperUserCert.result).toBe(true)
    expect(responseData.peers.length).toBe(1)
    expect(responseData.rootCa).toBe(certRoot.rootCertString)
  })

  it('returns 403 if username already exists', async () => {
    const user = await createUserCsr({
      zbayNickname: 'userName',
      commonName: 'nqnw4kc4c77fb47lk52m5l57h4tcxceo7ymxekfn7yh5m66t4jv2olad.onion',
      peerId: 'Qmf3ySkYqLET9xtAtDzvAr5Pp3egK1H3C5iJAZm1SpLEp6',
      dmPublicKey: 'testdmPublicKey1',
      signAlg: configCrypto.signAlg,
      hashAlg: configCrypto.hashAlg
    })
    const userNew = await createUserCsr({
      zbayNickname: 'username',
      commonName: 'abcd.onion',
      peerId: 'QmS9vJkgbea9EgzHvVPqhj1u4tH7YKq7eteDN7gnG5zUmc',
      dmPublicKey: 'testdmPublicKey2',
      signAlg: configCrypto.signAlg,
      hashAlg: configCrypto.hashAlg
    })
    const userCert = await createUserCert(certRoot.rootCertString, certRoot.rootKeyString, user.userCsr, new Date(), new Date(2030, 1, 1))
    storage = await getStorage(tmpAppDataPath)
    await storage.saveCertificate(userCert.userCertString, { certificate: certRoot.rootCertString, privKey: certRoot.rootKeyString })
    const saveCertificate = jest.spyOn(storage, 'saveCertificate')
    registrationService = await setupRegistrar(
      // @ts-expect-error
      new TorMock(),
      storage,
      { certificate: certRoot.rootCertString, privKey: certRoot.rootKeyString }
    )
    const response = await registerUserTest(userNew.userCsr, ports.socksPort)
    expect(response.status).toEqual(403)
    expect(saveCertificate).not.toHaveBeenCalled()
  })

  it('returns 400 if no csr in data or csr has wrong format', async () => {
    storage = await getStorage(tmpAppDataPath)
    const saveCertificate = jest.spyOn(storage, 'saveCertificate')
    registrationService = await setupRegistrar(
      // @ts-expect-error
      new TorMock(),
      storage,
      { certificate: certRoot.rootCertString, privKey: certRoot.rootKeyString }
    )
    for (const invalidCsr of ['', 'abcd']) {
      const response = await registerUserTest(invalidCsr, ports.socksPort)
      expect(response.status).toEqual(400)
    }
    expect(saveCertificate).not.toHaveBeenCalled()
  })

  it('returns 400 if csr is lacking a field', async () => {
    storage = await getStorage(tmpAppDataPath)
    registrationService = await setupRegistrar(
      // @ts-expect-error
      new TorMock(),
      storage,
      { certificate: certRoot.rootCertString, privKey: certRoot.rootKeyString }
    )
    // Csr with only commonName and nickName
    const csr = 'MIIBFTCBvAIBADAqMSgwFgYKKwYBBAGDjBsCARMIdGVzdE5hbWUwDgYDVQQDEwdaYmF5IENBMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEGPGHpJzE/CvL7l/OmTSfYQrhhnWQrYw3GgWB1raCTSeFI/MDVztkBOlxwdUWSm10+1OtKVUWeMKaMtyIYFcPPqAwMC4GCSqGSIb3DQEJDjEhMB8wHQYDVR0OBBYEFLjaEh+cnNhsi5qDsiMB/ZTzZFfqMAoGCCqGSM49BAMCA0gAMEUCIFwlob/Igab05EozU0e/lsG7c9BxEy4M4c4Jzru2vasGAiEAqFTQuQr/mVqTHO5vybWm/iNDk8vh88K6aBCCGYqIfdw='
    const response = await registerUserTest(csr, ports.socksPort)
    expect(response.status).toEqual(400)
  })
  it('registers owner certificate', async () => {
    const csr = await createUserCsr({
      zbayNickname: 'userName',
      commonName: 'nqnw4kc4c77fb47lk52m5l57h4tcxceo7ymxekfn7yh5m66t4jv2olad.onion',
      peerId: 'Qmf3ySkYqLET9xtAtDzvAr5Pp3egK1H3C5iJAZm1SpLEp6',
      dmPublicKey: 'testdmPublicKey',
      signAlg: configCrypto.signAlg,
      hashAlg: configCrypto.hashAlg
    })
    const certificate = await CertificateRegistration.registerOwnerCertificate(csr.userCsr, dataFromRootPems)
    const isProperUserCert = await verifyUserCert(dataFromRootPems.certificate, certificate)
    expect(isProperUserCert.result).toBe(true)
  })
})
