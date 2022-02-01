import { ChannelMessage, PublicChannel } from '@zbayapp/nectar';
export declare const isUser: (publicKey: string, halfKey: string) => boolean;
export declare const isConversation: (publicKey: string, encryptedPhrase: string) => boolean;
export declare const isDirectMessage: (msg: string) => boolean;
export declare const isMessage: (msg: ChannelMessage) => boolean;
export declare const isChannel: (channel: PublicChannel) => boolean;
declare const _default: {
    isUser: (publicKey: string, halfKey: string) => boolean;
    isMessage: (msg: ChannelMessage) => boolean;
    isDirectMessage: (msg: string) => boolean;
    isChannel: (channel: PublicChannel) => boolean;
    isConversation: (publicKey: string, encryptedPhrase: string) => boolean;
};
export default _default;
