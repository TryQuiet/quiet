import { apply, select } from 'typed-redux-saga'
import { type PayloadAction } from '@reduxjs/toolkit'

import { applyEmitParams, type Socket } from '../../../types'
import { communitiesSelectors } from '../communities.selectors'
import { type communitiesActions } from '../communities.slice'
import { type PermsData, SocketActionTypes } from '@quiet/types'
import { LoggerModuleName, loggingHandler } from '../../../utils/logger'

const LOGGER = loggingHandler.initLogger([LoggerModuleName.COMMUNITIES, LoggerModuleName.SAGA, 'sendCommunityCaData'])

export function* sendCommunityCaDataSaga(
  socket: Socket,
  _action: PayloadAction<ReturnType<typeof communitiesActions.sendCommunityCaData>['payload']>
): Generator {
  LOGGER.info(`Sending community CA data with payload: ${JSON.stringify(_action.payload)}`)
  const community = yield* select(communitiesSelectors.currentCommunity)

  if (!community) {
    LOGGER.error('Cannot send community CA data, no community')
    return
  }

  if (!community.CA) {
    LOGGER.error('Cannot send community CA data, no CA in community')
    return
  }

  const payload: PermsData = {
    certificate: community.CA.rootCertString,
    privKey: community.CA.rootKeyString,
  }
  yield* apply(socket, socket.emit, applyEmitParams(SocketActionTypes.SET_COMMUNITY_CA_DATA, payload))
}
