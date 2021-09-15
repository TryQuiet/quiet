import { put } from 'typed-redux-saga';
import { select } from 'typed-redux-saga';
import { publicChannelsSelectors } from '../publicChannels.selectors';
import { publicChannelsActions } from '../publicChannels.slice';

export function* checkForMessagesSaga(): Generator {
  const currentChannel = yield* select(publicChannelsSelectors.currentChannel);
  const missingMessages = yield* select(
    publicChannelsSelectors.missingCurrentChannelMessages,
  );
  if (missingMessages.length > 0) {
    yield* put(
      publicChannelsActions.askForMessages({
        channelAddress: currentChannel,
        ids: missingMessages,
      }),
    );
  }
}
