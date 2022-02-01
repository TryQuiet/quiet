import { Time, Certificate } from 'pkijs';
export interface RootCA {
    rootObject: {
        certificate: Certificate;
        privateKey: CryptoKey;
        publicKey: CryptoKey;
    };
    rootCertString: string;
    rootKeyString: string;
}
export declare const createRootCA: (notBeforeDate: Time, notAfterDate: Time, rootCAcommonName?: string) => Promise<RootCA>;
