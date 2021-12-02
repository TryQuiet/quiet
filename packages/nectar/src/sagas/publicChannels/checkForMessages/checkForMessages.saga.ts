import { put, select } from 'typed-redux-saga';
import {
  currentChannel,
  missingChannelsMessages,
} from '../publicChannels.selectors';
import { publicChannelsActions } from '../publicChannels.slice';
import { currentCommunityId } from '../../communities/communities.selectors';
import { currentIdentity } from '../../identity/identity.selectors';

export function* checkForMessagesSaga(): Generator {
  const community = yield* select(currentCommunityId);
  const identity = yield* select(currentIdentity);
  const channel = yield* select(currentChannel);
  const missingMessages = yield* select(missingChannelsMessages);
  if (missingMessages.length > 0) {
    yield* put(
      publicChannelsActions.askForMessages({
        peerId: identity.peerId.id,
        communityId: community,
        channelAddress: channel,
        ids: missingMessages,
      })
    );
  }
}
