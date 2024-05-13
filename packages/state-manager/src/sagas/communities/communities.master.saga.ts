import { type Socket } from '../../types'
import { all, takeEvery, cancelled } from 'typed-redux-saga'
import { communitiesActions } from './communities.slice'
import { connectionActions } from '../appConnection/connection.slice'
import { createCommunitySaga } from './createCommunity/createCommunity.saga'
import { initCommunities, launchCommunitySaga } from './launchCommunity/launchCommunity.saga'
import { createNetworkSaga } from './createNetwork/createNetwork.saga'

export function* communitiesMasterSaga(socket: Socket): Generator {
  console.log('communitiesMasterSaga starting')
  try {
    yield all([
      takeEvery(communitiesActions.createNetwork.type, createNetworkSaga, socket),
      takeEvery(connectionActions.torBootstrapped.type, initCommunities),
      takeEvery(communitiesActions.createCommunity.type, createCommunitySaga, socket),
      takeEvery(communitiesActions.launchCommunity.type, launchCommunitySaga, socket),
    ])
  } finally {
    console.log('communitiesMasterSaga stopping')
    if (yield cancelled()) {
      console.log('communitiesMasterSaga cancelled')
    }
  }
}
