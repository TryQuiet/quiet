import { expectSaga } from 'redux-saga-test-plan'
import { combineReducers } from 'redux'
import { prepareStore, testReducers } from '../../../utils/tests/prepareStore'
import { extractReactionsSaga } from './extractReactions.saga'
import { messagesActions } from '../../messages/messages.slice'
import { reactionsActions } from '../reactions.slice'
import { MessageType } from '@quiet/types'
import { DateTime } from 'luxon'

describe('extractReactionsSaga', () => {
  test('extracts reaction entries from incoming messages', async () => {
    const targetMessageId = 'target-message-id'
    const emoji = '👍'
    const userId = 'user-123'

    const reactionMessage = {
      id: 'reaction-msg-id',
      type: MessageType.Reaction,
      message: JSON.stringify({ targetMessageId, emoji, action: 'add' }),
      createdAt: DateTime.utc().valueOf(),
      channelId: 'general',
      userId,
    }

    const { store } = prepareStore()
    const reducer = combineReducers(testReducers)

    await expectSaga(extractReactionsSaga, messagesActions.addMessages({ messages: [reactionMessage as any] }))
      .withReducer(reducer)
      .withState(store.getState())
      .put(
        reactionsActions.addReactionEntries([
          {
            id: reactionMessage.id,
            targetMessageId,
            emoji,
            action: 'add',
            userId,
            createdAt: reactionMessage.createdAt,
          },
        ])
      )
      .run()
  })

  test('ignores non-reaction messages', async () => {
    const normalMessage = {
      id: 'normal-msg-id',
      type: MessageType.Basic,
      message: 'hello',
      createdAt: DateTime.utc().valueOf(),
      channelId: 'general',
      userId: 'user-123',
    }

    const { store } = prepareStore()
    const reducer = combineReducers(testReducers)

    await expectSaga(extractReactionsSaga, messagesActions.addMessages({ messages: [normalMessage as any] }))
      .withReducer(reducer)
      .withState(store.getState())
      .not.put.actionType(reactionsActions.addReactionEntries.type)
      .run()
  })

  test('handles malformed reaction payload gracefully', async () => {
    const malformedMessage = {
      id: 'bad-reaction-id',
      type: MessageType.Reaction,
      message: 'not-valid-json{{{',
      createdAt: DateTime.utc().valueOf(),
      channelId: 'general',
      userId: 'user-123',
    }

    const { store } = prepareStore()
    const reducer = combineReducers(testReducers)

    await expectSaga(extractReactionsSaga, messagesActions.addMessages({ messages: [malformedMessage as any] }))
      .withReducer(reducer)
      .withState(store.getState())
      .not.put.actionType(reactionsActions.addReactionEntries.type)
      .run()
  })
})
