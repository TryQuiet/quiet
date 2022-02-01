interface useNotificationsDataReturnType {
    userFilterType: number;
    userSound: number;
}
export declare const useNotificationsData: () => useNotificationsDataReturnType;
export declare const useNotificationsActions: (userFilterType: number, sound: number) => {
    setUserNotification: () => void;
    setUserNotificationsSound: () => void;
};
export declare const Notifications: () => JSX.Element;
export default Notifications;
