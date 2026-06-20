import { put, call, select } from 'typed-redux-saga'
import { publicChannelsActions } from '../publicChannels.slice'
import { generateChannelId } from '@quiet/common'
import { createLogger } from '../../../utils/logger'
import { CreateChannelPayload } from '@quiet/types'
import { communities } from '../../..'
import { identitySelectors } from '../../identity/identity.selectors'

const logger = createLogger('createGeneralChannelSaga')

export function* createGeneralChannelSaga(): Generator {
  const community = yield* select(communities.selectors.currentCommunity)
  const identity = yield* select(identitySelectors.currentIdentity)

  if (community == null || community.teamId == null) {
    logger.error('Community must be initialized before creating general channel')
    return
  }

  if (identity == null || identity.userId == null) {
    logger.error('Identity must be initialized before creating general channel')
    return
  }

  const id = yield* call(generateChannelId, 'general', identity.userId)

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
