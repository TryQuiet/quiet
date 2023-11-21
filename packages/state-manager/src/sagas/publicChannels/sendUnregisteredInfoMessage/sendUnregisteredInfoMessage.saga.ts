import { put, select, call, take } from 'typed-redux-saga'
import { messagesActions } from '../../messages/messages.slice'
import { publicChannelsSelectors } from '../publicChannels.selectors'
import { WriteMessagePayload, MessageType } from '@quiet/types'
import { communitiesSelectors } from '../../communities/communities.selectors'
import { identitySelectors } from '../../identity/identity.selectors'
import { userJoinedMessage } from '@quiet/common'
import { publicChannelsActions } from '../publicChannels.slice'

export function* sendUnregisteredInfoMessage(): Generator {
  const community = yield* select(communitiesSelectors.currentCommunity)
  if (community?.CA) return

  const identity = yield* select(identitySelectors.currentIdentity)
  let generalChannel = yield* select(publicChannelsSelectors.generalChannel)

  if (!generalChannel) {
    yield* take(publicChannelsActions.channelsReplicated)
  }

  generalChannel = yield* select(publicChannelsSelectors.generalChannel)

  if (!identity || !generalChannel) return

  const message = yield* call(userJoinedMessage, identity.nickname)

  const payload: WriteMessagePayload = {
    type: MessageType.Info,
    message,
    channelId: generalChannel.id,
  }

  yield* put(messagesActions.sendMessage(payload))
}
