import { DisplayableMessage, InfoMessagesType } from '@quiet/types'

export const transformUserInfoMessages = (
  ownerNickname: string,
  communityName: string,
  message: DisplayableMessage
) => {
  switch (message.message) {
    case InfoMessagesType.USER_JOINED:
      return {
        ...message,
        message: `@${message.nickname} has joined ${communityName}! 🎉
        Note: @${message.nickname} is not yet registered, so they'll have the "unregistered" badge until the community creator (@${ownerNickname}) registers them, which will happen automatically when @${ownerNickname} next appears online. 
        [Learn more]`,
      }
    default:
      return message
  }
}
