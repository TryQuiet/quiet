import { type PayloadAction } from '@reduxjs/toolkit'
import { type Socket, applyEmitParams } from '../../../types'
import { apply, put, select } from 'typed-redux-saga'
import { communitiesSelectors } from '../../communities/communities.selectors'
import { messagesActions } from '../messages.slice'
import { filesActions } from '../../files/files.slice'
import { SocketActionTypes, type MessagesLoadedPayload } from '@quiet/types'

export function* getMessagesSaga(
  socket: Socket,
  action: PayloadAction<ReturnType<typeof messagesActions.getMessages>['payload']>
): Generator {
  const response = yield* apply(
    socket,
    socket.emitWithAck,
    applyEmitParams(SocketActionTypes.GET_MESSAGES, action.payload)
  )
  const communityId = yield* select(communitiesSelectors.currentCommunityId)

  if (response) {
    yield* put(messagesActions.addMessages(response))
  }
  yield* put(filesActions.checkForMissingFiles(communityId))
}
