import React from 'react';
import { IconButtonTypeMap } from '@material-ui/core/IconButton';
import { ExtendButtonBase, PopperPlacementType } from '@material-ui/core';
interface MenuActionProps {
    icon: string | ExtendButtonBase<IconButtonTypeMap<{}, 'button'>>;
    iconHover: string;
    children?: any;
    offset: string | number;
    placement?: PopperPlacementType;
    disabled?: boolean;
    onClick?: () => void;
}
export declare const MenuAction: React.FC<MenuActionProps>;
export default MenuAction;
