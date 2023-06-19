import crypto from 'crypto'

export const generateChannelId = (channelName: string) => `${channelName}_${crypto.randomBytes(16).toString('hex')}`

export const getChannelNameFormChannelId = (channelId: string) => {
  const index = channelId.indexOf('_')
  if (index === -1) {
    return channelId
  } else {
    return channelId.substring(0, index)
  }
}
