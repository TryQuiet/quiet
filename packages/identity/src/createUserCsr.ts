import { PrintableString, OctetString } from 'asn1js'
import { NoCryptoEngineError } from '@quiet/types'
import config from './config'
import { generateKeyPair, CertFieldsTypes, hexStringToArrayBuffer } from './common'
import { getCrypto, CertificationRequest, AttributeTypeAndValue, Attribute, Extensions, Extension } from 'pkijs'

interface CertData {
  publicKey: CryptoKey
  privateKey: CryptoKey
  pkcs10: CertificationRequest
}

export interface UserCsr {
  userCsr: string
  userKey: string
  pkcs10: CertData
}

export const createUserCsr = async ({
  nickname,
  commonName,
  peerId,
  existingKeyPair,
}: {
  nickname: string
  commonName: string
  peerId: string
  signAlg: string
  hashAlg: string
  existingKeyPair?: CryptoKeyPair
}): Promise<UserCsr> => {
  const pkcs10 = await requestCertificate({
    nickname,
    commonName,
    peerId,
    signAlg: config.signAlg,
    hashAlg: config.hashAlg,
    existingKeyPair,
  })
  const crypto = getCrypto()
  if (!crypto) throw new NoCryptoEngineError()

  const userData = {
    userCsr: pkcs10.pkcs10.toSchema().toBER(false),
    userKey: await crypto.exportKey('pkcs8', pkcs10.privateKey),
  }

  return {
    userCsr: Buffer.from(userData.userCsr).toString('base64'),
    userKey: Buffer.from(userData.userKey).toString('base64'),
    pkcs10,
  }
}

async function requestCertificate({
  nickname,
  commonName,
  peerId,
  signAlg = config.signAlg,
  hashAlg = config.hashAlg,
  existingKeyPair,
}: {
  nickname: string
  commonName: string
  peerId: string
  signAlg: string
  hashAlg: string
  existingKeyPair?: CryptoKeyPair
}): Promise<CertData> {
  const keyPair: CryptoKeyPair = existingKeyPair ? existingKeyPair : await generateKeyPair({ signAlg })

  const pkcs10 = new CertificationRequest({
    version: 0,
    attributes: [],
  })
  pkcs10.subject.typesAndValues.push(
    new AttributeTypeAndValue({
      type: CertFieldsTypes.commonName,
      value: new PrintableString({ value: commonName }),
    })
  )

  await pkcs10.subjectPublicKeyInfo.importKey(keyPair.publicKey)
  const crypto = getCrypto()
  if (!crypto) throw new NoCryptoEngineError()

  const hashedPublicKey = await crypto.digest(
    { name: 'SHA-1' },
    pkcs10.subjectPublicKeyInfo.subjectPublicKey.valueBlock.valueHex
  )
  pkcs10.attributes?.push(
    new Attribute({
      type: '1.2.840.113549.1.9.14', // pkcs-9-at-extensionRequest
      values: [
        new Extensions({
          extensions: [
            new Extension({
              extnID: '2.5.29.14',
              critical: false,
              extnValue: new OctetString({ valueHex: hashedPublicKey }).toBER(false),
            }),
          ],
        }).toSchema(),
      ],
    }),
    new Attribute({
      type: CertFieldsTypes.dmPublicKey,
      values: [new OctetString({ valueHex: hexStringToArrayBuffer('') })],
    }),
    new Attribute({
      type: CertFieldsTypes.nickName,
      values: [new PrintableString({ value: nickname })],
    }),
    new Attribute({
      type: CertFieldsTypes.peerId,
      values: [new PrintableString({ value: peerId })],
    }),
    new Attribute({
      type: CertFieldsTypes.subjectAltName,
      values: [new PrintableString({ value: commonName })],
    })
  )
  await pkcs10.sign(keyPair.privateKey, hashAlg)
  return { pkcs10, publicKey: keyPair.publicKey, privateKey: keyPair.privateKey }
}
