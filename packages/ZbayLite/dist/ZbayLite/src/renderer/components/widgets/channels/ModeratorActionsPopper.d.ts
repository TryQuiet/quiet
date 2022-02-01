import React from 'react';
import { PopperProps } from '@material-ui/core/Popper';
interface ModeratorActionsPopperProps {
    name: string;
    address: string;
    open: boolean;
    anchorEl: PopperProps['anchorEl'];
    banUser: () => void;
}
export declare const ModeratorActionsPopper: React.FC<ModeratorActionsPopperProps>;
export default ModeratorActionsPopper;
