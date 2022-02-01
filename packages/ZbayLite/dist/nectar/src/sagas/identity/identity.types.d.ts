export interface CertData {
    publicKey: any;
    privateKey: any;
    pkcs10: any;
}
export interface UserCsr {
    userCsr: string;
    userKey: string;
    pkcs10: CertData;
}
export interface CreateDmKeyPairPayload {
    dmPublicKey: string;
    dmPrivateKey: string;
}
export interface HiddenService {
    onionAddress: string;
    privateKey: string;
}
export interface PeerId {
    id: string;
    pubKey?: string;
    privKey?: string;
}
export interface DmKeys {
    publicKey: string;
    privateKey: string;
}
export interface Identity {
    id: string;
    zbayNickname: string;
    hiddenService: HiddenService;
    dmKeys: DmKeys;
    peerId: PeerId;
    userCsr: UserCsr | null;
    userCertificate: string | null;
}
export interface CreateUserCsrPayload {
    zbayNickname: string;
    commonName: string;
    peerId: string;
    dmPublicKey: string;
    signAlg: string;
    hashAlg: string;
}
export interface UpdateUsernamePayload {
    communityId: string;
    nickname: string;
}
export interface RegisterUserCertificatePayload {
    id: string;
    userCsr: string;
    serviceAddress: string;
}
export interface PermsData {
    certificate: string;
    privKey: string;
}
export interface RegisterOwnerCertificatePayload {
    id: string;
    userCsr: string;
    permsData: PermsData;
}
export interface SaveCertificatePayload {
    certificate: string;
    rootPermsData: PermsData;
}
export interface SaveOwnerCertificatePayload {
    id: string;
    peerId: string;
    certificate: string;
    permsData: PermsData;
}
export interface StoreUserCertificatePayload {
    userCertificate: string;
    communityId: string;
}
export interface StoreUserCsrPayload {
    userCsr: UserCsr;
    communityId: string;
    registrarAddress: string;
}
