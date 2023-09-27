import { Test, TestingModule } from '@nestjs/testing'
import { TestModule } from '../common/test.module'
import { RegistrationModule } from './registration.module'
import { RegistrationService } from './registration.service'
import { configCrypto, createRootCA, createUserCsr, type RootCA, verifyUserCert, type UserCsr } from '@quiet/identity'
import { type DirResult } from 'tmp'
import { type PermsData } from '@quiet/types'
import { Time } from 'pkijs'
import { issueCertificate, extractPendingCsrs, validateCsr } from './registration.functions'
import { jest } from '@jest/globals'
import { createTmpDir } from '../common/utils'

describe('RegistrationService', () => {
  let module: TestingModule
  let registrationService: RegistrationService

  let tmpDir: DirResult
  let certRoot: RootCA
  let permsData: PermsData
  let userCsr: UserCsr
  let invalidUserCsr: any

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
  })

  afterEach(async () => {
    tmpDir.removeCallback()
    await module.close()
  })

  it('registerUser should return cert if csr is valid and cert should pass the verification', async () => {
    const responseData = await issueCertificate(userCsr.userCsr, permsData)
    expect(responseData.cert).toBeTruthy()
    if (!responseData.cert) return null
    const isProperUserCert = await verifyUserCert(certRoot.rootCertString, responseData.cert)
    expect(isProperUserCert.result).toBe(true)
  })

  it('registrar should return errors array if csr is not valid and should not return any cert', async () => {
    const responseData = await issueCertificate(invalidUserCsr, permsData)
    expect(responseData.cert).toBeFalsy()
    expect(responseData.error.length).toBeTruthy()
  })

  // Extract pending csrs should return all csrs if there are no certificates
  it('extractPendingCsrs should return all csrs if there are no certificates and csrs do not contain duplicate usernames', () => {})
  // Extract pending csrs should return all csrs if there are certificates, but they do not contain any name that's in csr
  // Extract pending csrs should return filtered csrs, excluding those that try to register name that is already in certificate
  // Extrand pending csrs should return all csrs if there are no duplicates in requested usernames
  // Extract pending csrs should return only one csrs that have unique usernames, if there are two or more csrs with same username, return just one
})
