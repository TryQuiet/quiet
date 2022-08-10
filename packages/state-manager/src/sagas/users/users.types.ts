export interface UserBase {
  onionAddress: string
  peerId: string
}

export interface User extends UserBase {
  username: string
  dmPublicKey: string
}

export interface SendCertificatesResponse {
  certificates: string[]
}
