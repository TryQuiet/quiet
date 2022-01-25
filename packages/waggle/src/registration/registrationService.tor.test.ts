import { configCrypto, createRootCA, createUserCsr, RootCA, verifyUserCert } from '@quiet/identity'
import getPort from 'get-port'
import { Time } from 'pkijs'
import { DirResult } from 'tmp'
import { CertificateRegistration } from '.'
import { createTmpDir, spawnTorProcess, tmpZbayDirPath } from '../common/testUtils'
import { getPorts, Ports } from '../common/utils'
import { Storage } from '../storage'
import { Tor } from '../torManager'
import { getStorage, registerUser, setupRegistrar } from './testUtils'
jest.setTimeout(140_000)

describe('Registration service (using tor)', () => {
  let tmpDir: DirResult
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
    const registrarPort = await getPort()
    const saveCertificate = jest.spyOn(storage, 'saveCertificate')
    tor = await spawnTorProcess(tmpAppDataPath, ports)
    await tor.init()
    registrationService = await setupRegistrar(
      tor,
      storage,
      { certificate: certRoot.rootCertString, privKey: certRoot.rootKeyString },
      testHiddenService,
      registrarPort
    )
    const response = await registerUser(user.userCsr, ports.httpTunnelPort, false, registrarPort)
    const responseData = await response.json()
    expect(saveCertificate).toBeCalledTimes(1)
    const isProperUserCert = await verifyUserCert(certRoot.rootCertString, responseData.certificate)
    expect(isProperUserCert.result).toBe(true)
  })
})
