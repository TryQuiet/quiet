import { getAlgorithmParameters, getCrypto } from 'pkijs'

import config from './config'
import { NoCryptoEngineError } from '@quiet/types'

export const sign = async (data: string | Uint8Array, privKey: CryptoKey): Promise<ArrayBuffer> => {
  const crypto = getCrypto()
  if (!crypto) throw new NoCryptoEngineError()
  const dataBuffer = Buffer.from(data)
  const algorithm = getAlgorithmParameters(config.signAlg, 'sign')

  return await crypto.sign(algorithm.algorithm as Algorithm, privKey, dataBuffer)
}
