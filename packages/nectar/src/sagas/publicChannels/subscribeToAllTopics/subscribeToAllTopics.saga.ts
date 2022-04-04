import { select, put } from 'typed-redux-saga'
import { identitySelectors } from '../../identity/identity.selectors'
import { publicChannelsSelectors } from '../publicChannels.selectors'
import { publicChannelsActions } from '../publicChannels.slice'

export function* subscribeToAllTopicsSaga(): Generator {
  const identity = yield* select(identitySelectors.currentIdentity)
  const channels = yield* select(publicChannelsSelectors.publicChannels)
  for (const channel of channels) {
    yield* put(
      publicChannelsActions.subscribeToTopic({
        peerId: identity.peerId.id,
        channelData: channel
      })
    )
  }
}
