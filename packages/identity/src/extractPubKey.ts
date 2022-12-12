import { fromBase64, stringToArrayBuffer } from 'pvutils'
import { fromBER } from 'asn1js'
import config from './config'
import { getAlgorithmParameters, Certificate, CertificationRequest } from 'pkijs'

export const parseCertificate = (pem: string): Certificate => {
  let certificateBuffer = new ArrayBuffer(0)
  certificateBuffer = stringToArrayBuffer(fromBase64(pem))
  const asn1 = fromBER(certificateBuffer)
  return new Certificate({ schema: asn1.result })
}

export const parseCertificationRequest = (pem: string): CertificationRequest => {
  let certificateBuffer = new ArrayBuffer(0)
  certificateBuffer = stringToArrayBuffer(fromBase64(pem))
  const asn1 = fromBER(certificateBuffer)
  return new CertificationRequest({ schema: asn1.result })
}

export const keyFromCertificate = (certificate: Certificate | CertificationRequest): string => {
  return Buffer.from(
    certificate.subjectPublicKeyInfo.subjectPublicKey.valueBlock.valueHex
  ).toString('base64')
}

export const keyObjectFromString = async (pubKeyString: string, crypto: SubtleCrypto): Promise<CryptoKey> => {
  let keyArray = new ArrayBuffer(0)
  keyArray = stringToArrayBuffer(fromBase64(pubKeyString))
  const algorithm = getAlgorithmParameters(config.signAlg, 'generatekey')
  return await crypto.importKey('raw', keyArray, algorithm.algorithm, true, ['verify'])
}

export const extractPubKey = async (pem: string, crypto: SubtleCrypto): Promise<CryptoKey> => {
  const pubKeyString = extractPubKeyString(pem)
  return await keyObjectFromString(pubKeyString, crypto)
}

export const extractPubKeyString = (pem: string): string => {
  const certificate = parseCertificate(pem)
  return keyFromCertificate(certificate)
}
