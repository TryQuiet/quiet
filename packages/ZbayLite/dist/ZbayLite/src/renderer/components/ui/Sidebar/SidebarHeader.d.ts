import React from 'react';
interface SidebarHeaderProps {
    title: string;
    action: () => void;
    actionTitle?: () => void;
    tooltipText: string;
}
export declare const SidebarHeader: React.FC<SidebarHeaderProps>;
export default SidebarHeader;
