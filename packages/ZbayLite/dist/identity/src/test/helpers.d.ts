import { RootCA } from '../generateRootCA';
import { UserCert } from '../generateUserCertificate';
import { UserCsr } from '../requestCertificate';
export declare const userData: {
    zbayNickname: string;
    commonName: string;
    peerId: string;
    dmPublicKey: string;
    signAlg: string;
    hashAlg: string;
};
export declare function createTestRootCA(commonName?: string): Promise<RootCA>;
export declare function createTestUserCsr(): Promise<UserCsr>;
export declare function createTestUserCert(rootCert?: RootCA, userCsr?: UserCsr): Promise<UserCert>;
export declare function setupCrypto(): void;
