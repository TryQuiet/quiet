export interface CertVerification {
    result: string;
    resultCode: number;
    resultMessage: string;
}
export declare const verifyUserCert: (rootCACert: string, userCert: string) => Promise<CertVerification>;
