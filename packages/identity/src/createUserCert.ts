import { Integer, BitString, OctetString, PrintableString } from 'asn1js'

import config from './config'
import { loadCertificate, loadPrivateKey, loadCSR, ExtensionsTypes, CertFieldsTypes } from './common'
import {
  Certificate,
  Extension,
  ExtKeyUsage,
  BasicConstraints,
  type CertificationRequest,
  GeneralName,
  GeneralNames,
  type Attribute,
} from 'pkijs'

export interface UserCert {
  // Todo: move types to separate file
  userCertObject: {
    certificate: Certificate
  }
  userCertString: string
}

export const createUserCert = async (
  rootCA: string,
  rootKey: string,
  userCsr: string,
  notBeforeDate: Date,
  notAfterDate: Date
): Promise<UserCert> => {
  const { hashAlg, signAlg } = config
  const userCertificate = await generateUserCertificate({
    issuerCert: loadCertificate(rootCA),
    issuerKey: await loadPrivateKey(rootKey, signAlg),
    pkcs10: await loadCSR(userCsr),
    hashAlg,
    notBeforeDate,
    notAfterDate,
  })

  const userCert = userCertificate.certificate.toSchema(true).toBER(false)
  return {
    userCertObject: userCertificate,
    userCertString: Buffer.from(userCert).toString('base64'),
  }
}

async function generateUserCertificate({
  issuerCert,
  issuerKey,
  pkcs10,
  hashAlg = config.hashAlg,
  notBeforeDate,
  notAfterDate,
}: {
  issuerCert: Certificate
  issuerKey: CryptoKey
  pkcs10: CertificationRequest
  hashAlg: string
  notBeforeDate: Date
  notAfterDate: Date
}): Promise<{ certificate: Certificate }> {
  const basicConstr = new BasicConstraints({ cA: false })
  const keyUsage = getKeyUsage()
  const extKeyUsage = new ExtKeyUsage({
    keyPurposes: [
      '1.3.6.1.5.5.7.3.2', // id-kp-clientAuth
      '1.3.6.1.5.5.7.3.1', // id-kp-serverAuth
    ],
  })
  const attr: Attribute[] | undefined = pkcs10.attributes
  let nickname = null
  let peerId = null
  let onionAddress = null
  let altNames

  try {
    // publicKey = attr[0]

    // DEPRECATED
    // dmPublicKey = attr[1]

    nickname = attr?.[2].values[0].valueBlock.value
    peerId = attr?.[3].values[0].valueBlock.value
    onionAddress = attr?.[4].values[0].valueBlock.value
    altNames = new GeneralNames({
      names: [
        new GeneralName({
          type: 2, // dNSName
          value: `${onionAddress}`,
        }),
      ],
    })
  } catch (err) {
    console.error(err)
    throw new Error('Cannot get certificate request extension')
  }

  const certificate = new Certificate({
    serialNumber: new Integer({ value: new Date().getTime() }),
    version: 2,
    extensions: [
      new Extension({
        extnID: ExtensionsTypes.basicConstr,
        critical: false,
        extnValue: basicConstr.toSchema().toBER(false),
        parsedValue: basicConstr, // Parsed value for well-known extensions
      }),
      new Extension({
        extnID: ExtensionsTypes.keyUsage,
        critical: false,
        extnValue: keyUsage.toBER(false),
        parsedValue: keyUsage, // Parsed value for well-known extensions
      }),
      new Extension({
        extnID: ExtensionsTypes.extKeyUsage,
        critical: false,
        extnValue: extKeyUsage.toSchema().toBER(false),
        parsedValue: extKeyUsage, // Parsed value for well-known extensions
      }),
      new Extension({
        extnID: CertFieldsTypes.nickName,
        critical: false,
        extnValue: new PrintableString({ value: nickname }).toBER(false),
      }),
      new Extension({
        extnID: CertFieldsTypes.peerId,
        critical: false,
        extnValue: new PrintableString({ value: peerId }).toBER(false),
      }),
      new Extension({
        extnID: CertFieldsTypes.subjectAltName,
        critical: false,
        extnValue: altNames.toSchema().toBER(false),
      }),
    ],
    issuer: issuerCert.subject,
    subject: pkcs10.subject,
    subjectPublicKeyInfo: pkcs10.subjectPublicKeyInfo,
  })
  certificate.notBefore.value = notBeforeDate
  certificate.notAfter.value = notAfterDate
  await certificate.sign(issuerKey, hashAlg)
  return { certificate }
}

function getKeyUsage() {
  const bitArray = new ArrayBuffer(1)
  const bitView = new Uint8Array(bitArray)

  bitView[0] |= 0x80 // Key usage 'digitalSignature' flag

  return new BitString({ valueHex: bitArray })
}
