import { getAlgorithmParameters, getCrypto } from 'pkijs'
import { keyObjectFromString } from '.'
import config from './config'
import logger from './logger'

const log = logger()

export const verifySignature = async (
  signature: ArrayBuffer,
  message: string,
  publicKeyObject?: CryptoKey,
  publicKeyString?: string
): Promise<boolean> => {
  if (!publicKeyObject && !publicKeyString) {
    log.error('Signature verification failed! Not provided public key.')
    return false
  }

  const crypto = getCrypto()
  const algorithm = getAlgorithmParameters(config.signAlg, 'verify')

  let publicKey: CryptoKey = publicKeyObject
  if (!publicKey) {
    publicKey = await keyObjectFromString(publicKeyString, crypto)
  }

  return await crypto.verify(algorithm.algorithm, publicKey, signature, Buffer.from(message))
}
