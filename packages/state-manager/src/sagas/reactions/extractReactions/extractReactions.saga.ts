import { put } from 'typed-redux-saga'
import { type PayloadAction } from '@reduxjs/toolkit'
import { type MessagesLoadedPayload, MessageType, type ReactionPayload } from '@quiet/types'
import { reactionsActions } from '../reactions.slice'
import { createLogger } from '../../../utils/logger'

const logger = createLogger('extractReactionsSaga')

export function* extractReactionsSaga(action: PayloadAction<MessagesLoadedPayload>): Generator {
  const reactionMessages = action.payload.messages.filter(m => m.type === MessageType.Reaction)

  if (reactionMessages.length === 0) return

  const entries = reactionMessages.flatMap(m => {
    try {
      const payload: ReactionPayload = JSON.parse(m.message)
      return [
        {
          id: m.id,
          targetMessageId: payload.targetMessageId,
          emoji: payload.emoji,
          action: payload.action,
          userId: m.userId,
          createdAt: m.createdAt,
        },
      ]
    } catch (e) {
      logger.error('Failed to parse reaction message', m.id, e)
      return []
    }
  })

  if (entries.length > 0) {
    yield* put(reactionsActions.addReactionEntries(entries))
  }
}
