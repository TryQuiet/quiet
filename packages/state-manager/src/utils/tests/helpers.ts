import { configCrypto, keyFromCertificate, loadPrivateKey, parseCertificate, sign } from '@quiet/identity'
// import fs from 'fs'
// import os from 'os'
import { arrayBufferToString } from 'pvutils'
import { type PeerId } from '@quiet/types'
import { createLogger } from '../../utils/logger'

const logger = createLogger('testHelpers')

const notBeforeDate = new Date(Date.UTC(2010, 11, 28, 10, 10, 10))
const notAfterDate = new Date(Date.UTC(2030, 11, 28, 10, 10, 10))

export const createPeerIdTestHelper = (): PeerId => {
  return {
    id: '12D3KooWRga8g1J1oiH7UYnSQ8YMPRDfVuehuiuAd7PMkcXSxRsp',
    privKey: 'jAXL3ZK13AWR9WcwbX8nM/qgQqdaApPDqWj6dK9IPwHru99WpGniLouugCv2+t7QN4xnYLMoAFPRP40xTUTrCw',
    noiseKey: 'B+zyZ6mQ5f+h0EDkr0woI+pIJc8xm62+f+M24eYVeMY=',
  }
}

export const createMessageSignatureTestHelper = async (
  message: string,
  certificate: string,
  userKey: string
): Promise<{ signature: string; pubKey: string }> => {
  const pubKey = keyFromCertificate(parseCertificate(certificate))
  const keyObject = await loadPrivateKey(userKey, configCrypto.signAlg)
  const signatureArrayBuffer = await sign(message, keyObject)
  const signature = arrayBufferToString(signatureArrayBuffer)
  return {
    signature,
    pubKey,
  }
}

export const lastActionReducer = (state: any[] = [], action: any) => {
  state.push(action.type)
  return state
}

export default {
  createPeerIdTestHelper,
  createMessageSignatureTestHelper,
  lastActionReducer,
}
