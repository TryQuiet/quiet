import crypto from 'crypto'

export const generateChannelAddress = (channelName: String) =>
  `${channelName}_${crypto.randomBytes(16).toString('hex')}`
