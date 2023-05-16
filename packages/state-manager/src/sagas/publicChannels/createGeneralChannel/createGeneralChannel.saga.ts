import { select, put, call } from 'typed-redux-saga'
import { publicChannelsActions } from '../publicChannels.slice'
import { identitySelectors } from '../../identity/identity.selectors'
import { DateTime } from 'luxon'
import logger from '../../../utils/logger'
import { PublicChannel } from '@quiet/types'

const log = logger('publicChannels')

export function* createGeneralChannelSaga(): Generator {
  const identity = yield* select(identitySelectors.currentIdentity)
  if (!identity) {
    console.error('Could not create general channel. No identity')
    return
  }
  log(`Creating general channel for ${identity.nickname}`)

  const timestamp = yield* call(getChannelTimestamp)

  const channel: PublicChannel = {
    name: 'general',
    description: 'Welcome to #general',
    owner: identity.nickname,
    address: 'general',
    timestamp: timestamp
  }

  yield* put(
    publicChannelsActions.createChannel({
      channel: channel
    })
  )

  yield* put(
    publicChannelsActions.setCurrentChannel({
      channelAddress: channel.address
    })
  )
}

export const getChannelTimestamp = (): number => {
  return DateTime.utc().valueOf()
}
