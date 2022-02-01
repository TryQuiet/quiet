import React, { ReactElement } from 'react';
interface QuickActionLayoutProps {
    main: string;
    info?: string;
    children?: ReactElement;
    handleClose: (event?: {}, reason?: 'backdropClick' | 'escapeKeyDown') => void;
    buttonName?: string;
    warning?: string;
    onClick?: () => void;
}
export declare const QuickActionLayout: React.FC<QuickActionLayoutProps>;
export default QuickActionLayout;
