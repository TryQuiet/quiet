import { createEntityAdapter } from '@reduxjs/toolkit'
import { UnreadChannelMessage } from '../publicChannels.types'

export const unreadMessagesAdapter =
    createEntityAdapter<UnreadChannelMessage>()
