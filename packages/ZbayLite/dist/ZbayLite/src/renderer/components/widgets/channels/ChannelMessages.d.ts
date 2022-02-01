import React from 'react';
import { DisplayableMessage } from '@zbayapp/nectar';
export interface IChannelMessagesProps {
    channel: string;
    messages?: {
        count: number;
        groups: {
            [date: string]: DisplayableMessage[][];
        };
    };
    setChannelLoadingSlice?: (value: number) => void;
}
export declare const ChannelMessagesComponent: React.FC<IChannelMessagesProps>;
export default ChannelMessagesComponent;
