import { Contact } from '../../../store/handlers/contacts';
interface useNotificationsDataReturnType {
    currentFilter: number;
    channelData: Contact;
}
export declare const useNotificationsData: () => useNotificationsDataReturnType;
export declare const useNotificationsActions: (currentFilter: number) => {
    setChannelsNotification: () => void;
    openNotificationsTab: () => void;
};
export declare const Notifications: () => JSX.Element;
export default Notifications;
