import { Socket } from 'socket.io-client'
import { all, takeEvery } from 'typed-redux-saga'
import { publicChannelsActions } from './publicChannels.slice'
import { subscribeToTopicSaga } from './subscribeToTopic/subscribeToTopic.saga'
import { subscribeToAllTopicsSaga } from './subscribeToAllTopics/subscribeToAllTopics.saga'
import { createChannelSaga } from './createChannel/createChannel.saga'
import { createGeneralChannelSaga } from './createGeneralChannel/createGeneralChannel.saga'
import { sendInitialChannelMessageSaga } from './createGeneralChannel/sendInitialChannelMessage.saga'

export function* publicChannelsMasterSaga(socket: Socket): Generator {
  yield all([
    takeEvery(
      publicChannelsActions.createChannel.type,
      createChannelSaga,
      socket
    ),
    takeEvery(
      publicChannelsActions.createGeneralChannel.type,
      createGeneralChannelSaga
    ),
    takeEvery(
      publicChannelsActions.sendInitialChannelMessage.type,
      sendInitialChannelMessageSaga
    ),
    takeEvery(
      publicChannelsActions.subscribeToTopic.type,
      subscribeToTopicSaga,
      socket
    ),
    takeEvery(
      publicChannelsActions.subscribeToAllTopics.type,
      subscribeToAllTopicsSaga
    )
  ])
}
