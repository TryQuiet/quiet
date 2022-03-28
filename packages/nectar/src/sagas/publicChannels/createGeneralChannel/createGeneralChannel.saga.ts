import { select, put } from 'typed-redux-saga'
import { PayloadAction } from '@reduxjs/toolkit'
import { publicChannelsActions } from '../publicChannels.slice'
import { identitySelectors } from '../../identity/identity.selectors'
import { DateTime } from 'luxon'
import { PublicChannel } from '../publicChannels.types'

export function* createGeneralChannelSaga(
  action: PayloadAction<ReturnType<typeof publicChannelsActions.createGeneralChannel>['payload']>
): Generator {
  const identity = yield* select(identitySelectors.currentIdentity)

  const channel: PublicChannel = {
    name: 'general',
    description: 'Welcome to #general',
    owner: identity.nickname,
    address: 'general',
    timestamp: DateTime.utc().valueOf()
  }

  yield* put(
    publicChannelsActions.createChannel({
      communityId: action.payload.communityId,
      channel: channel
    })
  )

  yield* put(
    publicChannelsActions.setCurrentChannel({
      communityId: action.payload.communityId,
      channelAddress: channel.address
    })
  )
}
