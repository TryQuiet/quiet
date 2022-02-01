import React from 'react';
interface CreateChannelModalProps {
    open: boolean;
    handleClose: (event: {}, reason: 'backdropClick' | 'escapeKeyDown') => void;
}
export declare const CreateChannelModal: React.FC<CreateChannelModalProps>;
export default CreateChannelModal;
