export enum LoadingPanelType {
  StartingApplication = 'Starting Quiet',
  Joining = 'Connecting to peers',
}

export type InvitationPair = {
  peerId: string
  onionAddress: string
}
