import { getAlgorithmParameters, getCrypto } from 'pkijs'
import config from './config'
import logger from './logger'

const log = logger()

export const verifySignature = async (
  signature: ArrayBuffer,
  message: string,
  publicKey: CryptoKey
): Promise<boolean> => {
  const crypto = getCrypto()
  const algorithm = getAlgorithmParameters(config.signAlg, 'verify')
  return await crypto.verify(algorithm.algorithm, publicKey, signature, Buffer.from(message))
}
