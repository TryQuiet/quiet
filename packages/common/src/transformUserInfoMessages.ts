import { ChannelMessage, DisplayableMessage, InfoMessagesType, MessageType } from '@quiet/types'

type MessageVariants = DisplayableMessage | ChannelMessage

export function transformUserInfoMessages<T extends MessageVariants>(
  ownerNickname: string,
  communityName: string,
  userNickname: string,
  message: T,
  isForNotification = false
): T {
  if (message.type !== MessageType.Info) return message
  switch (message.message) {
    case InfoMessagesType.USER_JOINED:
      return {
        ...message,
        message: !isForNotification
          ? `**@${userNickname}** has joined ${communityName}! 🎉
        Note: **@${userNickname}** is not yet registered, so they'll have the "unregistered" badge until the community creator (**@${ownerNickname}**) registers them, which will happen automatically when **@${ownerNickname}** next appears online. 
        [Learn more](https://github.com/TryQuiet/quiet/wiki/Quiet-FAQ)`
          : `@${userNickname} has joined ${communityName}! 🎉`,
      }
    default:
      return {
        ...message,
        message: '',
      }
  }
}
