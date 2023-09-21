import { getAlgorithmParameters, getCrypto } from 'pkijs'
import config from './config'
import { NoCryptoEngineError } from '@quiet/types'

export const verifySignature = async (
  signature: ArrayBuffer,
  message: string,
  publicKey: CryptoKey
): Promise<boolean> => {
  const crypto = getCrypto()
  if (!crypto) throw new NoCryptoEngineError()
  const algorithm = getAlgorithmParameters(config.signAlg, 'verify')
  return await crypto.verify(algorithm.algorithm as Algorithm, publicKey, signature, Buffer.from(message))
}

export const verifyDataSignature = async (
  signature: ArrayBuffer,
  data: Uint8Array,
  publicKey: CryptoKey
): Promise<boolean> => {
  const crypto = getCrypto()
  if (!crypto) throw new NoCryptoEngineError()
  const algorithm = getAlgorithmParameters(config.signAlg, 'verify')
  return await crypto.verify(algorithm.algorithm as Algorithm, publicKey, signature, Buffer.from(data))
}
