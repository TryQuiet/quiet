import { publicChannelsActions } from '../publicChannels.slice'
import { PayloadAction } from '@reduxjs/toolkit'
import logger from '../../../utils/logger'
import { put, delay, select } from 'typed-redux-saga'
import { messagesActions } from '../../messages/messages.slice'
import { MessageType, WriteMessagePayload } from '../../messages/messages.types'
import { communitiesSelectors } from '../../communities/communities.selectors'

const log = logger('publicChannels')

export function* deletedChannelSaga(
  action: PayloadAction<ReturnType<typeof publicChannelsActions.deletedChannel>['payload']>
): Generator {
  log(`Deleted channel ${action.payload.channel} saga`)

  const channelAddress = action.payload.channel
  const isGeneral = channelAddress === 'general'

  if (isGeneral) {
    yield* put(publicChannelsActions.startGeneralRecreation())
  } else {
    yield* put(publicChannelsActions.setCurrentChannel({ channelAddress: 'general' }))
  }

  yield* put(publicChannelsActions.clearMessagesCache({ channelAddress }))

  yield* put(messagesActions.deleteChannelEntry({ channelAddress }))

  yield* put(publicChannelsActions.deleteChannelFromStore({ channelAddress }))

  const ownerNickname = yield* select(communitiesSelectors.ownerNickname)

  const community = yield* select(communitiesSelectors.currentCommunity)

  const isOwner = Boolean(community?.CA)

  let message: string

  if (isGeneral) {
    if (isOwner) {
      yield* put(publicChannelsActions.createGeneralChannel())
    }
    // For better UX
    yield* delay(500)
    yield* put(publicChannelsActions.finishGeneralRecreation())
    message = `#general has been recreated by @${ownerNickname}`
  } else {
    message = `@${ownerNickname} deleted #${channelAddress}`
  }

  const payload: WriteMessagePayload = {
    type: MessageType.Info,
    message,
    channelAddress: 'general'
  }

  if (isOwner) {
    yield* put(messagesActions.sendMessage(payload))
  }
}
