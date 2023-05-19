import { publicChannelsActions } from '../publicChannels.slice'
import { PayloadAction } from '@reduxjs/toolkit'
import logger from '../../../utils/logger'
import { put, delay, select } from 'typed-redux-saga'
import { messagesActions } from '../../messages/messages.slice'
import { communitiesSelectors } from '../../communities/communities.selectors'
import { publicChannelsSelectors } from '../publicChannels.selectors'

const log = logger('publicChannels')

export function* channelDeletionResponseSaga(
  action: PayloadAction<ReturnType<typeof publicChannelsActions.channelDeletionResponse>['payload']>
): Generator {
  log(`Deleted channel ${action.payload.channelId} saga`)

  const { channelId } = action.payload

  const generalChannel = yield* select(publicChannelsSelectors.generalChannel)

  const isGeneral = channelId === generalChannel.id

  if (isGeneral) {
    yield* put(publicChannelsActions.startGeneralRecreation())
  }

  yield* put(publicChannelsActions.clearMessagesCache({ channelId }))

  yield* put(messagesActions.deleteChannelEntry({ channelId }))

  yield* put(publicChannelsActions.deleteChannelFromStore({ channelId }))

  const community = yield* select(communitiesSelectors.currentCommunity)

  const isOwner = Boolean(community?.CA)

  if (isOwner) {
    if (isGeneral) {
      yield* delay(1000)
      yield* put(publicChannelsActions.createGeneralChannel())
    } else {
      yield* put(messagesActions.sendDeletionMessage({ channelId }))
    }
  }
}
