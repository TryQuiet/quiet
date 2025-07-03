import { encodeSecret } from './auth'

const verifyToken = (secret: string, token: string): boolean => {
  const decoded = Buffer.from(token, 'base64').toString('ascii')
  return decoded === secret
}

describe('Auth', () => {
  it('correctly create secret, encode and decode', () => {
    const secret = 'secret'
    const token = encodeSecret(secret)
    const decodedSecret = verifyToken(secret, token)

    expect(decodedSecret).toBeTruthy()
  })

  it('create token with wrong secret', () => {
    const secret = 'secret'
    const token = encodeSecret('test')
    const decodedSecret = verifyToken(secret, token)

    expect(decodedSecret).toBeFalsy()
  })
})
