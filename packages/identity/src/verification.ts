import { getAlgorithmParameters, getCrypto } from 'pkijs'
import config from './config'

export const verifySignature = async (
  userPubKey: CryptoKey,
  signature: ArrayBuffer,
  message: string
): Promise<boolean> => {
  const crypto = getCrypto()
  const algorithm = getAlgorithmParameters(config.signAlg, 'verify')
  const messageBuffer = Buffer.from(message)

  return crypto!.verify(algorithm.algorithm, userPubKey, signature, messageBuffer)
}
