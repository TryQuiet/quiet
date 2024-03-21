import crypto from 'crypto'
import { constants } from './constants'

export const generateId = () => {
  return Array(16)
    .fill(null)
    .map(() => Math.random().toString(36).charAt(2))
    .join('')
}
