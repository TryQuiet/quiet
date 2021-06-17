import { fromBase64, stringToArrayBuffer } from 'pvutils'
import { Certificate, getAlgorithmParameters } from 'pkijs'
import { fromBER } from 'asn1js'
import config from './config'

const parseCertificate = (pem: string): Certificate => {
  let certificateBuffer = new ArrayBuffer(0)
  certificateBuffer = stringToArrayBuffer(fromBase64(pem))
  const asn1 = fromBER(certificateBuffer)
  return new Certificate({ schema: asn1.result })
}

const keyFromCertificate = (certificate: Certificate): string => {
  return Buffer.from(certificate.subjectPublicKeyInfo.subjectPublicKey.valueBlock.valueHex).toString('base64')
}

const keyObjectFromString = (pubKeyString: string, crypto: any) => { // todo: why 'string' in var name??
  let keyArray = new ArrayBuffer(0)
  keyArray = stringToArrayBuffer(fromBase64(pubKeyString))
  const algorithm = getAlgorithmParameters(config.signAlg, 'generatekey')
  if ('hash' in algorithm.algorithm) {
    algorithm.algorithm.hash.name = config.hashAlg
  }

  return crypto.importKey('raw', keyArray, algorithm.algorithm, true, algorithm.usages)
}

export const extractPubKey = async (pem: string, crypto: any) => {
  const certificate = parseCertificate(pem)
  const pubKeyString = keyFromCertificate(certificate)
  return keyObjectFromString(pubKeyString, crypto)
}
