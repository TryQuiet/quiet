import sodium from 'libsodium-wrappers-sumo'
import { verifyToken } from './token'

describe('token', () => {
  describe('verifyToken', () => {
    beforeEach(async () => {
      await sodium.ready
    })

    it('returns true for matching tokens', async () => {
      const token = sodium.to_base64(sodium.randombytes_buf(32), sodium.base64_variants.URLSAFE)
      expect(await verifyToken(token, token)).toBeTruthy()
    })

    it('returns false for non-matching tokens', async () => {
      const token1 = sodium.to_base64(sodium.randombytes_buf(32), sodium.base64_variants.URLSAFE)
      const token2 = sodium.to_base64(sodium.randombytes_buf(32), sodium.base64_variants.URLSAFE)
      expect(await verifyToken(token1, token2)).toBeFalsy()
    })

    it('returns false for tokens in different encodings', async () => {
      const bytes = sodium.randombytes_buf(32)
      const token1 = sodium.to_base64(bytes, sodium.base64_variants.ORIGINAL)
      const token2 = sodium.to_base64(bytes, sodium.base64_variants.URLSAFE)
      expect(await verifyToken(token1, token2)).toBeFalsy()
    })

    it('returns false for tokens of different lengths', async () => {
      const token1 = sodium.to_base64(sodium.randombytes_buf(32), sodium.base64_variants.URLSAFE)
      const token2 = sodium.to_base64(sodium.randombytes_buf(8), sodium.base64_variants.URLSAFE)
      expect(await verifyToken(token1, token2)).toBeFalsy()
    })
  })
})
