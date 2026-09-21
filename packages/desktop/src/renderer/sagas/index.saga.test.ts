import { fork, takeEvery, takeLeading } from 'redux-saga/effects'
import { testSaga } from 'redux-saga-test-plan'
import { communities, publicChannels, watchDeviceLinkExpirySaga } from '@quiet/state-manager'

import root from './index.saga'
import { customProtocolSaga } from './invitation/customProtocol.saga'
import { closeSettingsOnChannelSwitchSaga } from './modals/modals.saga'
import { startConnectionSaga } from './socket/socket.saga'
import { socketActions } from './socket/socket.slice'

describe('desktop root saga', () => {
  it('owns device-link expiry outside the socket connection task', () => {
    testSaga(root)
      .next()
      .all([
        takeLeading(communities.actions.customProtocol.type, customProtocolSaga),
        takeEvery(socketActions.startConnection.type, startConnectionSaga),
        takeEvery(publicChannels.actions.setCurrentChannel.type, closeSettingsOnChannelSwitchSaga),
        fork(watchDeviceLinkExpirySaga),
      ])
      .next()
      .isDone()
  })
})
