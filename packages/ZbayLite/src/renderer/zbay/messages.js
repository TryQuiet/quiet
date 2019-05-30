import Joi from 'joi'
import { DateTime } from 'luxon'
import BigNumber from 'bignumber.js'
import * as R from 'ramda'

import { packMemo, unpackMemo } from './transit'

export const messageType = {
  BASIC: 1,
  AD: 2,
  TRANSFER: 4
}

const messageSchema = Joi.object().keys({
  type: Joi.number().valid(R.values(messageType)).required(),
  sender: Joi.object().keys({
    replyTo: Joi.string().required(),
    username: Joi.string()
  }).required(),
  createdAt: Joi.number().required(),
  message: Joi.string().required()
})

export const transferToMessage = async ({ txid, amount, memo }, isTestnet) => {
  let message = null
  try {
    message = await unpackMemo(memo, isTestnet)
  } catch (err) {
    console.warn(err)
    return null
  }
  const { error, value } = Joi.validate(message, messageSchema)
  if (error) {
    console.warn('Incorrect message format: ', error)
    return null
  }
  return {
    ...value,
    id: txid,
    spent: new BigNumber(amount)
  }
}

export const createMessage = ({ messageData, identity }) => ({
  type: messageData.type,
  sender: {
    replyTo: identity.address,
    username: identity.name
  },
  createdAt: DateTime.utc().toSeconds(),
  message: messageData.data
})

export const messageToTransfer = async ({ message, channel, amount = '0.0001' }) => ({
  from: message.sender.replyTo,
  amounts: [
    {
      address: channel.address,
      amount: amount,
      memo: await packMemo(message)
    }
  ]
})

export const transfersToMessages = async (transfers, owner, isTestnet) => {
  const msgs = await Promise.all(transfers.map(t => transferToMessage(t, isTestnet)))
  return msgs.filter(x => x)
}

export default {
  createMessage,
  messageType,
  messageToTransfer,
  transferToMessage,
  transfersToMessages
}
