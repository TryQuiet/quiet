import React from 'react';
import { User } from '@zbayapp/nectar';
import { Dictionary } from '@reduxjs/toolkit';
interface NewMessageModalProps {
    open: boolean;
    handleClose: () => void;
    sendMessage: (payload: any) => void;
    users: Dictionary<User>;
}
export declare const NewMessageModal: React.FC<NewMessageModalProps>;
export default NewMessageModal;
