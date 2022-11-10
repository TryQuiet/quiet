import { configCrypto, createRootCA, createUserCert, createUserCsr, RootCA, verifyUserCert, UserCsr } from '@quiet/identity'
import { PermsData } from '@quiet/state-manager'
import { Time } from 'pkijs'
import { DirResult } from 'tmp'
import { CertificateRegistration } from '.'
import { createTmpDir } from '../common/testUtils'
import { registerOwner, registerUser } from './functions'

describe('Registration service', () => {
  let tmpDir: DirResult
  let registrationService: CertificateRegistration
  let certRoot: RootCA
  let permsData: PermsData
  let userCsr: UserCsr
  let invalidUserCsr: any

  beforeEach(async () => {
    jest.clearAllMocks()
    tmpDir = createTmpDir()
    registrationService = null
    certRoot = await createRootCA(new Time({ type: 1, value: new Date() }), new Time({ type: 1, value: new Date(2030, 1, 1) }), 'testRootCA')
    permsData = { certificate: certRoot.rootCertString, privKey: certRoot.rootKeyString }
    userCsr = await createUserCsr({
      nickname: 'userName',
      commonName: 'nqnw4kc4c77fb47lk52m5l57h4tcxceo7ymxekfn7yh5m66t4jv2olad.onion',
      peerId: 'Qmf3ySkYqLET9xtAtDzvAr5Pp3egK1H3C5iJAZm1SpLEp6',
      dmPublicKey: 'testdmPublicKey',
      signAlg: configCrypto.signAlg,
      hashAlg: configCrypto.hashAlg
    })
    invalidUserCsr = 'invalidUserCsr'
  })

  afterEach(async () => {
    registrationService && await registrationService.stop()
    tmpDir.removeCallback()
  })

  it('registerOwner should return certificate if csr is valid', async () => {
    const result = await registerOwner(userCsr.userCsr, permsData)
    expect(result).toBeTruthy()
  })

  it('registerOwner should return null if csr is invalid', async () => {
    const result = await registerOwner(invalidUserCsr, permsData)
    expect(result).toBeNull()
  })

  it('registerUser should return 200 status code', async () => {
    const responseData = await registerUser(userCsr.userCsr, permsData, [])
    const isProperUserCert = await verifyUserCert(certRoot.rootCertString, responseData.body.certificate)
    expect(isProperUserCert.result).toBe(true)
  })

  it('returns existing certificate if username is taken but csr and cert public keys match', async () => {
    const user = await createUserCsr({
      nickname: 'userName',
      commonName: 'nqnw4kc4c77fb47lk52m5l57h4tcxceo7ymxekfn7yh5m66t4jv2olad.onion',
      peerId: 'Qmf3ySkYqLET9xtAtDzvAr5Pp3egK1H3C5iJAZm1SpLEp6',
      dmPublicKey: 'testdmPublicKey1',
      signAlg: configCrypto.signAlg,
      hashAlg: configCrypto.hashAlg
    })
    const userCert = await createUserCert(certRoot.rootCertString, certRoot.rootKeyString, user.userCsr, new Date(), new Date(2030, 1, 1))
    const responseData = await registerUser(
      user.userCsr,
      permsData, [userCert.userCertString])
    expect(responseData.status).toEqual(200)
    const isProperUserCert = await verifyUserCert(certRoot.rootCertString, responseData.body.certificate)
    expect(isProperUserCert.result).toBe(true)
    expect(responseData.body.peers.length).toBe(1)
    expect(responseData.body.rootCa).toBe(certRoot.rootCertString)
  })

  it('returns 403 if username already exists and csr and cert public keys dont match', async () => {
    const user = await createUserCsr({
      nickname: 'userName',
      commonName: 'nqnw4kc4c77fb47lk52m5l57h4tcxceo7ymxekfn7yh5m66t4jv2olad.onion',
      peerId: 'Qmf3ySkYqLET9xtAtDzvAr5Pp3egK1H3C5iJAZm1SpLEp6',
      dmPublicKey: 'testdmPublicKey1',
      signAlg: configCrypto.signAlg,
      hashAlg: configCrypto.hashAlg
    })
    const userCert = await createUserCert(certRoot.rootCertString, certRoot.rootKeyString, user.userCsr, new Date(), new Date(2030, 1, 1))
    const userNew = await createUserCsr({
      nickname: 'username',
      commonName: 'abcd.onion',
      peerId: 'QmS9vJkgbea9EgzHvVPqhj1u4tH7YKq7eteDN7gnG5zUmc',
      dmPublicKey: 'testdmPublicKey2',
      signAlg: configCrypto.signAlg,
      hashAlg: configCrypto.hashAlg
    })
    const response = await registerUser(
      userNew.userCsr,
      permsData, [userCert.userCertString]
    )
    expect(response.status).toEqual(403)
  })

  it('returns 400 if no csr in data or csr has wrong format', async () => {
    for (const invalidCsr of ['', 'abcd']) {
      const response = await registerUser(
        invalidCsr,
        permsData, []
      )
      expect(response.status).toEqual(400)
    }
  })

  it('returns 400 if csr is lacking a field', async () => {
    const csr = 'MIIBFTCBvAIBADAqMSgwFgYKKwYBBAGDjBsCARMIdGVzdE5hbWUwDgYDVQQDEwdaYmF5IENBMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEGPGHpJzE/CvL7l/OmTSfYQrhhnWQrYw3GgWB1raCTSeFI/MDVztkBOlxwdUWSm10+1OtKVUWeMKaMtyIYFcPPqAwMC4GCSqGSIb3DQEJDjEhMB8wHQYDVR0OBBYEFLjaEh+cnNhsi5qDsiMB/ZTzZFfqMAoGCCqGSM49BAMCA0gAMEUCIFwlob/Igab05EozU0e/lsG7c9BxEy4M4c4Jzru2vasGAiEAqFTQuQr/mVqTHO5vybWm/iNDk8vh88K6aBCCGYqIfdw='
    const response = await registerUser(
      csr,
      permsData, []
    )
    expect(response.status).toEqual(400)
  })
})
