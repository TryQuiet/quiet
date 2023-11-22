import { getAlgorithmParameters, getCrypto } from 'pkijs'

import config from './config'
import { NoCryptoEngineError } from '@quiet/types'

export const sign = async (message: string, privKey: CryptoKey): Promise<ArrayBuffer> => {
    const crypto = getCrypto()
    if (!crypto) throw new NoCryptoEngineError()
    const messageBuffer = Buffer.from(message)
    const algorithm = getAlgorithmParameters(config.signAlg, 'sign')

    return await crypto.sign(algorithm.algorithm as Algorithm, privKey, messageBuffer)
}
