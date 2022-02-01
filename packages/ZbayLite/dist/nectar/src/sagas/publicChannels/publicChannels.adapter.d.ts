import { PublicChannel } from './publicChannels.types';
import { CommunityChannels } from './publicChannels.slice';
import { ChannelMessage } from '../..';
export declare const communityChannelsAdapter: import("@reduxjs/toolkit").EntityAdapter<CommunityChannels>;
export declare const publicChannelsAdapter: import("@reduxjs/toolkit").EntityAdapter<PublicChannel>;
export declare const channelMessagesAdapter: import("@reduxjs/toolkit").EntityAdapter<ChannelMessage>;
