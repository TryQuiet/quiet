import { stringToArrayBuffer } from 'pvutils'
import { sign } from '../sign'
import { extractPubKey, parseCertificate, parseCertificationRequest } from '../extractPubKey'
import { verifySignature } from '../verification'
import { verifyUserCert } from '../verifyUserCertificate'
import { Crypto } from '@peculiar/webcrypto'
import { createTestRootCA, createTestUserCert, createTestUserCsr, userData } from './helpers'
import { CertFieldsTypes, getCertFieldValue, getReqFieldValue } from '../common'
import { getCrypto, setEngine, CryptoEngine } from 'pkijs'

describe('Message signature verification', () => {
  let crypto: SubtleCrypto | undefined
  beforeAll(() => {
    const webcrypto = new Crypto()
    setEngine('newEngine', webcrypto, new CryptoEngine({
      name: '',
      crypto: webcrypto,
      subtle: webcrypto.subtle
    }))
    crypto = getCrypto()
  })

  it('returns true if public key and message signature are correct', async () => {
    const message = 'hello'
    const dmPublicKey = Buffer.from('0bfb475810c0e26c9fab590d47c3d60ec533bb3c451596acc3cd4f21602e9ad9', 'hex')
    const dmPublicKeyString = dmPublicKey.toString()
    const dmPublicKeyArrayBuffer = stringToArrayBuffer(dmPublicKeyString)
    const rootCert = await createTestRootCA()
    const userCsr = await createTestUserCsr()
    const userCert = await createTestUserCert(rootCert, userCsr)

    const data = {
      message: message,
      userPubKey: await extractPubKey(userCert.userCertString, crypto),
      signature: await sign(message, userCsr.pkcs10.privateKey),
      dmPublicKey: dmPublicKeyArrayBuffer
    }

    const result = await verifySignature(data.userPubKey, data.signature, data.message)
    expect(result).toBe(true)
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
      [CertFieldsTypes.nickName]: userData.zbayNickname,
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
      [CertFieldsTypes.nickName]: userData.zbayNickname,
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
})
