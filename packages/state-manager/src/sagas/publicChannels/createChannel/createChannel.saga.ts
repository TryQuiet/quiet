import { publicChannelsActions } from '../publicChannels.slice'
import { messagesActions } from '../../messages/messages.slice'
import { type PayloadAction } from '@reduxjs/toolkit'
import { apply, put } from 'typed-redux-saga'

import { type Socket, applyEmitParams } from '../../../types'
import { SocketActions, type CreateChannelResponse, CreateChannelPayload } from '@quiet/types'
import { createLogger } from '../../../utils/logger'

const logger = createLogger('createChannelSaga')

export function* createChannelSaga(
  socket: Socket,
  action: PayloadAction<ReturnType<typeof publicChannelsActions.createChannel>['payload']>
): Generator {
  logger.info(`Creating channel ${action.payload.name}`)

  const response = yield* apply(
    socket,
    socket.emitWithAck,
    applyEmitParams(SocketActions.CREATE_CHANNEL, {
      id: action.payload.id,
      name: action.payload.name,
      description: action.payload.description,
    })
  )

  if (response) {
    yield* put(
      messagesActions.addPublicChannelsMessagesBase({
        channelId: response.channel.id,
      })
    )
    yield* put(publicChannelsActions.addChannel(response))
    yield* put(
      publicChannelsActions.sendInitialChannelMessage({
        channelName: response.channel.name,
        channelId: response.channel.id,
      })
    )
  }
}
