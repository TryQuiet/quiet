import _ from 'validator'
import joi from 'joi'
import { ChannelMessage, MessageType, PublicChannel } from '@quiet/types'
import { ServerStoredCommunityMetadata } from '../storageServiceClient/storageServiceClient.types'
import { isPSKcodeValid } from '@quiet/common'
import { createLogger } from '../common/logger'
import { EncryptedMessage } from '../storage/channels/messages/messages.types'
import { isUint8Array } from 'util/types'
import { CID } from 'multiformats/cid'
import { decodeWireBytes } from './byte-encoding'

const logger = createLogger('validators')

export const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024 * 1024
export const MAX_IMAGE_DIMENSION = 100_000
export const ATTACHMENT_ENCRYPTION_HEADER_BYTES = 24

const attachmentMessageSchema = joi
  .object({
    id: joi.string().min(1).max(512).required(),
    channelId: joi.string().min(1).max(512).required(),
  })
  .required()

const attachmentEncryptionSchema = joi
  .object({
    header: joi
      .string()
      .min(1)
      .max(64)
      .custom((value: string, helpers) => {
        try {
          const decoded = Buffer.from(value, 'base64url')
          if (decoded.byteLength !== ATTACHMENT_ENCRYPTION_HEADER_BYTES || decoded.toString('base64url') !== value) {
            return helpers.error('any.invalid')
          }
          return value
        } catch {
          return helpers.error('any.invalid')
        }
      })
      .required(),
    recipient: joi
      .object({
        generation: joi.number().integer().min(0).max(Number.MAX_SAFE_INTEGER).required(),
        type: joi.string().min(1).max(128).required(),
        name: joi.string().min(1).max(512).required(),
      })
      .required(),
  })
  .required()

const messageMediaSchema = joi.object({
  path: joi.valid(null).required(),
  tmpPath: joi.forbidden(),
  name: joi.string().trim().min(1).max(255).required(),
  ext: joi
    .string()
    .pattern(/^\.[a-z0-9]{1,31}$/i)
    .required(),
  cid: joi
    .string()
    .min(1)
    .max(256)
    .custom((value: string, helpers) => {
      try {
        CID.parse(value)
        return value
      } catch {
        return helpers.error('any.invalid')
      }
    })
    .required(),
  size: joi.number().integer().positive().max(MAX_ATTACHMENT_SIZE_BYTES).required(),
  message: attachmentMessageSchema,
  enc: attachmentEncryptionSchema,
})

const fileMediaSchema = messageMediaSchema.keys({
  width: joi.forbidden(),
  height: joi.forbidden(),
})

const imageMediaSchema = messageMediaSchema.keys({
  width: joi.number().integer().positive().max(MAX_IMAGE_DIMENSION).required(),
  height: joi.number().integer().positive().max(MAX_IMAGE_DIMENSION).required(),
})

const signatureAuthorSchema = joi.object({
  generation: joi.number().required(),
  type: joi.string().required(),
  name: joi.string().required(),
})

const EncryptionSignatureSchema = joi.object({
  author: signatureAuthorSchema.required(),
  signature: joi.string().required(),
})

const messageSchema = joi.object({
  id: joi.string().required(),
  type: joi.number().valid(MessageType.Basic, MessageType.Image, MessageType.Info, MessageType.File).required(),
  message: joi.string().required().allow(''),
  createdAt: joi.number().required(),
  channelId: joi.string().required(),
  userId: joi.string().required(),
  encSignature: EncryptionSignatureSchema.optional(),
  media: joi.when('type', {
    switch: [
      { is: MessageType.File, then: fileMediaSchema.required() },
      { is: MessageType.Image, then: imageMediaSchema.required() },
    ],
    otherwise: joi.forbidden(),
  }),
})

// extends messageSchema to include "verified" field
const consumedChannelMessageSchema = messageSchema.append({
  verified: joi.boolean().required(),
  teamId: joi.string().required(),
})

const encryptedMessageSchema = joi.object({
  id: joi.string().required(),
  contents: joi.object({
    contents: joi
      .any()
      .required()
      .custom((value, helpers) => {
        if (helpers.state.ancestors[0]?.scope?.type === 'DM') {
          decodeWireBytes(value, 2 * 1024 * 1024)
          return value
        }
        if (!Buffer.isBuffer(value) && !isUint8Array(value)) {
          throw new Error('value must be a Uint8Array or Buffer')
        }
        return value
      }),
    scope: joi
      .object({
        generation: joi.number().required(),
        type: joi.string().required(),
        name: joi.string().required(),
      })
      .required(),
  }),
  createdAt: joi.number().required(),
  channelId: joi.string().required(),
  teamId: joi.string().required(),
  encSignature: EncryptionSignatureSchema.required(),
})

const channelSchema = joi.object({
  type: joi.string().valid('channel', 'dm').optional(),
  memberIds: joi.array().items(joi.string()).optional(),
  memberIdHash: joi.string().optional(),
  displayedName: joi.string().optional(),
  name: joi.string().required(),
  description: joi.string().required(),
  owner: joi.string().required(),
  timestamp: joi.number().required(),
  id: joi.string(),
  address: joi.string(),
  public: joi.boolean().optional(),
  roleName: joi.string().optional(),
  disabled: joi.boolean().optional(),
  teamId: joi.string().optional(),
})

// TODO: make this validator more strict
const metadataSchema = joi.object({
  id: joi.string().required(),
  ownerCertificate: joi.string().required(),
  rootCa: joi.string().required(),
  ownerOrbitDbIdentity: joi.string().required(),
  peerList: joi.array().items(joi.string()).required(),
  psk: joi
    .string()
    .required()
    .custom((value, _helpers) => {
      return isPSKcodeValid(value)
    }),
})

export const isDirectMessage = (msg: string): boolean => {
  return msg.length >= 364 && _.isBase64(msg)
}

export const isMessage = (msg: ChannelMessage): boolean => {
  const value = messageSchema.validate(msg, { convert: false })
  if (value.error) logger.error('isMessage', value.error)
  return !value.error
}

export const isConsumedChannelMessage = (msg: ChannelMessage): boolean => {
  const value: joi.ValidationResult = consumedChannelMessageSchema.validate(msg, { convert: false })
  if (value.error) logger.error('Invalid consumed message shape')
  return !value.error
}

export const isEncryptedMessage = (msg: EncryptedMessage): boolean => {
  const value: joi.ValidationResult = encryptedMessageSchema.validate(msg)
  if (value.error) logger.error('Invalid encrypted message shape')
  return !value.error
}

export const isChannel = (channel: PublicChannel): boolean => {
  const value = channelSchema.validate(channel)
  return !value.error
}

export const isServerStoredMetadata = (metadata: ServerStoredCommunityMetadata): boolean => {
  const value = metadataSchema.validate(metadata)
  // Leave this log for first iterations of QSS
  logger.info(value.error)
  return !value.error
}

export default {
  isMessage,
  isDirectMessage,
  isChannel,
  isServerStoredMetadata,
}
