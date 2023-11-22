export interface User {
    username: string
    onionAddress: string
    peerId: string
    dmPublicKey: string
}

export interface SendCertificatesResponse {
    certificates: string[]
}
