import * as R from 'ramda'
import * as Yup from 'yup'

import { inflate, deflate } from '../compression'

export const URI_PREFIX = 'zbay://channel/'
export const ADDRESS_PREFIX = 'zbay://uri/'

export const getZbayAddress = (zcashAddress) => `${ADDRESS_PREFIX}${zcashAddress}`
export const getZbayChannelUri = (hash) => `${URI_PREFIX}${hash}`

const channelSchema = Yup.object().shape({
  name: Yup.string().required(),
  private: Yup.boolean(),
  address: Yup.string().required(),
  description: Yup.string().required(),
  keys: Yup.object().shape({
    ivk: Yup.string(),
    sk: Yup.string()
  }).required()
})

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
  try {
    const validated = await channelSchema.validate(channel)
    return validated
  } catch (err) {
    throw new Error(`Incorrect export format for ${uri}: ${err}`)
  }
}

export const channelToUri = async (channel) => {
  const exportable = {
    name: channel.name,
    address: channel.address,
    description: channel.description,
    keys: {
      ivk: channel.keys.ivk
    }
  }
  const hash = await deflate(exportable)
  return getZbayChannelUri(hash)
}

export default {
  uriToChannel,
  getZbayAddress,
  getZbayChannelUri
}
