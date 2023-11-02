import { Crypto } from '@peculiar/webcrypto'

const webcrypto = new Crypto()

const array = new Uint32Array(5)

export const generateSecret = () => webcrypto.getRandomValues(array).join('')

export const encodeSecret = (secret: string) => Buffer.from(secret).toString('base64')

export const verifyToken = (secret: string, token: string): boolean => {
  const decoded = Buffer.from(token, 'base64').toString('ascii')
  return decoded === secret
}
