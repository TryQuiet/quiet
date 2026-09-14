import { all, fork, cancelled, takeEvery, takeLatest } from 'typed-redux-saga'

import { uptimeSaga } from './uptime/uptime.saga'
import { type Socket } from '../../types'
import { createInviteSaga } from './invite/createInvite.saga'
import { createDeviceLinkSaga } from './invite/createDeviceLink.saga'
import { connectionActions } from './connection.slice'
import { createLogger } from '../../utils/logger'
import { onConnectionProcessInfo } from './onConnectionProcessInfo/onConnectionProcessInfo.saga'
import { toggleP2PSaga } from './toggleP2P/toggleP2P.saga'
import { expireDeviceLinkSaga } from './invite/expireDeviceLink.saga'

const logger = createLogger('connectionMasterSaga')

export function* connectionMasterSaga(socket: Socket): Generator {
  logger.info('connectionMasterSaga starting')
  try {
    yield all([
      fork(uptimeSaga),
      takeEvery(connectionActions.onConnectionProcessInfo.type, onConnectionProcessInfo),
      takeEvery(connectionActions.createInvite.type, createInviteSaga, socket),
      takeLatest(connectionActions.createDeviceLink.type, createDeviceLinkSaga, socket),
      takeLatest(connectionActions.setDeviceLinkInvite.type, expireDeviceLinkSaga),
      takeEvery(connectionActions.toggleP2P.type, toggleP2PSaga, socket),
    ])
  } finally {
    logger.info('connectionMasterSaga stopping')
    if (yield cancelled()) {
      logger.info('connectionMasterSaga cancelled')
    }
  }
}
