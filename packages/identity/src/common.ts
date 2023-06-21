import { NoCryptoEngineError } from '@quiet/types'
import { fromBER, type ObjectIdentifier } from 'asn1js'
import {
  getAlgorithmParameters,
  getCrypto,
  CertificationRequest,
  Certificate,
  TSTInfo,
  ECNamedCurves,
  type AttributeTypeAndValue,
} from 'pkijs'
import { stringToArrayBuffer, fromBase64 } from 'pvutils'

export enum CertFieldsTypes {
  commonName = '2.5.4.3',
  subjectAltName = '2.5.29.17',
  nickName = '1.3.6.1.4.1.50715.2.1',
  peerId = '1.3.6.1.2.1.15.3.1.1',
  dmPublicKey = '1.2.840.113549.1.9.12',
}

export enum ExtensionsTypes {
  basicConstr = '2.5.29.19',
  keyUsage = '2.5.29.15',
  extKeyUsage = '2.5.29.37',
}

export function hexStringToArrayBuffer(str: string): ArrayBuffer {
  const stringLength = str.length / 2

  const resultBuffer = new ArrayBuffer(stringLength)
  const resultView = new Uint8Array(resultBuffer)

  // noinspection NonBlockStatementBodyJS
  for (let i = 0; i < stringLength; i++) {
    resultView[i] = parseInt(str.slice(i * 2, i * 2 + 2), 16)
  }

  return resultBuffer
}

export function arrayBufferToHexString(buffer: Buffer): string {
  let resultString = ''
  const view = new Uint8Array(buffer)

  // noinspection NonBlockStatementBodyJS
  for (const element of view) {
    resultString += element.toString(16).padStart(2, '0')
  }

  return resultString
}

export const generateKeyPair = async ({ signAlg }: { signAlg: string }): Promise<CryptoKeyPair> => {
  const algorithm = getAlgorithmParameters(signAlg, 'generateKey')
  const crypto = getCrypto()
  if (!crypto) throw new NoCryptoEngineError()

  const keyPair = await crypto.generateKey(algorithm.algorithm as EcKeyGenParams, true, algorithm.usages)
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

export const loadPrivateKey = async (rootKey: string, signAlg: string): Promise<CryptoKey> => {
  const keyBuffer = stringToArrayBuffer(fromBase64(rootKey))

  const algorithm = getAlgorithmParameters(signAlg, 'generateKey')
  const crypto = getCrypto()
  if (!crypto) throw new NoCryptoEngineError()

  return await crypto.importKey('pkcs8', keyBuffer, algorithm.algorithm as Algorithm, true, algorithm.usages)
}

export const loadCSR = async (csr: string): Promise<CertificationRequest> => {
  const certBuffer = stringToArrayBuffer(fromBase64(csr))
  const asn1 = fromBER(certBuffer)
  return new CertificationRequest({ schema: asn1.result })
}

export const getCertFieldValue = (cert: Certificate, fieldType: CertFieldsTypes | ObjectIdentifier): string | null => {
  if (fieldType === CertFieldsTypes.commonName) {
    const block = cert.subject.typesAndValues.find((tav: AttributeTypeAndValue) => tav.type === fieldType)

    if (block) {
      return block?.value.valueBlock.value
    } else {
      return null
    }
  } else {
    const ext = cert.extensions?.find(tav => tav.extnID === fieldType)
    if (ext) {
      if (fieldType === CertFieldsTypes.dmPublicKey) {
        const extObj = ext?.extnValue.valueBlock.value[0]
        // @ts-ignore
        const arrayBuffer = extObj.valueBlock.valueHex

        return arrayBufferToHexString(arrayBuffer)
      } else {
        const extObj = ext?.extnValue.valueBlock.value[0]
        // @ts-ignore
        return extObj.valueBlock.value
      }
    } else {
      return null
    }
  }
}

export const getReqFieldValue = (
  csr: CertificationRequest,
  fieldType: CertFieldsTypes | ObjectIdentifier
): string | null => {
  if (fieldType === CertFieldsTypes.commonName) {
    const block = csr.subject.typesAndValues.find((tav: AttributeTypeAndValue) => tav.type === fieldType)
    if (block) {
      return block?.value.valueBlock.value
    } else {
      return null
    }
  } else {
    const ext = csr.attributes?.find(tav => tav.type === fieldType)
    if (ext) {
      if (fieldType === CertFieldsTypes.dmPublicKey) {
        const extObj = ext.values[0].valueBlock.valueHex
        return arrayBufferToHexString(extObj)
      } else {
        return ext.values[0].valueBlock.value
      }
    } else {
      return null
    }
  }
}
