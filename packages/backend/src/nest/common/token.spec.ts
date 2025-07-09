import { to_hex, to_base64, randomBytes, base64_variants } from '@localfirst/crypto'

import { verifyToken } from './token'
import { createLogger } from './logger'

const logger = createLogger('token:test')

describe('token', () => {
  describe('verifyToken', () => {
    it('returns true for matching tokens', async () => {
      const token = to_hex(randomBytes(32))
      expect(await verifyToken(token, token)).toBeTruthy()
    })

    it('returns false for non-matching tokens', async () => {
      const token1 = to_hex(randomBytes(32))
      const token2 = to_hex(randomBytes(32))
      expect(await verifyToken(token1, token2)).toBeFalsy()
    })

    it('returns false for tokens in different encodings', async () => {
      const bytes = randomBytes(32)
      const token1 = to_base64(bytes, base64_variants.ORIGINAL)
      const token2 = to_hex(bytes)
      expect(await verifyToken(token1, token2)).toBeFalsy()
    })

    it('returns false for tokens of different lengths', async () => {
      const token1 = to_hex(randomBytes(32))
      const token2 = to_hex(randomBytes(8))
      expect(await verifyToken(token1, token2)).toBeFalsy()
    })
  })
})
