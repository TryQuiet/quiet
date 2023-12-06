export interface CertData {
  publicKey: any
  privateKey: any
  pkcs10: any
}

export interface UserCsr {
  userCsr: string
  userKey: string
  pkcs10: CertData
}

export interface PermsData {
  certificate: string
  privKey: string
}

export interface CreateDmKeyPairPayload {
  dmPublicKey: string
  dmPrivateKey: string
}

export interface HiddenService {
  onionAddress: string
  privateKey: string
}

export interface PeerId {
  id: string
  pubKey?: string
  privKey?: string
}

export interface DmKeys {
  publicKey: string
  privateKey: string
}

export interface Identity {
  id: string
  nickname: string
  hiddenService: HiddenService
  peerId: PeerId
  userCsr: UserCsr | null
  userCertificate: string | null
  joinTimestamp: number | null
}

export interface ChooseUsernamePayload {
  nickname: string
}

export interface CreateUserCsrPayload {
  nickname: string
  commonName: string
  peerId: string
  signAlg: string
  hashAlg: string
  existingKeyPair?: CryptoKeyPair
}

export interface SaveCertificatePayload {
  certificate: string
  permsData: PermsData
}

export interface SaveOwnerCertificatePayload extends SaveCertificatePayload {
  id: string
  peerId: string
}

export interface SuccessfullRegistrarionResponse {
  communityId: string
  payload: UserCertificatePayload
}

export interface SendUserCertificatePayload {
  communityId: string
  payload: UserCertificatePayload
}

export interface SendOwnerCertificatePayload {
  communityId: string
  payload: OwnerCertificatePayload
}

export interface UserCertificatePayload {
  certificate: string
  peers: string[]
  rootCa: string
}

interface OwnerCertificatePayload extends UserCertificatePayload {
  ownerCert: string
}

export interface StoreCertificatePayload {
  certificate: string
}

export interface SaveCsrPayload {
  csr: string
}

export interface StoreCsrPayload {
  csr: UserCsr
}
