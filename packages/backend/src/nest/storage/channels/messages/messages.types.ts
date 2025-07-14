import { FileMetadata } from '@quiet/types'
import { EncryptedPayload, Signature } from '../../../auth/services/crypto/types'

export interface EncryptableMessageComponents {
  id: string
  userId: string
  channelId: string
  type: number
  message: string
  signature?: string
  pubKey?: string
  media?: FileMetadata
}

export interface EncryptedMessage {
  id: string
  contents: EncryptedPayload
  createdAt: number
  channelId: string
  teamId: string
  encSignature: Signature
}
