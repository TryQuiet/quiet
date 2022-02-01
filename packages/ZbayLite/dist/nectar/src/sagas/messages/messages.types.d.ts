import { ChannelMessage } from '../publicChannels/publicChannels.types';
export declare enum MessageType {
    Empty = -1,
    Basic = 1
}
export interface SendMessagePayload {
    peerId: string;
    message: ChannelMessage;
}
export interface PublicKeyMappingPayload {
    publicKey: string;
    cryptoKey: CryptoKey;
}
export interface MessageVerificationStatus {
    publicKey: string;
    signature: string;
    verified: boolean;
}
