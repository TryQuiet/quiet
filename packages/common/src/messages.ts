import { PublicChannelStorage } from '@quiet/types'

export const userCreatedChannelMessage = (username: string, channelName: string) =>
    `@${username} created #${channelName}`

export const generalChannelDeletionMessage = (username: string) => `@${username} deleted all messages in #general`

export const userJoinedMessage = (username: string) =>
    `**@${username}** has joined and will be registered soon. 🎉 [Learn more](https://github.com/TryQuiet/quiet/wiki/Quiet-FAQ#how-does-username-registration-work)`

export const verifyUserInfoMessage = (username: string, channel: PublicChannelStorage) => {
    if (channel.name === 'general') {
        return userJoinedMessage(username)
    } else {
        return userCreatedChannelMessage(username, channel.name)
    }
}
