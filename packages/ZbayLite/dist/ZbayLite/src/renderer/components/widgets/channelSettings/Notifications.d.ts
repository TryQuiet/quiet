import React from 'react';
import { Contact } from '../../../store/handlers/contacts';
interface NotificationsProps {
    currentFilter: number;
    setChannelsNotification: (type: number) => void;
    channelData: Contact;
    openNotificationsTab: () => void;
    openSettingsModal: () => void;
}
export declare const Notifications: React.FC<NotificationsProps>;
export default Notifications;
