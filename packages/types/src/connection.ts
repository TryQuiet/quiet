export type CommunityId = string

export type ConnectedPeers = string[]

export interface NetworkDataPayload {
  peer: string
  connectionDuration: number
  lastSeen: number
}

export interface PeersNetworkDataPayload {
  peers: NetworkDataPayload[]
}

export interface NetworkStats {
  peerId: string
  lastSeen: number
  connectionTime: number
}

export enum ConnectionProcessInfo {
  REGISTERING_USER_CERTIFICATE = 'Registering user certificate',
  LAUNCHING_COMMUNITY = 'Launching community',
  SPAWNING_HIDDEN_SERVICE = 'Spawning hidden service for community',
  INITIALIZING_STORAGE = 'Initializing storage',
  INITIALIZING_LIBP2P = 'Initializing libp2p',
  INITIALIZING_IPFS = 'Initializing IPFS',
  STORAGE_INITIALIZED = 'Initialized storage',
  DBS_INITIALIZED = 'Initialized DBs',
  COMMUNITY_LAUNCHED = 'Launched community',
  CHANNELS_STORED = 'Channels replicated',
  CERTIFICATES_STORED = 'Certificates replicated',

  CONNECTION_STARTED = 'Connecting process started',
  LOADING_MESSAGES = 'Loading messages',
  BACKEND_MODULES = 'Initialized backend modules',
  REGISTERING_OWNER_CERTIFICATE = 'Registering owner certificate',
  CONNECTING_TO_COMMUNITY = 'Connecting to community members via Tor',
}

export const TOR_BOOTSTRAP_COMPLETE = 'Bootstrapped 100% (done)'
