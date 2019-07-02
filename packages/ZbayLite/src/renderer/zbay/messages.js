import { DateTime } from 'luxon'
import BigNumber from 'bignumber.js'
import * as R from 'ramda'
import * as Yup from 'yup'

import { packMemo, unpackMemo } from './transit'

export const messageType = {
  BASIC: 1,
  AD: 2,
  TRANSFER: 4
}

const messageSchema = Yup.object().shape({
  type: Yup.number().oneOf(R.values(messageType)).required(),
  sender: Yup.object().shape({
    replyTo: Yup.string().required(),
    username: Yup.string()
  }).required(),
  createdAt: Yup.number().required(),
  message: Yup.string().required()
})

export const transferToMessage = async ({ txid, amount, memo }, isTestnet) => {
  let message = null
  try {
    message = await unpackMemo(memo, isTestnet)
  } catch (err) {
    console.warn(err)
    return null
  }
  try {
    return {
      ...(await messageSchema.validate(message)),
      id: txid,
      spent: new BigNumber(amount)
    }
  } catch (err) {
    console.warn('Incorrect message format: ', err)
    return null
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
