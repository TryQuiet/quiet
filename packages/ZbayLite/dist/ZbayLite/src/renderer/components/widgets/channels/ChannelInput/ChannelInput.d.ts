import React from 'react';
import { INPUT_STATE } from './InputState.enum';
export interface ChannelInputProps {
    channelAddress: string;
    channelName?: string;
    channelParticipants?: Array<{
        nickname: string;
    }>;
    inputPlaceholder: string;
    inputState?: INPUT_STATE;
    initialMessage?: string;
    onChange: (arg: string) => void;
    onKeyPress: (input: string) => void;
    infoClass: string;
    setInfoClass: (arg: string) => void;
}
export declare const ChannelInputComponent: React.FC<ChannelInputProps>;
export default ChannelInputComponent;
