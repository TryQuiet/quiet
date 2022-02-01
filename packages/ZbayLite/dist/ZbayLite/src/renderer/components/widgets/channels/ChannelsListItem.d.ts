import React from 'react';
import { PublicChannel } from '@zbayapp/nectar';
export interface ChannelsListItemComponentProps {
    channel: PublicChannel;
    selected: boolean;
    setCurrentChannel: (name: string) => void;
}
export declare const ChannelsListItem: React.FC<ChannelsListItemComponentProps>;
export default ChannelsListItem;
