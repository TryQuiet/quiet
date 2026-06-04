import { publicChannelsActions } from '../publicChannels.slice'
import { messagesActions } from '../../messages/messages.slice'
import { type PayloadAction } from '@reduxjs/toolkit'
import { apply, put, select } from 'typed-redux-saga'

import { type Socket, applyEmitParams } from '../../../types'
import { ChannelOperationStatus, ChannelType, SocketActions, type CreateChannelResponse } from '@quiet/types'
import { createLogger } from '../../../utils/logger'
import { userProfileSelectors } from '../../users/userProfile/userProfile.selectors'
import { generateDmChannelName } from '@quiet/common'

const logger = createLogger('createChannelSaga')

export function* createChannelSaga(
  socket: Socket,
  action: PayloadAction<ReturnType<typeof publicChannelsActions.createChannel>['payload']>
): Generator {
  logger.info(`Creating ${action.payload.public === false ? 'private' : 'public'} channel ${action.payload.name}`)
  const userProfiles = yield* select(userProfileSelectors.userProfiles)
  const me = yield* select(userProfileSelectors.myUserProfile)

  const response: CreateChannelResponse = yield* apply(
    socket,
    socket.emitWithAck,
    applyEmitParams(SocketActions.CREATE_CHANNEL, action.payload)
  )

  if (response == null) {
    logger.error('Create channel returned a null response')
    return
  }

  if (response.status === ChannelOperationStatus.FAILED) {
    logger.error('Failed to create channel')
    return
  }

  if (response.channel == null) {
    logger.error(
      `Create channel response wasn't marked as ${ChannelOperationStatus.FAILED} but had a new channel object`
    )
    return
  }

  // we got a valid, successful response
  yield* put(
    messagesActions.addPublicChannelsMessagesBase({
      channelId: response.channel.id,
    })
  )
  const displayedName =
    response.channel.type == null || response.channel.type === ChannelType.CHANNEL
      ? response.channel.name
      : generateDmChannelName(response.channel.memberIds, userProfiles, me)
  yield* put(
    publicChannelsActions.addChannel({
      ...response,
      displayedName,
    })
  )
  yield* put(
    publicChannelsActions.sendInitialChannelMessage({
      channelName: response.channel.name,
      channelId: response.channel.id,
      type: action.payload.type,
    })
  )
}
