import { getAlgorithmParameters, getCrypto } from 'pkijs'

import config from './config'

export const sign = async (message: string, privKey: CryptoKey): Promise<ArrayBuffer> => {
  const crypto = getCrypto()
  const messageBuffer = Buffer.from(message)
  const algorithm = getAlgorithmParameters(config.signAlg, 'sign')

  return crypto!.sign(algorithm.algorithm, privKey, messageBuffer)
}
