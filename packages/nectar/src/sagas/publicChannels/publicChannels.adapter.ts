import { createEntityAdapter } from '@reduxjs/toolkit';
import { IChannelInfo } from './publicChannels.types';

export const publicChannelsAdapter = createEntityAdapter<IChannelInfo>({
  selectId: channel => channel.name,
});
