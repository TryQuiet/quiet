import React from 'react';
interface CreateUsernameModalProps {
    open: boolean;
    handleRegisterUsername?: (payload: {
        nickname: string;
    }) => void;
    certificateRegistrationError?: string;
    certificate?: string;
    handleClose: () => void;
}
export declare const CreateUsernameModal: React.FC<CreateUsernameModalProps>;
export default CreateUsernameModal;
