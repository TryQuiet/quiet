import React from 'react';
interface UserListItemProps {
    name: string;
    actionName: string;
    action: () => void;
    disableConfirmation?: boolean;
    prefix?: string;
}
export declare const UserListItem: React.FC<UserListItemProps>;
export default UserListItem;
