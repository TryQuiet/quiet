import React from 'react';
interface ConfirmModalProps {
    handleClose: () => void;
    title: string;
    actionName: string;
    cancelName?: string;
    handleAction: () => void;
    open: boolean;
}
export declare const ConfirmModal: React.FC<ConfirmModalProps>;
export default ConfirmModal;
