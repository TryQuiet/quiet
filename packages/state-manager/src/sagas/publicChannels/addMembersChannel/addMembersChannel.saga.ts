import { publicChannelsActions } from '../publicChannels.slice'
import { type PayloadAction } from '@reduxjs/toolkit'
import { apply, select } from 'typed-redux-saga'

import { type Socket, applyEmitParams } from '../../../types'
import { AddMembersChannelResponse, AddMembersChannelStatus, PublicChannelStorage, SocketActions } from '@quiet/types'
import { createLogger } from '../../../utils/logger'
import { publicChannelsSelectors } from '../publicChannels.selectors'

const logger = createLogger('addMembersChannelSaga')

export function* addMembersChannelSaga(
  socket: Socket,
  action: PayloadAction<ReturnType<typeof publicChannelsActions.addMembersChannel>['payload']>
): Generator {
  const channel: PublicChannelStorage | undefined = yield* select(
    publicChannelsSelectors.getChannelById(action.payload.channelId)
  )
  if (channel == null) {
    logger.warn(`Can't add members to channel ${action.payload.channelId} because the channel can't be found`)
    return
  }
  if (channel.public || channel.public == null) {
    logger.warn(`Attempted to add members to a public channel, skipping...`)
    return
  }

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
