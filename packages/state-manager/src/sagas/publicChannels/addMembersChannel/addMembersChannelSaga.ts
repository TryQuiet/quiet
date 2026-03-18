import { publicChannelsActions } from '../publicChannels.slice'
import { type PayloadAction } from '@reduxjs/toolkit'
import { apply } from 'typed-redux-saga'

import { type Socket, applyEmitParams } from '../../../types'
import { AddMembersChannelResponse, AddMembersChannelStatus, SocketActions } from '@quiet/types'
import { createLogger } from '../../../utils/logger'

const logger = createLogger('addMembersChannelSaga')

export function* addMembersChannelSaga(
  socket: Socket,
  action: PayloadAction<ReturnType<typeof publicChannelsActions.addMembersChannel>['payload']>
): Generator {
  logger.info(
    `Adding ${action.payload.memberIds.length} users to private channel`,
    action.payload.channelId,
    action.payload.channelName
  )

  const response: AddMembersChannelResponse = yield* apply(
    socket,
    socket.emitWithAck,
    applyEmitParams(SocketActions.ADD_MEMBERS_TO_CHANNEL, action.payload)
  )

  if (response) {
    if (response.status !== AddMembersChannelStatus.SUCCESS) {
      logger.error(
        `Failed to add ${action.payload.memberIds.length} members to private channel`,
        response.status,
        action.payload.channelId,
        action.payload.channelName
      )
      return
    }
    logger.info(
      `Successfully added ${action.payload.memberIds.length} members to private channel`,
      action.payload.channelId,
      action.payload.channelName
    )
  } else {
    logger.error(
      `Failed to add ${action.payload.memberIds.length} members to private channel - no response from backend`,
      action.payload.channelId,
      action.payload.channelName
    )
  }
}
