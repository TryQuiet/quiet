import { Test, TestingModule } from '@nestjs/testing'
import { TestModule } from '../common/test.module'
import { RegistrationModule } from './registration.module'
import { RegistrationService } from './registration.service'
import {
  configCrypto,
  createRootCA,
  createUserCert,
  createUserCsr,
  type RootCA,
  verifyUserCert,
  type UserCsr,
} from '@quiet/identity'
import { type DirResult } from 'tmp'
import { type PermsData } from '@quiet/types'
import { Time } from 'pkijs'
import { registerUser } from './registration.functions'
import { jest } from '@jest/globals'
import { createTmpDir } from '../common/utils'

// @ts-ignore
const { Response } = jest.requireActual('node-fetch')

jest.mock('node-fetch', () => jest.fn())

describe('RegistrationService', () => {
  let module: TestingModule
  let registrationService: RegistrationService

  let tmpDir: DirResult
  let certRoot: RootCA
  let permsData: PermsData
  let userCsr: UserCsr
  let invalidUserCsr: any
  let fetch: any

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [TestModule, RegistrationModule],
    }).compile()

    registrationService = await module.resolve(RegistrationService)

    jest.clearAllMocks()
    tmpDir = createTmpDir()
    certRoot = await createRootCA(
      new Time({ type: 1, value: new Date() }),
      new Time({ type: 1, value: new Date(2030, 1, 1) }),
      'testRootCA'
    )
    permsData = { certificate: certRoot.rootCertString, privKey: certRoot.rootKeyString }
    userCsr = await createUserCsr({
      nickname: 'userName',
      commonName: 'nqnw4kc4c77fb47lk52m5l57h4tcxceo7ymxekfn7yh5m66t4jv2olad.onion',
      peerId: 'Qmf3ySkYqLET9xtAtDzvAr5Pp3egK1H3C5iJAZm1SpLEp6',
      dmPublicKey: 'testdmPublicKey',
      signAlg: configCrypto.signAlg,
      hashAlg: configCrypto.hashAlg,
    })
    invalidUserCsr = 'invalidUserCsr'
    fetch = await import('node-fetch')
  })

  afterEach(async () => {
    tmpDir.removeCallback()
    await module.close()
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
      hashAlg: configCrypto.hashAlg,
    })
    const userCert = await createUserCert(
      certRoot.rootCertString,
      certRoot.rootKeyString,
      user.userCsr,
      new Date(),
      new Date(2030, 1, 1)
    )
    const responseData = await registerUser(user.userCsr, permsData, [userCert.userCertString])
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
      hashAlg: configCrypto.hashAlg,
    })
    const userCert = await createUserCert(
      certRoot.rootCertString,
      certRoot.rootKeyString,
      user.userCsr,
      new Date(),
      new Date(2030, 1, 1)
    )
    const userNew = await createUserCsr({
      nickname: 'username',
      commonName: 'abcd.onion',
      peerId: 'QmS9vJkgbea9EgzHvVPqhj1u4tH7YKq7eteDN7gnG5zUmc',
      dmPublicKey: 'testdmPublicKey2',
      signAlg: configCrypto.signAlg,
      hashAlg: configCrypto.hashAlg,
    })
    const response = await registerUser(userNew.userCsr, permsData, [userCert.userCertString])
    expect(response.status).toEqual(403)
  })

  it('returns 400 if no csr in data or csr has wrong format', async () => {
    for (const invalidCsr of ['', 'abcd']) {
      const response = await registerUser(invalidCsr, permsData, [])
      expect(response.status).toEqual(400)
    }
  })

  it('returns 400 if csr is lacking a field', async () => {
    const csr =
      'MIIBFTCBvAIBADAqMSgwFgYKKwYBBAGDjBsCARMIdGVzdE5hbWUwDgYDVQQDEwdaYmF5IENBMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEGPGHpJzE/CvL7l/OmTSfYQrhhnWQrYw3GgWB1raCTSeFI/MDVztkBOlxwdUWSm10+1OtKVUWeMKaMtyIYFcPPqAwMC4GCSqGSIb3DQEJDjEhMB8wHQYDVR0OBBYEFLjaEh+cnNhsi5qDsiMB/ZTzZFfqMAoGCCqGSM49BAMCA0gAMEUCIFwlob/Igab05EozU0e/lsG7c9BxEy4M4c4Jzru2vasGAiEAqFTQuQr/mVqTHO5vybWm/iNDk8vh88K6aBCCGYqIfdw='
    const response = await registerUser(csr, permsData, [])
    expect(response.status).toEqual(400)
  })
})
