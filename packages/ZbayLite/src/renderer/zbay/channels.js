import * as R from 'ramda'
import Joi from 'joi'

import { inflate } from '../compression'

export const URI_PREFIX = 'zbay.io/channel/'

const channelSchema = Joi.object().keys({
  name: Joi.string().required(),
  private: Joi.boolean().required(),
  address: Joi.string().required(),
  description: Joi.string().required(),
  keys: Joi.object().keys({
    ivk: Joi.string(),
    sk: Joi.string()
  }).or('ivk', 'sk')
}).required()

const _inflateOrThrow = async (hash) => {
  try {
    const channel = await inflate(hash)
    return channel
  } catch (_) {
    throw new Error(`Invalid channel hash: ${hash}`)
  }
}

export const uriToChannel = async (uri) => {
  const hash = (
    R.startsWith(URI_PREFIX)
      ? uri.substring(URI_PREFIX.length)
      : uri
  )
  const channel = await _inflateOrThrow(hash)
  const { error, value } = Joi.validate(channel, channelSchema, { abortEarly: false })
  if (error) {
    throw new Error(`Incorrect export format for ${uri}: ${error}`)
  }
  return value
}

export default {
  uriToChannel
}
