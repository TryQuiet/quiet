import { configCrypto, createRootCA, createUserCert, createUserCsr, RootCA, verifyUserCert } from '@zbayapp/identity'
import getPort from 'get-port'
import { Time } from 'pkijs'
import { CertificateRegistration } from '.'
import { createTmpDir, dataFromRootPems, spawnTorProcess, TmpDir, tmpZbayDirPath, TorMock } from '../common/testUtils'
import { getPorts, Ports } from '../common/utils'
import { Storage } from '../storage'
import { Tor } from '../torManager'
import { getStorage, registerUserTest, setupRegistrar } from './testUtils'


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
      null,
      storage,
      { certificate: certRoot.rootCertString, privKey: certRoot.rootKeyString }
    )
    const response = await registerUserTest(
      userNew.userCsr,
      ports.socksPort,
      true,
      registrationService.getHiddenServiceData().port
    )
    expect(response.status).toEqual(403)
    expect(saveCertificate).not.toHaveBeenCalled()
  })

  it('returns 400 if no csr in data or csr has wrong format', async () => {
    storage = await getStorage(tmpAppDataPath)
    const saveCertificate = jest.spyOn(storage, 'saveCertificate')
    registrationService = await setupRegistrar(
      null,
      storage,
      { certificate: certRoot.rootCertString, privKey: certRoot.rootKeyString }
    )
    for (const invalidCsr of ['', 'abcd']) {
      const response = await registerUserTest(
        invalidCsr,
        ports.socksPort,
        true,
        registrationService.getHiddenServiceData().port
      )
      expect(response.status).toEqual(400)
    }
    expect(saveCertificate).not.toHaveBeenCalled()
  })

  it('returns 400 if csr is lacking a field', async () => {
    storage = await getStorage(tmpAppDataPath)
    registrationService = await setupRegistrar(
      null,
      storage,
      { certificate: certRoot.rootCertString, privKey: certRoot.rootKeyString }
    )
    // Csr with only commonName and nickName
    const csr = 'MIIBFTCBvAIBADAqMSgwFgYKKwYBBAGDjBsCARMIdGVzdE5hbWUwDgYDVQQDEwdaYmF5IENBMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEGPGHpJzE/CvL7l/OmTSfYQrhhnWQrYw3GgWB1raCTSeFI/MDVztkBOlxwdUWSm10+1OtKVUWeMKaMtyIYFcPPqAwMC4GCSqGSIb3DQEJDjEhMB8wHQYDVR0OBBYEFLjaEh+cnNhsi5qDsiMB/ZTzZFfqMAoGCCqGSM49BAMCA0gAMEUCIFwlob/Igab05EozU0e/lsG7c9BxEy4M4c4Jzru2vasGAiEAqFTQuQr/mVqTHO5vybWm/iNDk8vh88K6aBCCGYqIfdw='
    const response = await registerUserTest(
      csr,
      ports.socksPort,
      true,
      registrationService.getHiddenServiceData().port
    )
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
