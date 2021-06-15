import { Integer, PrintableString, BitString } from 'asn1js'
import { Certificate, AttributeTypeAndValue, BasicConstraints, Extension, getCrypto } from 'pkijs'

import config from './config'
import { generateKeyPair, CertFieldsTypes } from './common'

export const createRootCA = async (notBeforeDate, notAfterDate) => {
  const rootCA = await generateRootCA({
    commonName: 'Zbay CA',
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

async function generateRootCA({
  commonName,
  signAlg = config.signAlg,
  hashAlg = config.hashAlg,
  notBeforeDate,
  notAfterDate
}: { commonName: string; signAlg: string; hashAlg: string; notBeforeDate: Date; notAfterDate: Date }): Promise<Certificate> {
  const basicConstr = new BasicConstraints({ cA: true, pathLenConstraint: 3 })
  const keyUsage = getCAKeyUsage()
  const certificate = new Certificate({
    serialNumber: new Integer({ value: 1 }),
    extensions: [
      new Extension({
        extnID: '2.5.29.19',
        critical: false,
        extnValue: basicConstr.toSchema().toBER(false),
        parsedValue: basicConstr // Parsed value for well-known extensions
      }),
      new Extension({
        extnID: '2.5.29.15',
        critical: false,
        extnValue: keyUsage.toBER(false),
        parsedValue: keyUsage // Parsed value for well-known extensions
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
  const keyPair = await generateKeyPair({ signAlg, hashAlg })

  await certificate.subjectPublicKeyInfo.importKey(keyPair.publicKey)
  await certificate.sign(keyPair.privateKey, hashAlg)

  return { certificate, ...keyPair }
}

function getCAKeyUsage() {
  const bitArray = new ArrayBuffer(1)
  const bitView = new Uint8Array(bitArray)

  bitView[0] |= 0x02 // Key usage 'cRLSign' flag
  bitView[0] |= 0x04 // Key usage 'keyCertSign' flag

  return new BitString({ valueHex: bitArray })
}
