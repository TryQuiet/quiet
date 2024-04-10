export interface User {
  username: string
  onionAddress: string
  peerId: string
}

export interface SendCertificatesResponse {
  certificates: string[]
}
