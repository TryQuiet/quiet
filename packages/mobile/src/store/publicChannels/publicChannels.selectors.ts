import {createSelector} from 'reselect';
import {StoreKeys} from '../store.keys';
import {selectReducer} from '../store.utils';
import {
  publicChannelMessagesAdapter,
  publicChannelsAdapter,
} from './publicChannels.adapter';

export const publicChannelsSelectors = {
  publicChannels: createSelector(
    selectReducer(StoreKeys.PublicChannels),
    reducerState => {
      return publicChannelsAdapter
        .getSelectors()
        .selectAll(reducerState.channels);
    },
  ),
  currentChannelMessages: createSelector(
    selectReducer(StoreKeys.PublicChannels),
    reducerState =>
      publicChannelMessagesAdapter
        .getSelectors()
        .selectAll(reducerState.messages),
  ),
};
