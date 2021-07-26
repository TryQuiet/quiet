import { PrintableString, OctetString } from 'asn1js'
import {
  CertificationRequest,
  AttributeTypeAndValue,
  Extension,
  Extensions,
  getCrypto,
  Attribute
} from 'pkijs'

import config from './config'
import { generateKeyPair, CertFieldsTypes } from './common'
import { KeyObject, KeyPairKeyObjectResult } from 'crypto'

interface CertData {
  publicKey: KeyObject
  privateKey: KeyObject
  pkcs10: any
}

export interface UserCsr {
  userCsr: string
  userKey: string
  pkcs10: CertData
}

export const createUserCsr = async ({ zbayNickname, commonName, peerId, dmPublicKey }): Promise<UserCsr> => {
  const pkcs10 = await requestCertificate({
    zbayNickname: zbayNickname,
    commonName: commonName,
    peerId: peerId,
    dmPublicKey: dmPublicKey,
    ...config
  })

  const userData = {
    userCsr: pkcs10.pkcs10.toSchema().toBER(false),
    userKey: await getCrypto().exportKey('pkcs8', pkcs10.privateKey)
  }

  return {
    userCsr: Buffer.from(userData.userCsr).toString('base64'),
    userKey: Buffer.from(userData.userKey).toString('base64'),
    pkcs10: pkcs10
  }
}

async function requestCertificate ({
  zbayNickname,
  commonName,
  peerId,
  dmPublicKey,
  signAlg = config.signAlg,
  hashAlg = config.hashAlg
}: {
  zbayNickname: string
  commonName: string
  peerId: string
  dmPublicKey: Buffer
  signAlg: string
  hashAlg: string
}): Promise<CertData> {
  const keyPair: KeyPairKeyObjectResult = await generateKeyPair({ signAlg, hashAlg })

  const pkcs10 = new CertificationRequest({
    version: 0,
    attributes: []
  })

  pkcs10.subject.typesAndValues.push(
    new AttributeTypeAndValue({
      type: CertFieldsTypes.nickName,
      value: new PrintableString({ value: zbayNickname })
    })
  )
  pkcs10.subject.typesAndValues.push(
    new AttributeTypeAndValue({
      type: CertFieldsTypes.commonName,
      value: new PrintableString({ value: commonName })
    })
  )
  pkcs10.subject.typesAndValues.push(
    new AttributeTypeAndValue({
      type: CertFieldsTypes.peerId,
      value: new PrintableString({ value: peerId })
    })
  )
  pkcs10.subject.typesAndValues.push(
    new AttributeTypeAndValue({
      type: CertFieldsTypes.dmPublicKey,
      value: new OctetString({ valueHex: dmPublicKey })
    })
  )

  await pkcs10.subjectPublicKeyInfo.importKey(keyPair.publicKey)
  const hashedPublicKey = await getCrypto().digest(
    { name: 'SHA-1' },
    pkcs10.subjectPublicKeyInfo.subjectPublicKey.valueBlock.valueHex
  )
  pkcs10.attributes.push(
    new Attribute({
      type: '1.2.840.113549.1.9.14', // pkcs-9-at-extensionRequest
      values: [
        new Extensions({
          extensions: [
            new Extension({
              extnID: '2.5.29.14',
              critical: false,
              extnValue: new OctetString({ valueHex: hashedPublicKey }).toBER(false)
            })
          ]
        }).toSchema()
      ]
    })
  )
  await pkcs10.sign(keyPair.privateKey, hashAlg)
  return { pkcs10, ...keyPair }
}
