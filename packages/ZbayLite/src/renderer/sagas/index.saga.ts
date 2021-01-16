import { all, fork } from 'redux-saga/effects'

import { publicChannelsSaga } from './publicChannels/publicChannels.saga'
import { startConnection } from './socket/socket.saga'

export default function* root (): Generator {
  yield all([
    fork(publicChannelsSaga),
    fork(startConnection)
  ])
}
