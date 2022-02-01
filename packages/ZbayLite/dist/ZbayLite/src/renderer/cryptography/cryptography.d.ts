import { IConversation } from '../store/handlers/directMessages';
export declare const constants: {
    IVO: string;
    prime: string;
    generator: string;
};
export declare const encodeMessage: (sharedSecret: string, message: string) => string;
export declare const decodeMessage: (sharedSecret: string, message: string) => string;
/**
  checkConversation: checks if you are participant of private conversation. Returns null if we not participate in conversation.
  @param id conversation id, half of dh key, we use our private key to calculate shared secret
  @param encryptedPhrase encrypted phrase, if we are recipient of the message, we will be able to use shared secret to decode message
  @param privKey our private key, others are using public part of this key to create encryptedPhrase
 */
export declare const checkConversation: (id: string, encryptedPhrase: string, privKey: string) => IConversation | null;
