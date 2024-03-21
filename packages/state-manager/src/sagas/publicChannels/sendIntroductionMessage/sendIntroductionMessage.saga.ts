import { put, select, call, delay } from 'typed-redux-saga'
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

  // FIXME: This is a quick fix for an issue that can be fixed by
  // unifying CHANNELS_STORED and CHANNELS_SUBSCRIBED events and
  // refactoring a bit. The problem is that the frontend sends a
  // message upon receiving the CHANNELS_STORED event, but the channel
  // hasn't been fully initialized/subscribed yet (it doesn't exist in
  // publicChannelsRepos on the backend so the backend fails to send
  // it). Ideally, I think we should only tell the frontend about
  // channels once they've been fully initialized. Once we fix that,
  // we can remove the following code.
  while (true) {
    const subscribedChannels = yield* select(publicChannelsSelectors.subscribedChannels)
    if (subscribedChannels.includes(generalChannel.id)) {
      break
    }
    console.error('Failed to send introduction message, general channel not subscribed. Retrying...')
    yield* delay(500)
  }

  yield* put(messagesActions.sendMessage(payload))
  yield* put(identityActions.updateIdentity({ ...identity, introMessageSent: true }))
}
