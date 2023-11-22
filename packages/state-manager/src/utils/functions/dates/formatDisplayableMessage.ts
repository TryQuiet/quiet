import { User, type ChannelMessage, type DisplayableMessage } from '@quiet/types'
import { formatMessageDisplayDate } from './formatMessageDisplayDate'

export const displayableMessage = (message: ChannelMessage, user: User): DisplayableMessage => {
    const date = formatMessageDisplayDate(message.createdAt)
    return {
        id: message.id,
        type: message.type,
        message: message.message,
        createdAt: message.createdAt,
        date,
        nickname: user.username,
        isRegistered: user.isRegistered,
        isDuplicated: user.isDuplicated,
        pubKey: user.pubKey,
        media: message.media,
    }
}
