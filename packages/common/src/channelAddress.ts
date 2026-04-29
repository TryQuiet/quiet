import crypto from 'crypto'

export const generateChannelId = (channelName: string) => `${channelName}_${crypto.randomBytes(16).toString('hex')}`

export const generateDmChannelId = (memberIds: string[]) =>
  crypto.createHash('sha256').update(memberIds.sort().toString()).digest().toString('base64url')

export const getChannelNameFromChannelId = (channelId: string) => {
  const index = channelId.indexOf('_')
  if (index === -1) {
    return channelId
  } else {
    return channelId.substring(0, index)
  }
}
