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
          ? `**@${userNickname}** has joined and will be registered soon. 🎉 [Learn more](https://github.com/TryQuiet/quiet/wiki/Quiet-FAQ#how-does-username-registration-work)`
          : `@${userNickname} has joined and will be registered soon. 🎉`,
      }
    default:
      return {
        ...message,
        message: '',
      }
  }
}
