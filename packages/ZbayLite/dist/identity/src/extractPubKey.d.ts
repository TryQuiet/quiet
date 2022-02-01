import { Certificate, CertificationRequest } from 'pkijs';
export declare const parseCertificate: (pem: string) => Certificate;
export declare const parseCertificationRequest: (pem: string) => CertificationRequest;
export declare const keyFromCertificate: (certificate: Certificate) => string;
export declare const keyObjectFromString: (pubKeyString: string, crypto: SubtleCrypto | undefined) => Promise<CryptoKey>;
export declare const extractPubKey: (pem: string, crypto: SubtleCrypto | undefined) => Promise<CryptoKey>;
export declare const extractPubKeyString: (pem: string) => string;
