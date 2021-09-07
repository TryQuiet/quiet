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
  id: string;
  zbayNickname: string;
  peerId: {
    id: string,
    privateKey: string

  };
  hiddenService: {
    address: string,
    privateKey: string

  }
  dmKeys: {
    publicKey: string,
    privateKey: string

  }
  userCsr: UserCsr | null;
  userCertificate: string | null;
}
