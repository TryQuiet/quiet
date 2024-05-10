import { select, put, call } from 'typed-redux-saga'
import { publicChannelsActions } from '../publicChannels.slice'
import { identitySelectors } from '../../identity/identity.selectors'
import { DateTime } from 'luxon'
import { generateChannelId } from '@quiet/common'
import { type PublicChannel } from '@quiet/types'
import { createLogger } from '../../../utils/logger'

const logger = createLogger('createGeneralChannelSaga')

export function* createGeneralChannelSaga(): Generator {
  const identity = yield* select(identitySelectors.currentIdentity)
  if (!identity) {
    logger.error('Could not create general channel. No identity')
    return
  }
  logger.info(`Creating general channel for ${identity.nickname}`)

  const timestamp = yield* call(getChannelTimestamp)
  const id = yield* call(generateChannelId, 'general')

  const channel: PublicChannel = {
    name: 'general',
    description: 'Welcome to #general',
    owner: identity.nickname,
    id,
    timestamp,
  }

  yield* put(
    publicChannelsActions.createChannel({
      channel,
    })
  )

  yield* put(
    publicChannelsActions.setCurrentChannel({
      channelId: channel.id,
    })
  )
}

export const getChannelTimestamp = (): number => {
  return DateTime.utc().valueOf()
}
