import { type Socket } from '../../types'
import { all, takeEvery, cancelled } from 'typed-redux-saga'
import { communitiesActions } from './communities.slice'
import { createCommunitySaga } from './createCommunity/createCommunity.saga'
import { launchCommunitySaga } from './launchCommunity/launchCommunity.saga'
import { createLogger } from '../../utils/logger'
import { joinCommunitySaga } from './joinCommunity/joinCommunity.saga'

const logger = createLogger('communitiesMasterSage')

export function* communitiesMasterSaga(socket: Socket): Generator {
  logger.info('communitiesMasterSaga starting')
  try {
    yield all([
      takeEvery(communitiesActions.createCommunity.type, createCommunitySaga, socket),
      takeEvery(communitiesActions.joinCommunity.type, joinCommunitySaga, socket),
      takeEvery(communitiesActions.launchCommunity.type, launchCommunitySaga, socket),
    ])
  } finally {
    logger.info('communitiesMasterSaga stopping')
    if (yield cancelled()) {
      logger.info('communitiesMasterSaga cancelled')
    }
  }
}
