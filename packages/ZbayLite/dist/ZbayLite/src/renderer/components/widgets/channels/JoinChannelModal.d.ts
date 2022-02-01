import React from 'react';
import { User, PublicChannel } from '@zbayapp/nectar';
import { Dictionary } from '@reduxjs/toolkit';
interface JoinChannelModalProps {
    open: boolean;
    handleClose: () => void;
    joinChannel: (channel: PublicChannel) => void;
    publicChannels: PublicChannel[];
    users: Dictionary<User>;
}
export declare const JoinChannelModal: React.FC<JoinChannelModalProps>;
export default JoinChannelModal;
