import React from 'react';
import { Contact } from '../../../store/handlers/contacts';
import { User } from '@zbayapp/nectar';
interface BlockedUsersProps {
    blockedUsers: User[];
    users: Contact[];
    unblock: (address: string) => void;
}
export declare const BlockedUsers: React.FC<BlockedUsersProps>;
export default BlockedUsers;
