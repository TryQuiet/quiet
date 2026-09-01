import { MessageType, type ConsumedChannelMessage } from '@quiet/types'
import { messagesActions, messagesReducer } from './messages.slice'

describe('messages transport verification boundary', () => {
  const channelId = 'channel-id'
  const forgedMessage: ConsumedChannelMessage = {
    id: 'forged-message',
    type: MessageType.Basic,
    message: 'Mallory claiming to be Alice',
    createdAt: 1234,
    channelId,
    userId: 'alice',
    teamId: 'team-id',
    verified: false,
  }

  test('does not place a transport-rejected message in Redux', () => {
    let state = messagesReducer(undefined, messagesActions.addPublicChannelsMessagesBase({ channelId }))

    state = messagesReducer(
      state,
      messagesActions.addMessages({
        messages: [forgedMessage],
        isVerified: false,
      })
    )

    expect(state.publicChannelsMessagesBase.entities[channelId]?.messages.entities[forgedMessage.id]).toBeUndefined()
  })

  test('stores a message whose per-message verification is true even in a mixed batch', () => {
    const validMessage = { ...forgedMessage, id: 'valid-message', userId: 'mallory', verified: true }
    let state = messagesReducer(undefined, messagesActions.addPublicChannelsMessagesBase({ channelId }))

    state = messagesReducer(
      state,
      messagesActions.addMessages({
        messages: [forgedMessage, validMessage],
        isVerified: false,
      })
    )

    expect(state.publicChannelsMessagesBase.entities[channelId]?.messages.entities[forgedMessage.id]).toBeUndefined()
    expect(state.publicChannelsMessagesBase.entities[channelId]?.messages.entities[validMessage.id]).toEqual(
      validMessage
    )
  })

  test.each([
    ['no verification flags', {}],
    ['only a blanket batch flag', { isVerified: true }],
  ])('rejects a received message with %s', (_label, flags) => {
    let state = messagesReducer(undefined, messagesActions.addPublicChannelsMessagesBase({ channelId }))
    const message = { ...forgedMessage }
    delete (message as Partial<ConsumedChannelMessage>).verified

    state = messagesReducer(
      state,
      messagesActions.addMessages({
        messages: [message],
        ...flags,
      })
    )

    expect(state.publicChannelsMessagesBase.entities[channelId]?.messages.entities[message.id]).toBeUndefined()
  })

  test('allows an explicitly trusted local optimistic message', () => {
    let state = messagesReducer(undefined, messagesActions.addPublicChannelsMessagesBase({ channelId }))
    const message = { ...forgedMessage }
    delete (message as Partial<ConsumedChannelMessage>).verified

    state = messagesReducer(state, messagesActions.addMessages({ messages: [message], isLocal: true }))

    expect(state.publicChannelsMessagesBase.entities[channelId]?.messages.entities[message.id]).toEqual(message)
  })
})
