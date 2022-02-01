import React, { ReactNode } from 'react';
interface MenuActionItemProps {
    onClick: (e: React.MouseEvent) => void;
    title: ReactNode;
    close?: () => void;
    closeAfterAction?: boolean;
}
export declare const MenuActionItem: React.FC<MenuActionItemProps>;
export default MenuActionItem;
