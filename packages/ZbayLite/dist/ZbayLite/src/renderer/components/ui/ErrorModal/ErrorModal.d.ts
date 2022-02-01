import React from 'react';
interface ErrorModalProps {
    open: boolean;
    message: string;
    traceback: string;
    handleExit: () => void;
    restartApp: () => void;
}
export declare const ErrorModal: React.FC<ErrorModalProps>;
export default ErrorModal;
