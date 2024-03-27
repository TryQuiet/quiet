export type ServerStoredCommunityMetadata = {
  id: string
  ownerCertificate: string
  rootCa: string
  ownerOrbitDbIdentity: string
  peerList: string[]
  psk: string
}
