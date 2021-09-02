interface CertData {
  publicKey: any;
  privateKey: any;
  pkcs10: any;
}

export interface UserCsr {
  userCsr: string;
  userKey: string;
  pkcs10: CertData;
}

export interface IIdentity {
  community: string;
  zbayNickname: string;
  commonName: string;
  peerId: string;
  dmPublicKey: string;
  dmPrivateKey: string;
  userCsr: UserCsr | null;
  userCertificate: string | null;
}
