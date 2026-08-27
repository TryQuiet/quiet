import { select, put } from 'typed-redux-saga'
import { type PayloadAction } from '@reduxjs/toolkit'
import { type Socket } from '../../../types'
import { type StoreState } from '../../store.types'
import { messagesActions } from '../../messages/messages.slice'
import { reactionsEntitySelectors, type SendReactionPayload } from '../reactions.slice'
import { identitySelectors } from '../../identity/identity.selectors'
import { MessageType, type ReactionPayload } from '@quiet/types'

export function* sendReactionSaga(socket: Socket, action: PayloadAction<SendReactionPayload>): Generator {
  const { targetMessageId, emoji, channelId } = action.payload

  const identity = yield* select(identitySelectors.currentIdentity)
  if (!identity) return

  const allEntries = yield* select((state: StoreState) => reactionsEntitySelectors.selectAll(state.Reactions.reactions))

  const lastMyEntry = allEntries
    .filter(e => e.targetMessageId === targetMessageId && e.emoji === emoji && e.userId === identity.userId)
    .sort((a, b) => b.createdAt - a.createdAt)[0]

  const reactionAction: 'add' | 'remove' = lastMyEntry?.action === 'add' ? 'remove' : 'add'

  const reactionPayload: ReactionPayload = {
    targetMessageId,
    emoji,
    action: reactionAction,
  }

  yield* put(
    messagesActions.sendMessage({
      message: JSON.stringify(reactionPayload),
      type: MessageType.Reaction,
      channelId,
    })
  )
}
