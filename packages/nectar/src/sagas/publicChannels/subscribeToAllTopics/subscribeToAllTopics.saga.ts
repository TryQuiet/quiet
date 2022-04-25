import { select, put } from 'typed-redux-saga'
import { identitySelectors } from '../../identity/identity.selectors'
import { publicChannelsSelectors } from '../publicChannels.selectors'
import { publicChannelsActions } from '../publicChannels.slice'
import { PublicChannel } from '../publicChannels.types'

export function* subscribeToAllTopicsSaga(): Generator {
  const identity = yield* select(identitySelectors.currentIdentity)
  const channels = yield* select(publicChannelsSelectors.publicChannels)
  for (const channel of channels) {
    const channelData = {
      ...channel,
      messages: undefined,
      messagesSlice: undefined
    }
    yield* put(
      publicChannelsActions.subscribeToTopic({
        peerId: identity.peerId.id,
        channelData: channelData
      })
    )
  }
}
