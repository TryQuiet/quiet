import { Integer, PrintableString, BitString } from 'asn1js'
import { Certificate, AttributeTypeAndValue, BasicConstraints, Extension, getCrypto, ExtKeyUsage } from 'pkijs'

import config from './config'
import { generateKeyPair, CertFieldsTypes, ExtensionsTypes } from './common'

export interface RootCA {
  // Todo: move types to separate file
  rootObject: Certificate
  rootCertString: string
  rootKeyString: string
}

export const createRootCA = async (
  notBeforeDate: Date,
  notAfterDate: Date,
  rootCAcommonName?: string
): Promise<RootCA> => {
  const commonName = rootCAcommonName || 'Zbay CA'
  const rootCA = await generateRootCA({
    commonName,
    ...config,
    notBeforeDate,
    notAfterDate
  })

  const rootData = {
    rootCert: rootCA.certificate.toSchema(true).toBER(false),
    rootKey: await getCrypto().exportKey('pkcs8', rootCA.privateKey)
  }

  return {
    rootObject: rootCA,
    rootCertString: Buffer.from(rootData.rootCert).toString('base64'),
    rootKeyString: Buffer.from(rootData.rootKey).toString('base64')
  }
}

async function generateRootCA ({
  commonName,
  signAlg = config.signAlg,
  hashAlg = config.hashAlg,
  notBeforeDate,
  notAfterDate
}: {
  commonName: string
  signAlg: string
  hashAlg: string
  notBeforeDate: Date
  notAfterDate: Date
}): Promise<Certificate> {
  const basicConstr = new BasicConstraints({ cA: true, pathLenConstraint: 3 })
  const keyUsage = getCAKeyUsage()
  const extKeyUsage = new ExtKeyUsage({
    keyPurposes: [
      '1.3.6.1.5.5.7.3.2', // id-kp-clientAuth
      '1.3.6.1.5.5.7.3.1' // id-kp-serverAuth
    ]
  })
  const certificate = new Certificate({
    serialNumber: new Integer({ value: 1 }),
    extensions: [
      new Extension({
        extnID: ExtensionsTypes.basicConstr,
        critical: false,
        extnValue: basicConstr.toSchema().toBER(false),
        parsedValue: basicConstr // Parsed value for well-known extensions
      }),
      new Extension({
        extnID: ExtensionsTypes.keyUsage,
        critical: false,
        extnValue: keyUsage.toBER(false),
        parsedValue: keyUsage // Parsed value for well-known extensions
      }),
      new Extension({
        extnID: ExtensionsTypes.extKeyUsage,
        critical: false,
        extnValue: extKeyUsage.toSchema().toBER(false),
        parsedValue: extKeyUsage // Parsed value for well-known extensions
      })
    ],
    notBefore: notBeforeDate,
    notAfter: notAfterDate
  })
  certificate.issuer.typesAndValues.push(
    new AttributeTypeAndValue({
      type: CertFieldsTypes.commonName,
      value: new PrintableString({ value: commonName })
    })
  )
  certificate.subject.typesAndValues.push(
    new AttributeTypeAndValue({
      type: CertFieldsTypes.commonName,
      value: new PrintableString({ value: commonName })
    })
  )
  const keyPair = await generateKeyPair({ signAlg, hashAlg })

  await certificate.subjectPublicKeyInfo.importKey(keyPair.publicKey)
  await certificate.sign(keyPair.privateKey, hashAlg)

  return { certificate, ...keyPair }
}

function getCAKeyUsage (): BitString {
  const bitArray = new ArrayBuffer(1)
  const bitView = new Uint8Array(bitArray)

  bitView[0] |= 0x02 // Key usage 'cRLSign' flag
  bitView[0] |= 0x04 // Key usage 'keyCertSign' flag

  return new BitString({ valueHex: bitArray })
}
