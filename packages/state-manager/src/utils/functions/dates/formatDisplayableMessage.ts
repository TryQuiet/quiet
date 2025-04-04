import { User, type ChannelMessage, type DisplayableMessage, type UserProfile } from '@quiet/types'
import { formatMessageDisplayDate } from './formatMessageDisplayDate'

export const displayableMessage = (message: ChannelMessage, profile: UserProfile): DisplayableMessage => {
  const date = formatMessageDisplayDate(message.createdAt)
  return {
    id: message.id,
    type: message.type,
    userId: message.userId,
    message: message.message,
    createdAt: message.createdAt,
    date,
    nickname: profile.nickname,
    isRegistered: true,
    isDuplicated: false,
    media: message.media,
    photo: profile.photo,
  }
}
