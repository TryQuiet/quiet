import React from 'react';
import { Contact } from '../../../store/handlers/contacts';
declare const tabs: {
    channelInfo: () => JSX.Element;
    moderators: React.FC<{}>;
    notifications: () => JSX.Element;
};
interface ChannelSettingsModalProps {
    open: boolean;
    handleClose: () => void;
    currentTab: keyof typeof tabs;
    channel: Contact;
    isOwner: boolean;
    modalTabToOpen: keyof typeof tabs;
    setCurrentTab: (tab: keyof typeof tabs) => void;
    clearCurrentOpenTab: () => void;
}
export declare const ChannelSettingsModal: React.FC<ChannelSettingsModalProps>;
export default ChannelSettingsModal;
