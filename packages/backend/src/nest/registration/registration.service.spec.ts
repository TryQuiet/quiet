import { Test, TestingModule } from '@nestjs/testing'
import { TestModule } from '../common/test.module'
import { RegistrationModule } from './registration.module'
import { RegistrationService } from './registration.service'
import { configCrypto, createRootCA, createUserCsr, type RootCA, verifyUserCert, type UserCsr } from '@quiet/identity'
import { type DirResult } from 'tmp'
import { type PermsData } from '@quiet/types'
import { Time } from 'pkijs'
import { registerUser } from './registration.functions'
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

  it('registerUser should return cert', async () => {
    const responseData = await registerUser(userCsr.userCsr, permsData)
    expect(responseData.cert).toBeTruthy()
    if (!responseData.cert) return null
    const isProperUserCert = await verifyUserCert(certRoot.rootCertString, responseData.cert)
    expect(isProperUserCert.result).toBe(true)
  })
})
