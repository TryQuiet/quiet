import { Crypto } from '@peculiar/webcrypto'
import { setEngine, CryptoEngine } from 'pkijs'

const webcrypto = new Crypto()
setEngine(
  'newEngine',
  webcrypto,
  new CryptoEngine({
    name: '',
    crypto: webcrypto,
    subtle: webcrypto.subtle,
  })
)

global.crypto = webcrypto

const array = new Uint32Array(5)

export const generateSecret = () => webcrypto.getRandomValues(array).join('')

export const encodeSecret = (secret: string) => Buffer.from(secret).toString('base64')

export const verifyToken = (secret: string, token: string): boolean => {
  const decoded = Buffer.from(token, 'base64').toString('ascii')
  return decoded === secret
}
