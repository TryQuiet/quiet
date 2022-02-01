import React from 'react';
interface BlockedUsersProps {
    blockedUsers: string[];
    unblockUser: (key: string) => void;
    users: {
        [pubKey: string]: {
            nickname: string;
        };
    };
}
export declare const BlockedUsers: React.FC<BlockedUsersProps>;
export default BlockedUsers;
