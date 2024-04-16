import { put, select, call } from 'typed-redux-saga'
import { messagesActions } from '../../messages/messages.slice'
import { publicChannelsSelectors } from '../publicChannels.selectors'
import { WriteMessagePayload, MessageType, PublicChannel, PublicChannelStorage } from '@quiet/types'
import { communitiesSelectors } from '../../communities/communities.selectors'
import { identitySelectors } from '../../identity/identity.selectors'
import { identityActions } from '../../identity/identity.slice'
import { userJoinedMessage } from '@quiet/common'
import { publicChannelsActions } from '../publicChannels.slice'

export function* sendIntroductionMessageSaga(): Generator {
  const community = yield* select(communitiesSelectors.currentCommunity)
  const identity = yield* select(identitySelectors.currentIdentity)
  const generalChannel = yield* select(publicChannelsSelectors.generalChannel)

  if (community?.CA || !identity || identity.introMessageSent || !generalChannel) {
    return
  }

  const message = yield* call(userJoinedMessage, identity.nickname)
  const payload: WriteMessagePayload = {
    type: MessageType.Info,
    message,
    channelId: generalChannel.id,
  }

  yield* put(messagesActions.sendMessage(payload))
  yield* put(identityActions.updateIdentity({ ...identity, introMessageSent: true }))
}
