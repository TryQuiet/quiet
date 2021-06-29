import { Socket } from 'socket.io-client';
import { all, fork, takeEvery } from 'typed-redux-saga';
import { askForMessagesSaga } from './askForMessages/askForMessages.saga';
import { checkForMessagesSaga } from './checkForMessages/checkForMessages.saga';
import {
  getPublicChannelsSaga,
  loadPublicChannelsSaga,
} from './getPublicChannels/getPublicChannels.saga';
import { publicChannelsActions } from './publicChannels.slice';
import { subscribeForTopicSaga } from './subscribeForTopic/subscribeForTopic.saga';

export function* publicChannelsMasterSaga(socket: Socket): Generator {
  yield all([
    fork(loadPublicChannelsSaga),
    takeEvery(
      publicChannelsActions.getPublicChannels.type,
      getPublicChannelsSaga,
      socket,
    ),
    takeEvery(
      publicChannelsActions.subscribeForTopic.type,
      subscribeForTopicSaga,
      socket,
    ),
    takeEvery(
      publicChannelsActions.responseSendMessagesIds.type,
      checkForMessagesSaga,
    ),
    takeEvery(
      publicChannelsActions.askForMessages.type,
      askForMessagesSaga,
      socket,
    ),
  ]);
}
