export type CommunityId = string
export type RegistrarId = string

export type ConnectedPeers = string[]

export interface NetworkDataPayload {
  peer: string
  connectionDuration: number
  lastSeen: number
}

export interface NetworkStats {
  peerId: string
  lastSeen: number
  connectionTime: number
}
export enum TorConnectionProcessInfo {
  FETCHING = 'Fetching...',
  REGISTERING_USER_CERTIFICATE = 'Registering user certificate',
  REGISTERING_OWNER_CERTIFICATE = 'Registering owner certificate',
  LAUNCHING_COMMUNITY = 'Launching community',
  SPAWNING_HIDDEN_SERVICE = 'Spawning hidden service for community',
  INITIALIZING_STORAGE = 'Initializing storage',
  INITIALIZING_LIBP2P = 'Initializing libp2p',
  INITIALIZING_IPFS = 'Initializing IPFS',
  INITIALIZED_STORAGE = 'Initialized storage',
  LOADED_CERTIFICATES = 'Loaded certificates to memory',
  INITIALIZED_DBS = 'Initialized DBs',
  LAUNCHED_COMMUNITY = 'Launched community',
  CHANNELS_REPLICATED= 'Channels replicated',
  CERTIFICATES_REPLICATED= 'Certificates replicated',
}
