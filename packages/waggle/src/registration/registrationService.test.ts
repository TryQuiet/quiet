import { createRootCA, createUserCert, createUserCsr, verifyUserCert, configCrypto } from '@zbayapp/identity'
import { SocksProxyAgent } from 'socks-proxy-agent'
import { CertificateRegistration } from '.'
import { Time } from 'pkijs'
import { createMinConnectionManager, createTmpDir, spawnTorProcess, TmpDir, tmpZbayDirPath, TorMock } from '../testUtils'
import { getPorts, Ports } from '../utils'
import fetch, { Response } from 'node-fetch'
import { ConnectionsManager } from '../libp2p/connectionsManager'
import { Tor } from '../torManager'
import { RootCA } from '@zbayapp/identity/lib/generateRootCA'
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

describe('Registration service', () => {
  let tmpDir: TmpDir
  let tmpAppDataPath: string
  let tor: Tor
  let manager: ConnectionsManager
  let registrationService: CertificateRegistration
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
    manager = createMinConnectionManager({ env: { appDataPath: tmpAppDataPath } })
    certRoot = await createRootCA(new Time({ type: 1, value: new Date() }), new Time({ type: 1, value: new Date(2030, 1, 1) }), 'testRootCA')
    ports = await getPorts()
  })

  afterEach(async () => {
    tor && await tor.kill()
    if (manager) {
      await manager.storage.stopOrbitDb()
    }
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
    const saveCertificate = jest.spyOn(manager.storage, 'saveCertificate')
    tor = await spawnTorProcess(tmpAppDataPath, ports)
    await tor.init()
    await manager.initializeNode()
    await manager.initStorage()
    registrationService = await manager.setupRegistrationService(
      tor,
      testHiddenService,
      { certificate: certRoot.rootCertString, privKey: certRoot.rootKeyString }
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
    const saveCertificate = jest.spyOn(manager.storage, 'saveCertificate')
    await manager.initializeNode()
    await manager.initStorage()
    registrationService = await manager.setupRegistrationService(
      // @ts-expect-error
      new TorMock(),
      'testHiddenServiceKey',
      { certificate: certRoot.rootCertString, privKey: certRoot.rootKeyString }
    )
    const response = await registerUserTest(user.userCsr, ports.socksPort)
    const returnedUserCertificate = await response.json()
    expect(saveCertificate).toBeCalledTimes(1)
    const isProperUserCert = await verifyUserCert(certRoot.rootCertString, returnedUserCertificate)
    expect(isProperUserCert.result).toBe(true)
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
    await manager.initializeNode()
    await manager.initStorage()
    await manager.storage.saveCertificate(userCert.userCertString, { certificate: certRoot.rootCertString, privKey: certRoot.rootKeyString })
    const saveCertificate = jest.spyOn(manager.storage, 'saveCertificate')
    registrationService = await manager.setupRegistrationService(
      // @ts-expect-error
      new TorMock(),
      'testHiddenServiceKey',
      { certificate: certRoot.rootCertString, privKey: certRoot.rootKeyString }
    )
    const response = await registerUserTest(userNew.userCsr, ports.socksPort)
    expect(saveCertificate).not.toHaveBeenCalled()
    expect(response.status).toEqual(403)
  })

  it('returns 400 if no csr in data or csr has wrong format', async () => {
    await manager.initializeNode()
    await manager.initStorage()
    const saveCertificate = jest.spyOn(manager.storage, 'saveCertificate')
    registrationService = await manager.setupRegistrationService(
      // @ts-expect-error
      new TorMock(),
      'testHiddenServiceKey',
      { certificate: certRoot.rootCertString, privKey: certRoot.rootKeyString }
    )
    for (const invalidCsr of ['', 'abcd']) {
      const response = await registerUserTest(invalidCsr, ports.socksPort)
      expect(response.status).toEqual(400)
    }
    expect(saveCertificate).not.toHaveBeenCalled()
  })

  it('returns 400 if csr is lacking a field', async () => {
    registrationService = await manager.setupRegistrationService(
      // @ts-expect-error
      new TorMock(),
      'testHiddenServiceKey',
      { certificate: certRoot.rootCertString, privKey: certRoot.rootKeyString }
    )
    // Csr with only commonName and nickName
    const csr = 'MIIBFTCBvAIBADAqMSgwFgYKKwYBBAGDjBsCARMIdGVzdE5hbWUwDgYDVQQDEwdaYmF5IENBMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEGPGHpJzE/CvL7l/OmTSfYQrhhnWQrYw3GgWB1raCTSeFI/MDVztkBOlxwdUWSm10+1OtKVUWeMKaMtyIYFcPPqAwMC4GCSqGSIb3DQEJDjEhMB8wHQYDVR0OBBYEFLjaEh+cnNhsi5qDsiMB/ZTzZFfqMAoGCCqGSM49BAMCA0gAMEUCIFwlob/Igab05EozU0e/lsG7c9BxEy4M4c4Jzru2vasGAiEAqFTQuQr/mVqTHO5vybWm/iNDk8vh88K6aBCCGYqIfdw='
    const response = await registerUserTest(csr, ports.socksPort)
    expect(response.status).toEqual(400)
  })
})
