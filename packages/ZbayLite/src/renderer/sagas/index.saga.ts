import { all, fork } from 'redux-saga/effects'
import { directMessagesSaga } from './directMessages/directMessages.saga'

import { publicChannelsSaga } from './publicChannels/publicChannels.saga'
import { socketSaga } from './socket/socket.saga'
import { certificatesSaga } from '../store/certificates/certificates.saga'

export default function* root(): Generator {
  yield all([
    fork(publicChannelsSaga),
    fork(directMessagesSaga),
    fork(certificatesSaga),
    fork(socketSaga)
  ])
}
