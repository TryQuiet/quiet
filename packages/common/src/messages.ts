import { PublicChannel } from '@quiet/types'

export const createdChannelMessage = (channelName: string): string => `Created #${channelName}`

export const generalChannelDeletionMessage = (username: string): string =>
  `**@${username}** deleted all messages in #general`

export const userJoinedMessage = (username: string): string =>
  `**@${username}** has joined and will be registered soon. 🎉 [Learn more](https://github.com/TryQuiet/quiet/wiki/Quiet-FAQ#how-does-username-registration-work)`

export const verifyUserInfoMessage = (username: string, userId: string, channel: PublicChannel): string => {
  if (channel.name === 'general' && channel.owner !== userId) {
    return userJoinedMessage(username)
  } else {
    return createdChannelMessage(channel.name)
  }
}
