import io from 'socket.io-client'

import { all, fork } from 'redux-saga/effects'

import { publicChannelsSaga } from './publicChannels/publicChannelsSaga'

export default function* root (): Generator {
  yield all([
    fork(publicChannelsSaga)
  ])
}
