import { Socket } from '../../types'
import { all, takeEvery } from 'typed-redux-saga'
import { publicChannelsActions } from './publicChannels.slice'
import { createChannelSaga } from './createChannel/createChannel.saga'
import { createGeneralChannelSaga } from './createGeneralChannel/createGeneralChannel.saga'
import { sendInitialChannelMessageSaga } from './createGeneralChannel/sendInitialChannelMessage.saga'
import { sendNewUserInfoMessageSaga } from './sendNewUserInfoMessage/sendNewUserInfoMessage.saga'
import { clearUnreadChannelsSaga } from './markUnreadChannels/markUnreadChannels.saga'
import { channelsReplicatedSaga } from './channelsReplicated/channelsReplicated.saga'

export function* publicChannelsMasterSaga(socket: Socket): Generator {
  yield all([
    takeEvery(publicChannelsActions.createChannel.type, createChannelSaga, socket),
    takeEvery(publicChannelsActions.createGeneralChannel.type, createGeneralChannelSaga),
    takeEvery(publicChannelsActions.sendInitialChannelMessage.type, sendInitialChannelMessageSaga),
    takeEvery(publicChannelsActions.channelsReplicated.type, channelsReplicatedSaga),
    takeEvery(publicChannelsActions.setCurrentChannel.type, clearUnreadChannelsSaga),
    takeEvery(publicChannelsActions.sendNewUserInfoMessage.type, sendNewUserInfoMessageSaga)
  ])
}
