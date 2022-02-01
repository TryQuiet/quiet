import React from 'react';
interface QuitAppDialogProps {
    handleClose: () => void;
    handleQuit: () => void;
    open: boolean;
}
export declare const QuitAppDialog: React.FC<QuitAppDialogProps>;
export default QuitAppDialog;
