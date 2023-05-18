import { publicChannelsActions } from '../publicChannels.slice'
import { PayloadAction } from '@reduxjs/toolkit'
import logger from '../../../utils/logger'
import { put, delay, select } from 'typed-redux-saga'
import { messagesActions } from '../../messages/messages.slice'
import { communitiesSelectors } from '../../communities/communities.selectors'

const log = logger('publicChannels')

export function* channelDeletionResponseSaga(
  action: PayloadAction<ReturnType<typeof publicChannelsActions.channelDeletionResponse>['payload']>
): Generator {
  log(`Deleted channel ${action.payload.channel} saga`)

  const channelAddress = action.payload.channel
  const isGeneral = channelAddress === 'general'

  if (isGeneral) {
    yield* put(publicChannelsActions.startGeneralRecreation())
  }

  yield* put(publicChannelsActions.clearMessagesCache({ channelAddress }))

  yield* put(messagesActions.deleteChannelEntry({ channelAddress }))

  yield* put(publicChannelsActions.deleteChannelFromStore({ channelAddress }))

  const community = yield* select(communitiesSelectors.currentCommunity)

  const isOwner = Boolean(community?.CA)

  if (isOwner) {
    if (isGeneral) {
      yield* delay(1000)
      yield* put(publicChannelsActions.createGeneralChannel())
    } else {
      yield* put(messagesActions.sendDeletionMessage({ channelAddress }))
    }
  }
}
