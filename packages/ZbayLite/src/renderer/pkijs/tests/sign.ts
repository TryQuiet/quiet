import { KeyObject } from 'node:crypto'
import { getCrypto, getAlgorithmParameters } from 'pkijs'

import config from '../generatePems/config'

export const signing = async (message: string, privKey: KeyObject): Promise<ArrayBuffer> => {
  const crypto = getCrypto()
  const messageBuffer = Buffer.from(message)
  const algorithm = getAlgorithmParameters(config.signAlg, 'sign')

  return crypto.sign(algorithm.algorithm, privKey, messageBuffer)
}
