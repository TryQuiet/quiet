import { sign } from '../sign'
import { extractPubKey, parseCertificate, parseCertificationRequest } from '../extractPubKey'
import { verifySignature } from '../verification'
import { verifyUserCert } from '../verifyUserCertificate'
import { Crypto } from '@peculiar/webcrypto'
import { createTestRootCA, createTestUserCert, createTestUserCsr, userData } from './helpers'
import { CertFieldsTypes, getCertFieldValue, getReqFieldValue } from '../common'
import { getCrypto, setEngine, CryptoEngine } from 'pkijs'

describe('Message signature verification', () => {
  let crypto: SubtleCrypto
  beforeAll(() => {
    const webcrypto = new Crypto()
    const cryptoEngine = new CryptoEngine({
      name: '',
      crypto: webcrypto,
      subtle: webcrypto.subtle
    }) as SubtleCrypto

    setEngine('newEngine', webcrypto, cryptoEngine)
    crypto = getCrypto() as SubtleCrypto
  })

  it('returns true if public key and message signature are correct', async () => {
    const message = 'hello'

    const rootCert = await createTestRootCA()
    const userCsr = await createTestUserCsr()
    const userCert = await createTestUserCert(rootCert, userCsr)

    const data = {
      message: message,
      userPubKey: await extractPubKey(userCert.userCertString, crypto),
      signature: await sign(message, userCsr.pkcs10.privateKey)
    }

    const result = await verifySignature(
      data.signature,
      data.message,
      data.userPubKey
    )

    expect(result).toBe(true)
  })

  it("returns false if public key and message signature doesn't match", async () => {
    const message = 'spoofed'

    const rootCert = await createTestRootCA()
    const userCsr = await createTestUserCsr()

    const spoofedUserCsr = await createTestUserCsr()
    const spoofedUserCert = await createTestUserCert(rootCert, spoofedUserCsr)

    const data = {
      message: message,
      userPubKey: await extractPubKey(spoofedUserCert.userCertString, crypto),
      signature: await sign(message, userCsr.pkcs10.privateKey)
    }

    const result = await verifySignature(
      data.signature,
      data.message,
      data.userPubKey
    )

    expect(result).toBe(false)
  })
})

describe('Certificate verification', () => {
  it('returns false if certificate is signed with a different rootCA', async () => {
    const properRootCert = await createTestRootCA()

    const differentRootCert = await createTestRootCA('Other CA')
    const differentUserCert = await createTestUserCert(differentRootCert)

    const certVerificationResult = await verifyUserCert(properRootCert.rootCertString, differentUserCert.userCertString)
    expect(certVerificationResult).toHaveProperty('result')
    expect(certVerificationResult.result).toBe(false)
  })

  it('returns true if certificate is signed with a proper rootCA', async () => {
    const rootCA = await createTestRootCA()
    const userCert = await createTestUserCert(rootCA)
    const certVerificationResult = await verifyUserCert(rootCA.rootCertString, userCert.userCertString)
    expect(certVerificationResult).toHaveProperty('result')
    expect(certVerificationResult.result).toBe(true)
  })
})

describe('Certificate', () => {
  it('certificate can be parsed and contains proper data', async () => {
    const certTypeData = {
      [CertFieldsTypes.commonName]: userData.commonName,
      [CertFieldsTypes.subjectAltName]: userData.commonName,
      [CertFieldsTypes.nickName]: userData.nickname,
      [CertFieldsTypes.peerId]: userData.peerId,
      [CertFieldsTypes.dmPublicKey]: userData.dmPublicKey
    }

    const rootCA = await createTestRootCA()
    const userCert = await createTestUserCert(rootCA)
    const parsedCert = parseCertificate(userCert.userCertString)

    Object.keys(certTypeData).forEach(key => {
      const keyAsEnum = key as CertFieldsTypes

      expect(getCertFieldValue(parsedCert, keyAsEnum))
        .toBe(certTypeData[keyAsEnum])
    })
  })

  it('certification request can be parsed and contains proper data', async () => {
    const certTypeData = {
      [CertFieldsTypes.commonName]: userData.commonName,
      [CertFieldsTypes.subjectAltName]: userData.commonName,
      [CertFieldsTypes.nickName]: userData.nickname,
      [CertFieldsTypes.peerId]: userData.peerId,
      [CertFieldsTypes.dmPublicKey]: userData.dmPublicKey
    }

    const userReq = await createTestUserCsr()
    const parsedCert = parseCertificationRequest(userReq.userCsr)

    Object.keys(certTypeData).forEach(key => {
      const keyAsEnum = key as CertFieldsTypes

      expect(getReqFieldValue(parsedCert, keyAsEnum))
        .toBe(certTypeData[keyAsEnum])
    })
  })

  it('old certificate cannot contains proper data', async () => {
    const parsedCert = parseCertificate('MIIB7TCCAZMCBgF641h5xzAKBggqhkjOPQQDAjASMRAwDgYDVQQDEwdaYmF5IENBMB4XDTIxMDcyNjE1MDQyNFoXDTMwMDIwMTAwMDAwMFowgc4xgcswHAYKKwYBBAGDjBsCARMOZGV2OTlkZXY5OXlvZGEwPwYDVQQDEzgzNWNzNmZramJoZmJiMnppYnIzNm5rdXY0cWlld2x2NXBmcGprbHh2N2xtcGphM2hydTN3NDdpZDA7BgkrBgECAQ8DAQETLlFtVmIxbUZ2Z1hKZXRKS0o1NmRtR1Q2Rkd1TnJtM0VhVFZ6V3VHaGtxcjZodjUwLQYJKoZIhvcNAQkMBCCf3wijnripB3ZADnDgT1ZIr1zUGjHVZI2K4kt6Yb7CazBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABDKw/zcoE2Vahw3q9CdRQsCXikFU8PhEIN/y65hrB6yAxWH4Ut9QBKMMAnaG8JlzvEeaScQiu5Jyyx0O0xAadQ+jHTAbMAwGA1UdEwQFMAMCAQMwCwYDVR0PBAQDAgAGMAoGCCqGSM49BAMCA0gAMEUCIQCRz+6W3K3SI7Q7uYDVVIJXnWud/DGvpqHCuLJ+gnJLMgIgBmS1D8s1xnGOQpARx40vus4b/f49LQeG2YxPCSHVQOM=')

    expect(getCertFieldValue(parsedCert, CertFieldsTypes.dmPublicKey)).toEqual(null)
    expect(getCertFieldValue(parsedCert, CertFieldsTypes.subjectAltName)).toEqual(null)
    expect(getCertFieldValue(parsedCert, CertFieldsTypes.peerId)).toEqual(null)
    expect(getCertFieldValue(parsedCert, CertFieldsTypes.nickName)).toEqual(null)
  })
})
