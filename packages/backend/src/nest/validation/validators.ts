import _ from 'validator'
import joi from 'joi'
import { ChannelMessage, PublicChannel } from '@quiet/types'
import { ServerStoredCommunityMetadata } from '../storageServiceClient/storageServiceClient.types'
import { isPSKcodeValid } from '@quiet/common'
import { createLogger } from '../common/logger'
import { EncryptedMessage } from '../storage/channels/messages/messages.types'
import { isUint8Array } from 'util/types'

const logger = createLogger('validators')

const messageMediaSchema = joi.object({
  path: joi.string().allow(null),
  name: joi.string().required(),
  ext: joi.string().required(),
  cid: joi.string().required(),
  size: joi.number().allow(null),
  width: joi.number().allow(null),
  height: joi.number().allow(null),
  message: joi.object({
    id: joi.string().required(),
    channelId: joi.string(),
    channelAddress: joi.string(),
  }),
  enc: joi
    .object({
      header: joi.binary().required(),
      recipient: joi
        .object({
          generation: joi.number().required(),
          type: joi.string().required(),
          name: joi.string().allow(null),
        })
        .required(),
    })
    .allow(null),
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
  type: joi.number().required().positive().integer(),
  message: joi.string().required().allow(''),
  createdAt: joi.number().required(),
  channelId: joi.string().required(),
  userId: joi.string().required(),
  encSignature: EncryptionSignatureSchema.optional(),
  media: messageMediaSchema.optional(),
})

const encryptedMessageSchema = joi.object({
  id: joi.string().required(),
  contents: joi.object({
    contents: joi
      .any()
      .required()
      .custom((value, _helpers) => {
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
  name: joi.string().required(),
  description: joi.string().required(),
  owner: joi.string().required(),
  timestamp: joi.number().required(),
  id: joi.string(),
  address: joi.string(),
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
  const value = messageSchema.validate(msg)
  if (value.error) logger.error('isMessage', value.error)
  return !value.error
}

export const isEncryptedMessage = (msg: EncryptedMessage): boolean => {
  const value: joi.ValidationResult = encryptedMessageSchema.validate(msg)
  if (value.error) logger.error('isEncryptedMessage', value.error)
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
