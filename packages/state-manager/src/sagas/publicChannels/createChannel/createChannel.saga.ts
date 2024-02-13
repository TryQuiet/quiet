import { publicChannelsActions } from '../publicChannels.slice'
import { messagesActions } from '../../messages/messages.slice'
import { type PayloadAction } from '@reduxjs/toolkit'
import { apply, put } from 'typed-redux-saga'

import { type Socket, applyEmitParams } from '../../../types'
import logger from '../../../utils/logger'

import { SocketActionTypes, type CreateChannelResponse } from '@quiet/types'

const log = logger('publicChannels')

export function* createChannelSaga(
  socket: Socket,
  action: PayloadAction<ReturnType<typeof publicChannelsActions.createChannel>['payload']>
): Generator {
  log(`Creating channel ${action.payload.channel.name}`)

  const response = yield* apply(
    socket,
    socket.emitWithAck,
    applyEmitParams(SocketActionTypes.CREATE_CHANNEL, {
      channel: action.payload.channel,
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
