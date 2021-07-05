import _ from 'validator'
import joi from 'joi'

import { IMessage, IChannelInfo } from '../common/types'

const messageSchema = joi.object({
  id: joi.string().required(),
  type: joi.number().required().positive().integer(),
  message: joi.string().required(),
  createdAt: joi.number().required(),
  channelId: joi.string().required(),
  signature: joi.string().required(),
  pubKey: joi.string().required()
})

const channelSchema = joi.object({
  name: joi.string().required(),
  description: joi.string().required(),
  owner: joi.string().required(),
  timestamp: joi.number().required(),
  address: joi.string().required(),
  keys: joi.object().required()
})

export const isUser = (publicKey: string, halfKey: string): boolean => {
  return (
    publicKey.length === 66 &&
    halfKey.length === 64 &&
    _.isHexadecimal(publicKey) &&
    _.isHexadecimal(halfKey)
  )
}

export const isConversation = (publicKey: string, encryptedPhrase: string): boolean => {
  return (
    publicKey.length === 64 &&
    encryptedPhrase.length === 108 &&
    _.isHexadecimal(publicKey) &&
    _.isBase64(encryptedPhrase)
  )
}

export const isDirectMessage = (msg: string): boolean => {
  return msg.length >= 364 && _.isBase64(msg)
}

export const isMessage = (msg: IMessage): boolean => {
  const value = messageSchema.validate(msg)
  return !value.error
}

export const isChannel = (channel: IChannelInfo): boolean => {
  const value = channelSchema.validate(channel)
  return !value.error
}

export default {
  isUser,
  isMessage,
  isDirectMessage,
  isChannel,
  isConversation
}
