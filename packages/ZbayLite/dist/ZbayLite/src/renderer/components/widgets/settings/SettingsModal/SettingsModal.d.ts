import React from 'react';
interface SettingsModalProps {
    user: string;
    owner: boolean;
    open: boolean;
    handleClose: () => void;
}
export declare const SettingsModal: React.FC<SettingsModalProps>;
export default SettingsModal;
