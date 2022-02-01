import React from 'react';
interface OpenLinkModalProps {
    open: boolean;
    handleClose: () => void;
    handleConfirm: () => void;
    url: string;
    addToWhitelist: (url: string, dontAutoload: boolean) => void;
    setWhitelistAll: (allowAllLink: boolean) => void;
    isImage?: boolean;
}
export declare const OpenlinkModal: React.FC<OpenLinkModalProps>;
export default OpenlinkModal;
