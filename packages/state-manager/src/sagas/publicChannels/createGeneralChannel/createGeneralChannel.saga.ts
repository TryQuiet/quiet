import { put, call, select } from 'typed-redux-saga'
import { publicChannelsActions } from '../publicChannels.slice'
import { generateChannelId } from '@quiet/common'
import { createLogger } from '../../../utils/logger'
import { CreateChannelPayload } from '@quiet/types'
import { communities } from '../../..'

const logger = createLogger('createGeneralChannelSaga')

export function* createGeneralChannelSaga(): Generator {
  const id = yield* call(generateChannelId, 'general')
  const community = yield* select(communities.selectors.currentCommunity)

  if (community == null || community.teamId == null) {
    logger.error('Community must be initialized before creating general channel')
    return
  }

  yield* put(
    publicChannelsActions.createChannel({
      id: id,
      name: 'general',
      description: 'Welcome to #general',
      teamId: community.teamId,
      public: true,
    } as CreateChannelPayload)
  )

  yield* put(
    publicChannelsActions.setCurrentChannel({
      channelId: id,
    })
  )
}
