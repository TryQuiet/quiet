import crypto from 'crypto'
import { constants } from './constants'

export const generateID = () => {
  const id = crypto.randomBytes(16).toString('hex').toUpperCase()
  return id
}

export const generateDmKeyPair = () => {
  const dh = crypto.createDiffieHellman(constants.prime, 'hex', constants.generator, 'hex')
  dh.generateKeys()
  const privateKey = dh.getPrivateKey('hex')
  const publicKey = dh.getPublicKey('hex')

  return { publicKey, privateKey }
}
