declare module "pkijs" {
  export { default as SignedData, VerifyParams } from "pkijs/src/SignedData";
  export { default as EncapsulatedContentInfo } from "pkijs/src/EncapsulatedContentInfo";
  export { default as SignerInfo } from "pkijs/src/SignerInfo";
  export { default as IssuerAndSerialNumber } from "pkijs/src/IssuerAndSerialNumber";
  export { default as SignedAndUnsignedAttributes } from "pkijs/src/SignedAndUnsignedAttributes";
  export { default as Certificate } from "pkijs/src/Certificate";
  export { default as Attribute } from "pkijs/src/Attribute";
  export {
    setEngine,
    getEngine,
    getCrypto,
    getAlgorithmParameters,
    getOIDByAlgorithm,
  } from "pkijs/src/common";
  export { default as CryptoEngine } from "pkijs/src/CryptoEngine";
  export { default as CertificationRequest } from "pkijs/src/CertificationRequest";
  export { default as AttributeTypeAndValue } from "pkijs/src/AttributeTypeAndValue";
  export { default as Extension } from "pkijs/src/Extension";
  export { default as Extensions } from "pkijs/src/Extensions";
  export { default as BasicConstraints } from "pkijs/src/BasicConstraints";
  export { default as PrivateKeyInfo } from "pkijs/src/PrivateKeyInfo";
  export { default as AlgorithmIdentifier } from "pkijs/src/AlgorithmIdentifier";
  import PrivateKeyInfo from "pkijs/src/PrivateKeyInfo";
  export class PKCS8ShroudedKeyBag {
    constructor(params?: any);
    makeInternalValues(params?: any): Promise<void>;
    parseInternalValues(params?: any): Promise<void>;
    toSchema(): any;
    parsedValue?: PrivateKeyInfo;
  }
  export { default as CertificateChainValidationEngine } from "pkijs/src/CertificateChainValidationEngine";
  export { default as Time } from "pkijs/src/Time";
  export { default as ExtKeyUsage } from "pkijs/src/ExtKeyUsage";

}

