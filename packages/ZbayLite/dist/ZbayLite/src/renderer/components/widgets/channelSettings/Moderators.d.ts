import React from 'react';
import { User } from '@zbayapp/nectar';
interface ModeratorsProps {
    moderators: any[];
    users: {
        [pubKey: string]: User;
    };
    openAddModerator: () => void;
    removeModerator?: (key: string) => void;
}
export declare const Moderators: React.FC<ModeratorsProps>;
export default Moderators;
