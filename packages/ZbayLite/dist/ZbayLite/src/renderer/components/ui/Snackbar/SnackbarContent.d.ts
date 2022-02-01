import React from 'react';
interface SnackbarContentProps {
    message: string;
    variant: 'success' | 'warning' | 'error' | 'info' | 'loading';
    onClose?: () => void;
    fullWidth?: boolean;
}
export declare const SnackbarContent: React.FC<SnackbarContentProps>;
export default SnackbarContent;
