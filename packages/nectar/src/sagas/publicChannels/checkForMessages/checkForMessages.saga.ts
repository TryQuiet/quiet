import { put, select } from 'typed-redux-saga';
import { publicChannelsSelectors } from '../publicChannels.selectors';
import { publicChannelsActions } from '../publicChannels.slice';

export function* checkForMessagesSaga(): Generator {
  console.log('CHECKFORMESSDSDHSDHDSDHSHDSNBD<NFKFDKFN')
  const currentChannel = yield* select(publicChannelsSelectors.currentChannel);
  const missingMessages = yield* select(
    publicChannelsSelectors.missingCurrentChannelMessages
  );
  console.log(currentChannel, 'CH'),
  console.log(missingMessages, 'MM')
  if (missingMessages.length > 0) {
    yield* put(
      publicChannelsActions.askForMessages({
        channelAddress: currentChannel,
        ids: missingMessages,
      })
    );
  }
}
