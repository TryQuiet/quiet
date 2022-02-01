import React from 'react';
export interface ChannelMenuActionProps {
    onInfo: () => void;
    onMute?: () => void;
    onUnmute?: () => void;
    onDelete: () => void;
    onSettings: () => void;
    mutedFlag: boolean;
    disableSettings?: boolean;
    notificationFilter: string;
    openNotificationsTab: () => void;
}
export declare const ChannelMenuActionComponent: React.FC<ChannelMenuActionProps>;
export default ChannelMenuActionComponent;
