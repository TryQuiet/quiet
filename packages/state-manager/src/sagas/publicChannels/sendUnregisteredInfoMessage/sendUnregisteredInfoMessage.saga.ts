import { put, select } from 'typed-redux-saga'
import { messagesActions } from '../../messages/messages.slice'
import { publicChannelsSelectors } from '../publicChannels.selectors'
import { WriteMessagePayload, MessageType, InfoMessagesType } from '@quiet/types'
import { communitiesSelectors } from '../../communities/communities.selectors'
import { identitySelectors } from '../../identity/identity.selectors'

export function* sendUnregisteredInfoMessage(): Generator {
  const community = yield* select(communitiesSelectors.currentCommunity)
  const identity = yield* select(identitySelectors.currentIdentity)
  const generalChannel = yield* select(publicChannelsSelectors.generalChannel)

  if (!community?.name || !identity || !generalChannel) return
  const payload: WriteMessagePayload = {
    type: MessageType.Info,
    message: InfoMessagesType.USER_JOINED,
    channelId: generalChannel.id,
  }

  yield* put(messagesActions.sendMessage(payload))
}
