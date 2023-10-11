import { encodeSecret, generateSecret, verifyToken } from './auth'

describe('Auth', () => {
  it('correctly create secret, encode and decode', () => {
    const secret = generateSecret()
    const token = encodeSecret(secret)
    const decodedSecret = verifyToken(secret, token)

    expect(decodedSecret).toBeTruthy()
  })

  it('create token with wrong secret', () => {
    const secret = generateSecret()
    const token = encodeSecret('test')
    const decodedSecret = verifyToken(secret, token)

    expect(decodedSecret).toBeFalsy()
  })
})
