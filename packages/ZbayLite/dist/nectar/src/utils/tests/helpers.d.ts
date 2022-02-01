import { RootCA, UserCsr, UserCert } from '@zbayapp/identity';
import { PeerId } from '../../sagas/identity/identity.types';
export declare const createRootCertificateTestHelper: (commonName: any) => Promise<RootCA>;
export declare const createUserCertificateTestHelper: (user: {
    zbayNickname: string;
    commonName: string;
    peerId: string;
}, rootCA: Pick<RootCA, 'rootCertString' | 'rootKeyString'>) => Promise<{
    userCert: UserCert;
    userCsr: UserCsr;
}>;
export declare const createPeerIdTestHelper: () => PeerId;
export declare const createMessageSignatureTestHelper: (message: string, certificate: string, userKey: string) => Promise<{
    signature: string;
    pubKey: string;
}>;
declare const _default: {
    createRootCertificateTestHelper: (commonName: any) => Promise<RootCA>;
    createUserCertificateTestHelper: (user: {
        zbayNickname: string;
        commonName: string;
        peerId: string;
    }, rootCA: Pick<RootCA, "rootCertString" | "rootKeyString">) => Promise<{
        userCert: UserCert;
        userCsr: UserCsr;
    }>;
    createPeerIdTestHelper: () => PeerId;
    createMessageSignatureTestHelper: (message: string, certificate: string, userKey: string) => Promise<{
        signature: string;
        pubKey: string;
    }>;
};
export default _default;
