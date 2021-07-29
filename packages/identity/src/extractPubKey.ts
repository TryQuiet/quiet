import { fromBase64, stringToArrayBuffer } from 'pvutils'
import { fromBER } from 'asn1js'
import config from './config'
import { getAlgorithmParameters, Certificate } from 'pkijs'

export const parseCertificate = (pem: string): Certificate => {
  let certificateBuffer = new ArrayBuffer(0)
  certificateBuffer = stringToArrayBuffer(fromBase64(pem))
  const asn1 = fromBER(certificateBuffer)
  return new Certificate({ schema: asn1.result })
}

export const keyFromCertificate = (certificate: Certificate): string => {
  return Buffer.from(
    certificate.subjectPublicKeyInfo.subjectPublicKey.valueBlock.valueHex
  ).toString('base64')
}

export const keyObjectFromString = (pubKeyString: string, crypto: SubtleCrypto | undefined): Promise<CryptoKey> => {
  let keyArray = new ArrayBuffer(0)
  keyArray = stringToArrayBuffer(fromBase64(pubKeyString))
  const algorithm = getAlgorithmParameters(config.signAlg, 'generatekey')
  return crypto!.importKey('raw', keyArray, algorithm.algorithm, true, algorithm.usages)
}

export const extractPubKey = (pem: string, crypto: SubtleCrypto | undefined): Promise<CryptoKey> => {
  const pubKeyString = extractPubKeyString(pem)
  return keyObjectFromString(pubKeyString, crypto)
}

export const extractPubKeyString = (pem: string): string => {
  const certificate = parseCertificate(pem)
  return keyFromCertificate(certificate)
}
