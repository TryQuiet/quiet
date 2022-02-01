import React from 'react';
interface NotificationsProps {
    userFilterType: number;
    setUserNotification: (type: number) => void;
    userSound: number;
    setUserNotificationsSound: (type: number) => void;
}
export declare const Notifications: React.FC<NotificationsProps>;
export default Notifications;
