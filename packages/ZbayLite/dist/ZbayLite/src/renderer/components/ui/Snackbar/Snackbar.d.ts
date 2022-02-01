import React from 'react';
interface SnackbarProps {
    open: boolean;
    message: string;
    variant: 'success' | 'warning' | 'error' | 'info' | 'loading';
    position?: {
        vertical: 'bottom' | 'top';
        horizontal: 'left' | 'right';
    };
    fullWidth?: boolean;
    onClose?: () => void;
}
export declare const Snackbar: React.FC<SnackbarProps>;
export default Snackbar;
