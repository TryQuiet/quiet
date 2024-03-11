export enum LoadingPanelType {
  StartingApplication = 'Starting Quiet',
  Joining = 'Connecting to peers',
}

export type InvitationPair = {
  peerId: string
  onionAddress: string
}

export enum InvitationDataVersion {
  v1 = 'v1',
  v2 = 'v2',
}

export type InvitationDataV1 = {
  version?: InvitationDataVersion.v1
  pairs: InvitationPair[]
  psk: string
  ownerOrbitDbIdentity: string
}

export type InvitationDataV2 = {
  version?: InvitationDataVersion.v2
  cid: string
  token: string
  serverAddress: string
  inviterAddress: string
}

export type InvitationData = InvitationDataV1 | InvitationDataV2
