import { setEngine, CryptoEngine, getCrypto } from 'pkijs'

import { sign } from '../src/sign'
import { extractPubKey, parseCertificate } from '../src/extractPubKey'
import { verifySignature } from '../src/verification'
import { verifyUserCert } from '../src/verifyUserCertificate'
import { Crypto } from '@peculiar/webcrypto'
import { createTestRootCA, createTestUserCert, createTestUserCsr, userData } from './helpers'
import { CertFieldsTypes } from '../src/common'

describe('Message signature verification', () => {
  let crypto
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
    const rootCert = await createTestRootCA()
    const userCsr = await createTestUserCsr()
    const userCert = await createTestUserCert(rootCert, userCsr)

    const data = {
      message: message,
      userPubKey: await extractPubKey(userCert.userCertString, crypto),
      signature: await sign(message, userCsr.pkcs10.privateKey)
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
  it('can be parsed and contains proper data', async () => {
    const certTypeData = {
      [CertFieldsTypes.commonName]: userData.commonName,
      [CertFieldsTypes.nickName]: userData.zbayNickname,
      [CertFieldsTypes.peerId]: userData.peerId
    }
    const rootCA = await createTestRootCA()
    const userCert = await createTestUserCert(rootCA)
    const parsedCert = parseCertificate(userCert.userCertString)
    for (const tav of parsedCert.subject.typesAndValues) {
      expect(tav.value.valueBlock.value).toBe(certTypeData[tav.type])
    }
  })
})
