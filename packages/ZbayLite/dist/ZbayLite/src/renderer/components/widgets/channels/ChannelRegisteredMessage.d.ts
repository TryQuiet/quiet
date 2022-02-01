import React from 'react';
import { DisplayableMessage } from '@zbayapp/nectar';
interface ChannelRegisteredMessageProps {
    message: DisplayableMessage;
    username: string;
    onChannelClick: () => void;
}
export declare const ChannelRegisteredMessage: React.FC<ChannelRegisteredMessageProps>;
export default ChannelRegisteredMessage;
