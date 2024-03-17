import { select, put, call } from 'typed-redux-saga'
import { publicChannelsActions } from '../publicChannels.slice'
import { identitySelectors } from '../../identity/identity.selectors'
import { DateTime } from 'luxon'
import { LoggerModuleName, loggingHandler } from 'packages/state-manager/src/utils/logger'
import { generateChannelId } from '@quiet/common'
import { type PublicChannel } from '@quiet/types'

const LOGGER = loggingHandler.initLogger([
  LoggerModuleName.PUBLIC_CHANNELS,
  LoggerModuleName.SAGA,
  'createGeneralChannel',
])

export function* createGeneralChannelSaga(): Generator {
  const identity = yield* select(identitySelectors.currentIdentity)
  if (!identity) {
    LOGGER.error('Could not create general channel. No identity')
    return
  }
  LOGGER.info(`Creating general channel for ${identity.nickname}`)

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
