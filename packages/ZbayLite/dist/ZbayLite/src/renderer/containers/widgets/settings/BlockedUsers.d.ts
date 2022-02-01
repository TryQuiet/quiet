/// <reference types="react" />
export declare const useBlockedUsersData: () => {
    users: any[];
    blockedUsers: any[];
};
export declare const useBlockedUsersActions: () => {
    unblock: (address: any) => (dispatch: any) => Promise<void>;
};
export declare const BlockedUsers: () => JSX.Element;
export default BlockedUsers;
