
import { configCrypto, createRootCA, createUserCert, createUserCsr, RootCA, verifyUserCert, UserCsr } from '@quiet/identity'
import { ErrorCodes, ErrorMessages, PermsData, SocketActionTypes } from '@quiet/state-manager'
import createHttpsProxyAgent from 'https-proxy-agent'
import { Time } from 'pkijs'
import { DirResult } from 'tmp'
import { CertificateRegistration } from '.'
import { createTmpDir } from '../common/testUtils'
import { registerOwner, registerUser, sendCertificateRegistrationRequest } from './functions'
import { RegistrationEvents } from './types'
import { jest, beforeEach, describe, it, expect, afterEach, beforeAll } from '@jest/globals'

// @ts-ignore
const { Response } = jest.requireActual('node-fetch')

jest.mock('node-fetch', () => jest.fn())

describe('Registration service', () => {
  let tmpDir: DirResult
  let registrationService: CertificateRegistration | null
  let certRoot: RootCA
  let permsData: PermsData
  let userCsr: UserCsr
  let invalidUserCsr: any
  let fetch: any

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
    fetch = await import('node-fetch')
  })

  afterEach(async () => {
    await registrationService?.stop()
    tmpDir.removeCallback()
  })

  it('registerOwner should return certificate if csr is valid', async () => {
    const result = await registerOwner(userCsr.userCsr, permsData)
    expect(result).toBeTruthy()
  })

  it('registerOwner should throw error if csr is invalid', async () => {
    await expect(registerOwner(invalidUserCsr, permsData)).rejects.toThrow()
  })

  it('registerUser should return 200 status code', async () => {
    const responseData = await registerUser(userCsr.userCsr, permsData, [], 'ownerCert')
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
      permsData, [userCert.userCertString], 'ownerCert')
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
      permsData, [userCert.userCertString], 'ownerCert'
    )
    expect(response.status).toEqual(403)
  })

  it('returns 400 if no csr in data or csr has wrong format', async () => {
    for (const invalidCsr of ['', 'abcd']) {
      const response = await registerUser(
        invalidCsr,
        permsData, [], 'ownerCert'
      )
      expect(response.status).toEqual(400)
    }
  })

  it('returns 400 if csr is lacking a field', async () => {
    const csr = 'MIIBFTCBvAIBADAqMSgwFgYKKwYBBAGDjBsCARMIdGVzdE5hbWUwDgYDVQQDEwdaYmF5IENBMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEGPGHpJzE/CvL7l/OmTSfYQrhhnWQrYw3GgWB1raCTSeFI/MDVztkBOlxwdUWSm10+1OtKVUWeMKaMtyIYFcPPqAwMC4GCSqGSIb3DQEJDjEhMB8wHQYDVR0OBBYEFLjaEh+cnNhsi5qDsiMB/ZTzZFfqMAoGCCqGSM49BAMCA0gAMEUCIFwlob/Igab05EozU0e/lsG7c9BxEy4M4c4Jzru2vasGAiEAqFTQuQr/mVqTHO5vybWm/iNDk8vh88K6aBCCGYqIfdw='
    const response = await registerUser(
      csr,
      permsData, [], 'ownerCert'
    )
    expect(response.status).toEqual(400)
  })

  it('returns 404 if fetching registrar address throws error', async () => {
    console.log(fetch);
    (fetch).default.mockRejectedValue('User aborted request')
    const communityId = 'communityID'
    const response = await sendCertificateRegistrationRequest(
      'QmS9vJkgbea9EgzHvVPqhj1u4tH7YKq7eteDN7gnG5zUmc',
      userCsr.userCsr,
      communityId,
      1000,
      createHttpsProxyAgent({ port: '12311', host: 'localhost' })
    )
    expect(response.eventType).toBe(RegistrationEvents.ERROR)
    expect(response.data).toEqual({
      type: SocketActionTypes.REGISTRAR,
      code: ErrorCodes.NOT_FOUND,
      message: ErrorMessages.REGISTRAR_NOT_FOUND,
      community: communityId
    })
  })

  // FIXME: fix node-fetch mock
  it.skip('returns registration data on successfull registration', async () => {
    const csr = 'MIIBFTCBvAIBADAqMSgwFgYKKwYBBAGDjBsCARMIdGVzdE5hbWUwDgYDVQQDEwdaYmF5IENBMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEGPGHpJzE/CvL7l/OmTSfYQrhhnWQrYw3GgWB1raCTSeFI/MDVztkBOlxwdUWSm10+1OtKVUWeMKaMtyIYFcPPqAwMC4GCSqGSIb3DQEJDjEhMB8wHQYDVR0OBBYEFLjaEh+cnNhsi5qDsiMB/ZTzZFfqMAoGCCqGSM49BAMCA0gAMEUCIFwlob/Igab05EozU0e/lsG7c9BxEy4M4c4Jzru2vasGAiEAqFTQuQr/mVqTHO5vybWm/iNDk8vh88K6aBCCGYqIfdw='
    const registrarResponse = { certificate: [csr], rootCa: certRoot.rootCertString }
    console.log(new Response(JSON.stringify(registrarResponse)));
    (fetch).default.mockReturnValue(new Response(JSON.stringify(registrarResponse)))
    const communityId = 'communityID'
    const response = await sendCertificateRegistrationRequest(
      'QmS9vJkgbea9EgzHvVPqhj1u4tH7YKq7eteDN7gnG5zUmc',
      userCsr.userCsr,
      communityId,
      1000,
      createHttpsProxyAgent({ port: '12311', host: 'localhost' })
    )
    console.log(response)
    expect(response.eventType).toBe(SocketActionTypes.SEND_USER_CERTIFICATE)
    expect(response.data).toEqual({
      communityId: communityId,
      payload: registrarResponse
    })
  })
})
