export interface UserBase {
  onionAddress: string
  peerId: string
}

export interface User {
  username: string
  onionAddress: string
  peerId: string
  dmPublicKey: string
}

export interface SendCertificatesResponse {
  certificates: string[]
}
