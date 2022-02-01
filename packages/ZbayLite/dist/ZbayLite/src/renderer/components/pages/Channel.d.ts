import React from 'react';
import { useModal } from '../../containers/hooks';
import { DisplayableMessage, PublicChannel, Identity } from '@zbayapp/nectar';
export interface ChannelComponentProps {
    user: Identity;
    channel: PublicChannel;
    channelSettingsModal: ReturnType<typeof useModal>;
    channelInfoModal: ReturnType<typeof useModal>;
    messages: {
        count: number;
        groups: {
            [date: string]: DisplayableMessage[][];
        };
    };
    setChannelLoadingSlice: (value: number) => void;
    onDelete: () => void;
    onInputChange: (value: string) => void;
    onInputEnter: (message: string) => void;
    mutedFlag: boolean;
    disableSettings?: boolean;
    notificationFilter: string;
    openNotificationsTab: () => void;
}
export declare const ChannelComponent: React.FC<ChannelComponentProps>;
export default ChannelComponent;
