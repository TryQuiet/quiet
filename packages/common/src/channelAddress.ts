import crypto from 'crypto'

export const generateChannelId = (channelName: String) =>
  `${channelName}_${crypto.randomBytes(16).toString('hex')}`
