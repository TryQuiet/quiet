import SocketIO from 'socket.io';
import { ChannelMessage } from '@zbayapp/nectar';
export declare const message: (socket: SocketIO.Server, message: any) => void;
export declare const directMessage: (socket: SocketIO.Server, message: any) => void;
export declare const loadAllMessages: (socket: SocketIO.Server, messages: ChannelMessage[], channelAddress: string, communityId: string) => void;
export declare const sendIdsToZbay: (socket: SocketIO.Server, payload: {
    ids: string[];
    channelAddress: string;
    communityId: string;
}) => void;
export declare const loadAllDirectMessages: (socket: SocketIO.Server, messages: string[], channelAddress: string) => void;
