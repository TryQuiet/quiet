import { type Socket } from '../../types'
import { all, takeEvery, cancelled, throttle } from 'typed-redux-saga'
import { communitiesActions } from './communities.slice'
import { connectionActions } from '../appConnection/connection.slice'
import { createCommunitySaga } from './createCommunity/createCommunity.saga'
import { initCommunities, launchCommunitySaga } from './launchCommunity/launchCommunity.saga'
import { shareCommunitySaga } from './shareCommunity/shareCommunity.saga'
import { createNetworkSaga } from './createNetwork/createNetwork.saga'
import { createLogger } from '../../utils/logger'

const logger = createLogger('communitiesMasterSage')

export function* communitiesMasterSaga(socket: Socket): Generator {
  logger.info('communitiesMasterSaga starting')
  try {
    yield all([
      takeEvery(communitiesActions.createNetwork.type, createNetworkSaga, socket),
      takeEvery(connectionActions.torBootstrapped.type, initCommunities),
      takeEvery(communitiesActions.createCommunity.type, createCommunitySaga, socket),
      takeEvery(communitiesActions.launchCommunity.type, launchCommunitySaga, socket),
      throttle(1000 * 60 * 5, communitiesActions.uploadCommunityData.type, shareCommunitySaga, socket),
    ])
  } finally {
    logger.info('communitiesMasterSaga stopping')
    if (yield cancelled()) {
      logger.info('communitiesMasterSaga cancelled')
    }
  }
}
