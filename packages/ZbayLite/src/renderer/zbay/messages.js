import Joi from 'joi'
import * as R from 'ramda'

import { inflate } from '../compression'

export const messageType = {
  BASIC: 'basic',
  AD: 'ad',
  TRANSFER: 'transfer'
}

const messageSchema = Joi.object().keys({
  type: Joi.string().valid(R.values(messageType)).required(),
  sender: Joi.object().keys({
    replyTo: Joi.string().required(),
    username: Joi.string()
  }).required(),
  createdAt: Joi.string().isoDate().required(),
  message: Joi.string().required()
})

export const transferToMessage = async ({ txid, amount, memo }) => {
  const message = await inflate(memo)
  const { error, value } = Joi.validate(message, messageSchema)
  if (error) {
    console.warn(error)
    return null
  }
  return {
    ...value,
    id: txid,
    spent: amount
  }
}

export const transfersToMessages = async (transfers) => transfers.map(transferToMessage).filter(x => x)

export default {
  messageType,
  transferToMessage,
  transfersToMessages
}
