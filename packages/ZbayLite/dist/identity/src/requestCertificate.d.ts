import { CertificationRequest } from 'pkijs';
interface CertData {
    publicKey: CryptoKey;
    privateKey: CryptoKey;
    pkcs10: CertificationRequest;
}
export interface UserCsr {
    userCsr: string;
    userKey: string;
    pkcs10: CertData;
}
export declare const createUserCsr: ({ zbayNickname, commonName, peerId, dmPublicKey }: {
    zbayNickname: string;
    commonName: string;
    peerId: string;
    dmPublicKey: string;
    signAlg: string;
    hashAlg: string;
}) => Promise<UserCsr>;
export {};
