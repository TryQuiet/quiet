export interface User {
  username: string
  onionAddress: string
  peerId: string
  dmPublicKey: string
  isRegistered?: boolean
  isDuplicated?: boolean
  pubKey?: string
}

export interface SendCertificatesResponse {
  certificates: string[]
}

export interface SendCsrsResponse {
  csrs: string[]
}
