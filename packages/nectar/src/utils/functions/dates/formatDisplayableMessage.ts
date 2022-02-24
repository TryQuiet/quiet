import { DisplayableMessage, ChannelMessage } from "../../../sagas/publicChannels/publicChannels.types"
import { formatMessageDisplayDate } from "./formatMessageDisplayDate"

export const displayableMessage = (message: ChannelMessage, nickname: string): DisplayableMessage => {
  const date = formatMessageDisplayDate(message.createdAt)
  return {
    id: message.id,
    type: message.type,
    message: message.message,
    createdAt: message.createdAt,
    date: date,
    nickname
  }
}
