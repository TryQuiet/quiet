import {createEntityAdapter} from '@reduxjs/toolkit';
import {IMessage, IChannelInfo} from './publicChannels.types';

export const publicChannelMessagesAdapter = createEntityAdapter<IMessage>();

export const publicChannelsAdapter = createEntityAdapter<IChannelInfo>({
  selectId: channel => channel.name,
});
