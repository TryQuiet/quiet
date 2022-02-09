import { Socket } from 'socket.io-client'
import { all, takeEvery } from 'typed-redux-saga'
import { askForMessagesSaga } from './askForMessages/askForMessages.saga'
import { checkForMessagesSaga } from './checkForMessages/checkForMessages.saga'
import { publicChannelsActions } from './publicChannels.slice'
import { subscribeToTopicSaga } from './subscribeToTopic/subscribeToTopic.saga'
import { subscribeToAllTopicsSaga } from './subscribeToAllTopics/subscribeToAllTopics.saga'
import { createChannelSaga } from './createChannel/createChannel.saga'
import { createGeneralChannelSaga } from './createGeneralChannel/createGeneralChannel.saga'
import { clearUnreadMessagesSaga, markUnreadMessagesSaga } from './markUnreadMessages/markUnreadMessages.saga'

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
      publicChannelsActions.subscribeToTopic.type,
      subscribeToTopicSaga,
      socket
    ),
    takeEvery(
      publicChannelsActions.subscribeToAllTopics.type,
      subscribeToAllTopicsSaga
    ),
    takeEvery(
      publicChannelsActions.responseSendMessagesIds.type,
      checkForMessagesSaga
    ),
    takeEvery(
      publicChannelsActions.askForMessages.type,
      askForMessagesSaga,
      socket
    ),
    takeEvery(
      publicChannelsActions.incomingMessages.type,
      markUnreadMessagesSaga
    ),
    takeEvery(
      publicChannelsActions.setCurrentChannel.type,
      clearUnreadMessagesSaga
    )
  ])
}
