import { getAlgorithmParameters, getCrypto } from 'pkijs'
import config from './config'

export const verifySignature = async (
  signature: ArrayBuffer,
  message: string,
  publicKey: CryptoKey
): Promise<boolean> => {
  const crypto = getCrypto() as SubtleCrypto
  const algorithm = getAlgorithmParameters(config.signAlg, 'verify')
  return await crypto?.verify(algorithm.algorithm, publicKey, signature, Buffer.from(message))
}
