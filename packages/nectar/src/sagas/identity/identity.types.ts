interface CertData {
  publicKey: any
  privateKey: any
  pkcs10: any
}

export interface UserCsr {
  userCsr: string
  userKey: string
  pkcs10: CertData
}
