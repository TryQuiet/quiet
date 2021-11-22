import { communitiesSelectors } from '../../communities/communities.selectors';
import { put, select } from 'typed-redux-saga';
import { publicChannelsSelectors } from '../publicChannels.selectors';
import { publicChannelsActions } from '../publicChannels.slice';
import { identitySelectors } from '../../identity/identity.selectors';

export function* checkForMessagesSaga(): Generator {
  const communityId = yield* select(communitiesSelectors.currentCommunityId)
  const identity = yield* select(identitySelectors.currentIdentity)
  const currentChannel = yield* select(publicChannelsSelectors.currentChannel);
  const missingMessages = yield* select(
    publicChannelsSelectors.missingCurrentChannelMessages
  );
  if (missingMessages.length > 0) {
    yield* put(
      publicChannelsActions.askForMessages(
        {
        peerId: identity.peerId.id, 
        channelAddress: currentChannel,
        ids: missingMessages,
        communityId
      })
    );
  }
}
