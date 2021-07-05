import { createRootCA, createUserCert, createUserCsr, verifyUserCert } from '@zbayapp/identity'
import { SocksProxyAgent } from 'socks-proxy-agent'
import { CertificateRegistration } from '.'
import { Time } from 'pkijs'
import { createMinConnectionManager, createTmpDir, spawnTorProcess, TmpDir, tmpZbayDirPath } from '../testUtils'
import { fetchAbsolute, getPorts, Ports } from '../utils'
import fetch from 'node-fetch'
import { ConnectionsManager } from '../libp2p/connectionsManager'
import { Tor } from '../torManager'
import { RootCA } from '@zbayapp/identity/lib/generateRootCA'
jest.setTimeout(50_000)

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

async function registerUserTest(csr: string): Promise<Response> {
  const socksProxyAgent = new SocksProxyAgent({ port: ports.socksPort, host: 'localhost', timeout: 60000 })
  const options = {
    method: 'POST',
    body: JSON.stringify({ data: csr }),
    headers: { 'Content-Type': 'application/json' },
    agent: () => {
      return socksProxyAgent
    }
  }
  return await fetchAbsolute(fetch)('http://4avghtoehep5ebjngfqk5b43jolkiyyedfcvvq4ouzdnughodzoglzad.onion:7789')('/register', options)
}

describe('Registration service', () => {
  it('generates and certificate for a new user', async () => {
    const user = await createUserCsr({
      zbayNickname: 'userName',
      commonName: 'nqnw4kc4c77fb47lk52m5l57h4tcxceo7ymxekfn7yh5m66t4jv2olad.onion',
      peerId: 'Qmf3ySkYqLET9xtAtDzvAr5Pp3egK1H3C5iJAZm1SpLEp6'
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
    const response = await registerUserTest(user.userCsr)
    const returnedUserCertificate = await response.json()
    expect(saveCertificate).toBeCalledTimes(1)
    const isProperUserCert = await verifyUserCert(certRoot.rootCertString, returnedUserCertificate)
    expect(isProperUserCert.result).toBe(true)
  })

  it('returns 403 if username already exists', async () => {
    const user = await createUserCsr({
      zbayNickname: 'userName',
      commonName: 'nqnw4kc4c77fb47lk52m5l57h4tcxceo7ymxekfn7yh5m66t4jv2olad.onion',
      peerId: 'Qmf3ySkYqLET9xtAtDzvAr5Pp3egK1H3C5iJAZm1SpLEp6'
    })
    const userNew = await createUserCsr({
      zbayNickname: 'username',
      commonName: 'abcd.onion',
      peerId: 'QmS9vJkgbea9EgzHvVPqhj1u4tH7YKq7eteDN7gnG5zUmc'
    })
    const userCert = await createUserCert(certRoot.rootCertString, certRoot.rootKeyString, user.userCsr, new Date(), new Date(2030, 1, 1))
    tor = await spawnTorProcess(tmpAppDataPath, ports)
    await tor.init()
    await manager.initializeNode()
    await manager.initStorage()
    await manager.storage.saveCertificate(userCert.userCertString, { certificate: certRoot.rootCertString, privKey: certRoot.rootKeyString })
    const saveCertificate = jest.spyOn(manager.storage, 'saveCertificate')
    registrationService = await manager.setupRegistrationService(
      tor,
      testHiddenService,
      { certificate: certRoot.rootCertString, privKey: certRoot.rootKeyString }
    )
    const response = await registerUserTest(userNew.userCsr)
    expect(saveCertificate).not.toHaveBeenCalled()
    expect(response.status).toEqual(403)
  })

  it('returns 400 if no csr in data or csr has wrong format', async () => {
    tor = await spawnTorProcess(tmpAppDataPath, ports)
    await tor.init()
    await manager.initializeNode()
    await manager.initStorage()
    const saveCertificate = jest.spyOn(manager.storage, 'saveCertificate')
    registrationService = await manager.setupRegistrationService(
      tor,
      testHiddenService,
      { certificate: certRoot.rootCertString, privKey: certRoot.rootKeyString }
    )
    for (const invalidCsr of ['', 'abcd']) {
      const response = await registerUserTest(invalidCsr)
      expect(response.status).toEqual(400)
    }
    expect(saveCertificate).not.toHaveBeenCalled()
  })
})
