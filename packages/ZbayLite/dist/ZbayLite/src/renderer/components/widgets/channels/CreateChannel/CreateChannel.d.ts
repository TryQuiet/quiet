import React from 'react';
export declare const parseChannelName: (name?: string) => string;
export interface CreateChannelProps {
    open: boolean;
    createChannel: (name: string) => void;
    handleClose: () => void;
}
export declare const CreateChannelComponent: React.FC<CreateChannelProps>;
export default CreateChannelComponent;
