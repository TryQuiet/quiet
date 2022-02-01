import React, { ReactElement, ReactFragment } from 'react';
import MuiTooltip from '@material-ui/core/Tooltip';
interface TooltipProps {
    children: ReactElement;
    title?: string;
    titleHTML?: ReactFragment;
    noWrap?: boolean;
    interactive?: boolean;
    className?: string;
    placement?: 'bottom' | 'top' | 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';
    onClick?: (e: React.MouseEvent) => void;
}
export declare const Tooltip: React.FC<React.ComponentProps<typeof MuiTooltip> & TooltipProps>;
export default Tooltip;
