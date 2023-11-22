export interface UserData {
    username: string
    onionAddress: string
    peerId: string
    dmPublicKey: string
}

export interface User extends UserData {
    isRegistered: boolean
    isDuplicated: boolean
    pubKey: string
}

export interface SendCertificatesResponse {
    certificates: string[]
}

export interface SendCsrsResponse {
    csrs: string[]
}
