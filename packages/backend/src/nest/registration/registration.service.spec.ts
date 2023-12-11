import { Test, TestingModule } from '@nestjs/testing'
import { TestModule } from '../common/test.module'
import { RegistrationModule } from './registration.module'
import { RegistrationService } from './registration.service'
import { configCrypto, createRootCA, createUserCsr, type RootCA, verifyUserCert, type UserCsr } from '@quiet/identity'
import { type DirResult } from 'tmp'
import { type PermsData } from '@quiet/types'
import { Time } from 'pkijs'
import { issueCertificate, extractPendingCsrs } from './registration.functions'
import { jest } from '@jest/globals'
import { createTmpDir } from '../common/utils'
import { RegistrationEvents } from './registration.types'

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

  it('extractPendingCsrs should return all csrs if there are no certificates and csrs do not contain duplicate usernames', async () => {
    const certificates: string[] = []
    const csrs: string[] = [userCsr.userCsr]
    const payload: { certificates: string[]; csrs: string[] } = {
      certificates: certificates,
      csrs: csrs,
    }
    const pendingCsrs = await extractPendingCsrs(payload)
    expect(pendingCsrs).toEqual(csrs)
  })

  it('extractPendingCsrs should return all csrs if there are certificates, and csrs do not contain any name that is in certificates already', async () => {
    const aliceCsr = await createUserCsr({
      nickname: 'alice',
      commonName: 'nqnw4kc4c77fb47lk52m5l57h4tcxceo7ymxekfn7yh5m66t4jv2olad.onion',
      peerId: 'Qmf3ySkYqLET9xtAtDzvAr5Pp3egK1H3C5iJAZm1SpLEp6',
      dmPublicKey: 'testdmPublicKey',
      signAlg: configCrypto.signAlg,
      hashAlg: configCrypto.hashAlg,
    })
    const aliceCert = await issueCertificate(aliceCsr.userCsr, permsData)
    if (!aliceCert.cert) return
    const certificates: string[] = [aliceCert.cert]
    const csrs: string[] = [userCsr.userCsr]
    const payload: { certificates: string[]; csrs: string[] } = {
      certificates: certificates,
      csrs: csrs,
    }
    const pendingCsrs = await extractPendingCsrs(payload)
    expect(pendingCsrs).toEqual(csrs)
  })

  it('extractPendingCsrs should return filtered csrs, excluding those that tries to claim username already present in certificate', async () => {
    const userCert = await issueCertificate(userCsr.userCsr, permsData)
    if (!userCert.cert) return
    const certificates: string[] = [userCert.cert]
    const csrs: string[] = [userCsr.userCsr]
    const payload: { certificates: string[]; csrs: string[] } = {
      certificates: certificates,
      csrs: csrs,
    }
    const pendingCsrs = await extractPendingCsrs(payload)
    expect(pendingCsrs.length).toEqual(0)
  })

  it('extractPendingCsrs should return all csrs if there are no duplicates in requested usernames', async () => {
    const userCsr2 = await createUserCsr({
      nickname: 'userName2',
      commonName: 'nqnw4kc4c77fb47lk52m5l57h4tcxceo7ymxekfn7yh5m66t4jv2olad.onion',
      peerId: 'Qmf3ySkYqLET9xtAtDzvAr5Pp3egK1H3C5iJAZm1SpLEp6',
      dmPublicKey: 'testdmPublicKey',
      signAlg: configCrypto.signAlg,
      hashAlg: configCrypto.hashAlg,
    })
    const csrs: string[] = [userCsr.userCsr, userCsr2.userCsr]
    const pendingCsrs = await extractPendingCsrs({ certificates: [], csrs: csrs })
    expect(pendingCsrs.length).toEqual(csrs.length)
  })

  it('Extract pending csrs should return only csrs that have unique usernames', async () => {
    const userCsr = await createUserCsr({
      nickname: 'karol',
      commonName: 'nqnw4kc4c77fb47lk52m5l57h4tcxceo7ymxekfn7yh5m66t4jv2olad.onion',
      peerId: 'Qmf3ySkYqLET9xtAtDzvAr5Pp3egK1H3C5iJAZm1SpLEp6',
      dmPublicKey: 'testdmPublicKey',
      signAlg: configCrypto.signAlg,
      hashAlg: configCrypto.hashAlg,
    })
    const userCsr2 = await createUserCsr({
      nickname: 'karol',
      commonName: 'nnnnnnc4c77fb47lk52m5l57h4tcxceo7ymxekfn7yh5m66t4jv2olad.onion',
      peerId: 'QmffffffqLET9xtAtDzvAr5Pp3egK1H3C5iJAZm1SpLEp6',
      dmPublicKey: 'testdmPublicKey',
      signAlg: configCrypto.signAlg,
      hashAlg: configCrypto.hashAlg,
    })
    const csrs: string[] = [userCsr.userCsr, userCsr2.userCsr]
    const pendingCsrs = await extractPendingCsrs({ certificates: [], csrs: csrs })
    expect(pendingCsrs.length).toEqual(1)
    expect(pendingCsrs[0]).toBe(userCsr.userCsr)
  })

  it('wait for all NEW_USER events until emitting FINISHED_ISSUING_CERTIFICATES_FOR_ID', async () => {
    registrationService.permsData = permsData

    const eventSpy = jest.spyOn(registrationService, 'emit')

    const userCsr = await createUserCsr({
      nickname: 'alice',
      commonName: 'nqnw4kc4c77fb47lk52m5l57h4tcxceo7ymxekfn7yh5m66t4jv2olad.onion',
      peerId: 'Qmf3ySkYqLET9xtAtDzvAr5Pp3egK1H3C5iJAZm1SpLEp6',
      dmPublicKey: 'testdmPublicKey',
      signAlg: configCrypto.signAlg,
      hashAlg: configCrypto.hashAlg,
    })
    const userCsr2 = await createUserCsr({
      nickname: 'karol',
      commonName: 'nnnnnnc4c77fb47lk52m5l57h4tcxceo7ymxekfn7yh5m66t4jv2olad.onion',
      peerId: 'QmffffffqLET9xtAtDzvAr5Pp3egK1H3C5iJAZm1SpLEp6',
      dmPublicKey: 'testdmPublicKey',
      signAlg: configCrypto.signAlg,
      hashAlg: configCrypto.hashAlg,
    })

    const csrs: string[] = [userCsr.userCsr, userCsr2.userCsr]
    // @ts-ignore - fn 'issueCertificates' is private
    await registrationService.issueCertificates({ certificates: [], csrs, id: 1 })

    expect(eventSpy).toHaveBeenLastCalledWith(RegistrationEvents.FINISHED_ISSUING_CERTIFICATES_FOR_ID, {
      id: 1,
    })

    expect(eventSpy).toHaveBeenCalledTimes(3)
  })

  it('race', async () => {
    registrationService.permsData = permsData

    const eventSpy = jest.spyOn(registrationService, 'emit')

    const userCsr = await createUserCsr({
      nickname: 'alice',
      commonName: 'nqnw4kc4c77fb47lk52m5l57h4tcxceo7ymxekfn7yh5m66t4jv2olad.onion',
      peerId: 'Qmf3ySkYqLET9xtAtDzvAr5Pp3egK1H3C5iJAZm1SpLEp6',
      dmPublicKey: 'testdmPublicKey',
      signAlg: configCrypto.signAlg,
      hashAlg: configCrypto.hashAlg,
    })
    const userCsr2 = await createUserCsr({
      nickname: 'alice',
      commonName: 'nnnnnnc4c77fb47lk52m5l57h4tcxceo7ymxekfn7yh5m66t4jv2olad.onion',
      peerId: 'QmffffffqLET9xtAtDzvAr5Pp3egK1H3C5iJAZm1SpLEp6',
      dmPublicKey: 'testdmPublicKey',
      signAlg: configCrypto.signAlg,
      hashAlg: configCrypto.hashAlg,
    })

    const certificates: string[] = []
    let calls = 0

    registrationService.on(RegistrationEvents.NEW_USER, (p: { certificate: string }) => {
      certificates.push(p.certificate)
      calls++
    })

    // @ts-ignore - fn 'issueCertificates' is private
    registrationService.issueCertificates({ certificates: certificates, csrs: [userCsr.userCsr], id: 1 })
    // @ts-ignore - fn 'issueCertificates' is private
    registrationService.issueCertificates({ certificates: certificates, csrs: [userCsr2.userCsr], id: 1 })

    await new Promise(r => setTimeout(r, 2000))
    expect(calls).toEqual(1)
  })
})
