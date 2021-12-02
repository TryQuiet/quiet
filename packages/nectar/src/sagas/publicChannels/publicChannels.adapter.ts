import { createEntityAdapter } from '@reduxjs/toolkit';
import { PublicChannel } from './publicChannels.types';
import { CommunityChannels } from './publicChannels.slice';
import { ChannelMessage } from 'src';

export const communityChannelsAdapter =
  createEntityAdapter<CommunityChannels>();

export const publicChannelsAdapter = createEntityAdapter<PublicChannel>({
  selectId: (channel) => channel.name,
});

export const channelMessagesAdapter = createEntityAdapter<ChannelMessage>();
