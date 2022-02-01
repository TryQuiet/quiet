/// <reference types="node" />
import { ObjectIdentifier } from 'asn1js';
import { CertificationRequest, Certificate } from 'pkijs';
export declare enum CertFieldsTypes {
    commonName = "2.5.4.3",
    nickName = "1.3.6.1.4.1.50715.2.1",
    peerId = "1.3.6.1.2.1.15.3.1.1",
    dmPublicKey = "1.2.840.113549.1.9.12"
}
export declare enum ExtensionsTypes {
    basicConstr = "2.5.29.19",
    keyUsage = "2.5.29.15",
    extKeyUsage = "2.5.29.37"
}
export declare function hexStringToArrayBuffer(str: string): ArrayBuffer;
export declare function arrayBufferToHexString(buffer: Buffer): string;
export declare const generateKeyPair: ({ signAlg }: {
    signAlg: string;
}) => Promise<CryptoKeyPair>;
export declare const formatPEM: (pemString: string) => string;
export declare const loadCertificate: (rootCert: string) => Certificate;
export declare const loadPrivateKey: (rootKey: string, signAlg: string) => Promise<CryptoKey>;
export declare const loadCSR: (csr: string) => Promise<CertificationRequest>;
export declare const getCertFieldValue: (cert: Certificate, fieldType: CertFieldsTypes | ObjectIdentifier) => string | null;
export declare const getReqFieldValue: (csr: CertificationRequest, fieldType: CertFieldsTypes | ObjectIdentifier) => string | null;
