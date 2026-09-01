import { DateTime } from 'luxon'
import { type ChannelMessage, type ConsumedChannelMessage } from '@quiet/types'

export const generateMessageId = () => Math.random().toString(36).substr(2.9)

export const getCurrentTime = () => DateTime.utc().toSeconds()

export const isMessageTransportVerified = (message: ChannelMessage, batchVerified?: boolean): boolean =>
  ((message as ConsumedChannelMessage).verified ?? batchVerified) !== false
