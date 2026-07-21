import { put, select } from 'typed-redux-saga'
import { publicChannelsActions } from '../publicChannels.slice'
import { createLogger } from '../../../utils/logger'
import { CreateChannelPayload } from '@quiet/types'
import { communities } from '../../..'

const logger = createLogger('createGeneralChannelSaga')

export function* createGeneralChannelSaga(): Generator {
  const community = yield* select(communities.selectors.currentCommunity)

  if (community == null || community.teamId == null) {
    logger.error('Community must be initialized before creating general channel')
    return
  }

  yield* put(
    publicChannelsActions.createChannel({
      name: 'general',
      description: 'Welcome to #general',
      teamId: community.teamId,
      public: true,
    } as CreateChannelPayload)
  )
}
