import { from_hex, compare } from '@localfirst/crypto'
import { createLogger } from './logger'

const logger = createLogger('token')

export const verifyToken = async (secret: string, token: string): Promise<boolean> => {
  try {
    const secretBytes = from_hex(secret)
    const tokenBytes = from_hex(token)
    const result = compare(secretBytes, tokenBytes)
    return result === 0
  } catch (e) {
    console.error('Error while comparing tokens', e)
    return false
  }
}
