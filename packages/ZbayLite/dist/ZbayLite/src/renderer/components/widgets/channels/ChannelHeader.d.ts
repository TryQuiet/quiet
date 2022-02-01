import React from 'react';
import { ChannelMenuActionProps } from './ChannelMenuAction';
import { PublicChannel } from '@zbayapp/nectar';
export interface ChannelHeaderProps {
    channel: PublicChannel;
}
export declare const ChannelHeaderComponent: React.FC<ChannelHeaderProps & ChannelMenuActionProps>;
export default ChannelHeaderComponent;
