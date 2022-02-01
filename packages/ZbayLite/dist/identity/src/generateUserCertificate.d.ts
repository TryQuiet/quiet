import { Certificate } from 'pkijs';
export interface UserCert {
    userCertObject: {
        certificate: Certificate;
    };
    userCertString: string;
}
export declare const createUserCert: (rootCA: string, rootKey: string, userCsr: string, notBeforeDate: Date, notAfterDate: Date) => Promise<UserCert>;
