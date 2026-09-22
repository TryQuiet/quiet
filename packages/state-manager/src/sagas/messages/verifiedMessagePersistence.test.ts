import { MessageType, type ConsumedChannelMessage } from '@quiet/types'
import { MessagesState } from './messages.slice'
import { sanitizeMessagesPersistenceState } from './messages.transform'
import { PublicChannelsState } from '../publicChannels/publicChannels.slice'
import { sanitizePublicChannelsPersistenceState } from '../publicChannels/publicChannels.transform'

describe('verified message persistence migration', () => {
  const channelId = 'general-channel'
  const forged: ConsumedChannelMessage = {
    id: 'forged',
    channelId,
    userId: 'alice',
    teamId: 'team-id',
    createdAt: 2,
    type: MessageType.Basic,
    message: 'Mallory claiming Alice',
    verified: false,
  }
  const valid: ConsumedChannelMessage = {
    ...forged,
    id: 'valid',
    userId: 'mallory',
    createdAt: 1,
    verified: true,
  }

  test('drops rejected entities, verification state, channel cache, and newest-message UI state on rehydrate', () => {
    const messagesState = new MessagesState()
    messagesState.publicChannelsMessagesBase = {
      ids: [channelId],
      entities: {
        [channelId]: {
          channelId,
          display: 50,
          messages: {
            ids: [forged.id, valid.id],
            entities: { [forged.id]: forged, [valid.id]: valid },
          },
        },
      },
    }
    messagesState.messageVerificationStatus = {
      ids: [forged.id, valid.id],
      entities: {
        [forged.id]: { id: forged.id, isVerified: true },
        [valid.id]: { id: valid.id, isVerified: true },
      },
    }

    const publicChannelsState = new PublicChannelsState()
    publicChannelsState.channels = {
      ids: [channelId],
      entities: {
        [channelId]: {
          id: channelId,
          name: 'general',
          displayedName: 'general',
          description: 'general',
          owner: 'alice',
          timestamp: 1,
          messages: {
            ids: [forged.id, valid.id],
            entities: { [forged.id]: forged, [valid.id]: valid },
          },
        },
      },
    }
    publicChannelsState.channelsStatus = {
      ids: [channelId],
      entities: {
        [channelId]: { id: channelId, unread: true, newestMessage: forged },
      },
    }

    const sanitizedMessages = sanitizeMessagesPersistenceState(messagesState)
    const sanitizedChannels = sanitizePublicChannelsPersistenceState(publicChannelsState)

    expect(sanitizedMessages.publicChannelsMessagesBase.entities[channelId]?.messages.ids).toEqual([valid.id])
    expect(sanitizedMessages.messageVerificationStatus.ids).toEqual([valid.id])
    expect(sanitizedChannels.channels.entities[channelId]?.messages.ids).toEqual([valid.id])
    expect(sanitizedChannels.channelsStatus.entities[channelId]).toMatchObject({
      unread: false,
      newestMessage: null,
    })
  })
})
