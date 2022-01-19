import { ChannelMessage } from "../publicChannels/publicChannels.types";

export enum MessageType {
  Empty = -1,
  Basic = 1,
}

export interface SendMessagePayload {
  peerId: string
  message: ChannelMessage
}
