import { apply, select } from 'typed-redux-saga'
import { type PayloadAction } from '@reduxjs/toolkit'

import { applyEmitParams, type Socket } from '../../../types'
import { communitiesSelectors } from '../communities.selectors'
import { type communitiesActions } from '../communities.slice'
import { type PermsData, SocketActionTypes } from '@quiet/types'

export function* sendCommunityCaDataSaga(
  socket: Socket,
  _action: PayloadAction<ReturnType<typeof communitiesActions.sendCommunityCaData>['payload']>
): Generator {
  const community = yield* select(communitiesSelectors.currentCommunity)

  if (!community) {
    console.error('Cannot send community metadata, no community')
    return
  }

  if (!community.CA) {
    console.log('Cannot send community metadata, no CA in community')
    return
  }

  const payload: PermsData = {
    certificate: community.CA.rootCertString,
    privKey: community.CA.rootKeyString,
  }
  yield* apply(socket, socket.emit, applyEmitParams(SocketActionTypes.SET_COMMUNITY_CA_DATA, payload))
}
