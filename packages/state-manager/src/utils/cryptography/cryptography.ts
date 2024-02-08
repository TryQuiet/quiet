import crypto from 'crypto'
import { constants } from './constants'

export const generateId = () => {
  return Array(16)
  .fill(null)
  .map(() => Math.random().toString(36).charAt(2))
  .join('');
}

export const generateDmKeyPair = () => {
  const dh = crypto.createDiffieHellman(constants.prime, 'hex', constants.generator, 'hex')
  dh.generateKeys()
  const privateKey = dh.getPrivateKey('hex')
  const publicKey = dh.getPublicKey('hex')

  return { publicKey, privateKey }
}
