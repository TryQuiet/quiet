import React from 'react';
export declare const formSchema: any;
interface ChannelInfoProps {
    initialValues: {
        updateChannelDescription: string;
        firstName?: string;
    };
    updateChannelSettings?: () => void;
}
export declare const ChannelInfo: React.FC<ChannelInfoProps>;
export default ChannelInfo;
