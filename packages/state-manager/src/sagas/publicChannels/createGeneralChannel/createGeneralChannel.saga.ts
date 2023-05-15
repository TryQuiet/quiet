import { select, put, call } from 'typed-redux-saga'
import { PayloadAction } from '@reduxjs/toolkit'
import { publicChannelsActions } from '../publicChannels.slice'
import { identitySelectors } from '../../identity/identity.selectors'
import { DateTime } from 'luxon'
import { PublicChannel } from '../publicChannels.types'
import logger from '../../../utils/logger'
import { generateChannelAddress } from '@quiet/common'

const log = logger('publicChannels')

export function* createGeneralChannelSaga(): Generator {
  const identity = yield* select(identitySelectors.currentIdentity)
  log(`Creating general channel for ${identity.nickname}`)

  const timestamp = yield* call(getChannelTimestamp)
  const address = yield* call(generateChannelAddress, 'general')
  console.log({ address })
  const channel: PublicChannel = {
    name: 'general',
    description: 'Welcome to #general',
    owner: identity.nickname,
    address,
    timestamp: timestamp
  }

  console.log({ channel })

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
