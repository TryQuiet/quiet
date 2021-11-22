import {  select, put } from 'typed-redux-saga';
import { publicChannelsSelectors } from '../publicChannels.selectors';
import { publicChannelsActions } from '../publicChannels.slice';
import { identitySelectors } from '../../identity/identity.selectors';

export function* subscribeForAllTopicsSaga(
  action
): Generator {
    const identity = yield* select(identitySelectors.currentIdentity)
    
    const channels = yield* select(publicChannelsSelectors.publicChannelsByCommunityId(action.payload));
    for (const channel of channels) {
      yield* put(publicChannelsActions.subscribeForTopic({peerId: identity.peerId.id, channelData: channel}));
    }
}