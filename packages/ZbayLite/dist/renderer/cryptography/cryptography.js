"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkConversation = exports.decodeMessage = exports.encodeMessage = exports.constants = void 0;
const crypto_1 = __importDefault(require("crypto"));
const debug_1 = __importDefault(require("debug"));
const log = Object.assign((0, debug_1.default)('zbay:crypto'), {
    error: (0, debug_1.default)('zbay:crypto:err')
});
exports.constants = {
    IVO: '5183666c72eec9e45183666c72eec9e4',
    prime: 'b25dbea8c5f6c0feff269f88924a932639f8d8f937d19fa5874188258a63a373',
    generator: '02'
};
const encodeMessage = (sharedSecret, message) => {
    const ENC_KEY = Buffer.from(sharedSecret.substring(0, 64), 'hex');
    const IV = Buffer.from(exports.constants.IVO, 'hex');
    console.log(ENC_KEY, 'encky');
    console.log(sharedSecret, 'shared');
    const cipher = crypto_1.default.createCipheriv('aes-256-cbc', ENC_KEY, IV);
    let encrypted = cipher.update(message, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return encrypted;
};
exports.encodeMessage = encodeMessage;
const decodeMessage = (sharedSecret, message) => {
    const ENC_KEY = Buffer.from(sharedSecret.substring(0, 64), 'hex');
    const IV = Buffer.from(exports.constants.IVO, 'hex');
    const decipher = crypto_1.default.createDecipheriv('aes-256-cbc', ENC_KEY, IV);
    const decrypted = decipher.update(message, 'base64', 'utf8');
    return decrypted + decipher.final('utf8');
};
exports.decodeMessage = decodeMessage;
/**
  checkConversation: checks if you are participant of private conversation. Returns null if we not participate in conversation.
  @param id conversation id, half of dh key, we use our private key to calculate shared secret
  @param encryptedPhrase encrypted phrase, if we are recipient of the message, we will be able to use shared secret to decode message
  @param privKey our private key, others are using public part of this key to create encryptedPhrase
 */
const checkConversation = (id, encryptedPhrase, privKey) => {
    const dh = crypto_1.default.createDiffieHellman(exports.constants.prime, 'hex', exports.constants.generator, 'hex');
    dh.setPrivateKey(privKey, 'hex');
    const sharedSecret = dh.computeSecret(id, 'hex').toString('hex');
    let decodedMessage = null;
    try {
        decodedMessage = (0, exports.decodeMessage)(sharedSecret, encryptedPhrase);
    }
    catch (err) {
        log.error('cannot decode message, its not for me or I am the author');
    }
    //
    if (decodedMessage === null || decodedMessage === void 0 ? void 0 : decodedMessage.startsWith('no panic')) {
        log('success, message decoded successfully');
        return {
            sharedSecret,
            contactPublicKey: decodedMessage.slice(8),
            conversationId: id
        };
    }
    else {
        return null;
    }
};
exports.checkConversation = checkConversation;
