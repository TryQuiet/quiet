import { fromBER } from 'asn1js'
import { stringToArrayBuffer, fromBase64 } from 'pvutils'
import {
  getAlgorithmParameters,
  getCrypto,
  Certificate,
  CertificationRequest,
  AttributeTypeAndValue
} from 'pkijs'

import { KeyObject, KeyPairKeyObjectResult } from 'crypto'

export enum CertFieldsTypes {
  commonName = '2.5.4.3',
  nickName = '1.3.6.1.4.1.50715.2.1',
  peerId = '1.3.6.1.2.1.15.3.1.1'
}

export const generateKeyPair = async ({
  signAlg,
  hashAlg
}: {
  signAlg: string
  hashAlg: string
}): Promise<KeyPairKeyObjectResult> => {
  const algorithm = getAlgorithmParameters(signAlg, 'generatekey')

  if ('hash' in algorithm.algorithm) {
    algorithm.algorithm.hash.name = hashAlg
  }
  const crypto = getCrypto()
  const keyPair = await crypto.generateKey(algorithm.algorithm, true, algorithm.usages)

  return keyPair
}

export const formatPEM = (pemString: string): string => {
  const stringLength = pemString.length
  let resultString = ''
  for (let i = 0, count = 0; i < stringLength; i++, count++) {
    if (count > 63) {
      resultString = `${resultString}\n`
      count = 0
    }
    resultString = `${resultString}${pemString[i]}`
  }
  return resultString
}

export const loadCertificate = (rootCert: string): Certificate => {
  const certificateBuffer = stringToArrayBuffer(fromBase64(rootCert))
  const asn1 = fromBER(certificateBuffer)
  return new Certificate({ schema: asn1.result })
}

export const loadPrivateKey = async (
  rootKey: string,
  signAlg: string,
  hashAlg: string
): Promise<KeyObject> => {
  const keyBuffer = stringToArrayBuffer(fromBase64(rootKey))

  const algorithm = getAlgorithmParameters(signAlg, 'generatekey')
  if ('hash' in algorithm.algorithm) {
    algorithm.algorithm.hash.name = hashAlg
  }
  const crypto = getCrypto()
  return crypto.importKey('pkcs8', keyBuffer, algorithm.algorithm, true, algorithm.usages)
}

export const loadCSR = async (csr: string): Promise<Certificate> => {
  const certBuffer = stringToArrayBuffer(fromBase64(csr))
  const asn1 = fromBER(certBuffer)
  return new CertificationRequest({ schema: asn1.result })
}

export const getCertFieldValue = (cert: Certificate, fieldType: string): string => {
  const block = cert.subject.typesAndValues.find((tav: AttributeTypeAndValue) => tav.type === fieldType)
  if (!block) {
    throw new Error(`Field type ${fieldType} not found in certificate`)
  }
  return block.value.valueBlock.value
}
