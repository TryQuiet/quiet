import { type PayloadAction } from '@reduxjs/toolkit'
import { publicChannelsActions } from '../publicChannels.slice'
import { apply, put, select } from 'typed-redux-saga'
import { type Socket, applyEmitParams } from '../../../types'
import { DeleteChannelResponse, SocketActions, SocketActionsMap } from '@quiet/types'
import { publicChannelsSelectors } from '../publicChannels.selectors'
import { createLogger } from '../../../utils/logger'

const logger = createLogger('deleteChannelSaga')

export function* deleteChannelSaga(
  socket: Socket,
  action: PayloadAction<ReturnType<typeof publicChannelsActions.deleteChannel>['payload']>
): Generator {
  const channelId = action.payload.channelId
  const generalChannel = yield* select(publicChannelsSelectors.generalChannel)
  const payloadChannel = yield* select(publicChannelsSelectors.getChannelById(channelId))

  if (generalChannel === undefined) return
  if (payloadChannel?.disabled) return

  logger.info(`Deleting channel ${channelId}`)

  const response: DeleteChannelResponse = yield* apply(
    socket,
    socket.emitWithAck,
    applyEmitParams(SocketActions.DELETE_CHANNEL, {
      channelId,
    })
  )

  logger.info(`Delete channel response: ${JSON.stringify(response)}`)

  if (response == null) {
    logger.error('Failed to delete channel')
    return
  }

  yield* put(publicChannelsActions.channelDeletionResponse(response))
}
