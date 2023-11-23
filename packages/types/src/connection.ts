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

export enum ConnectionProcessInfo {
  CONNECTING_TO_COMMUNITY = 'Connecting to community members via Tor',
  REGISTERING_USER_CERTIFICATE = 'Registering user certificate',
  // SAVING_USER_CSR = 'Saving user csr',
  // WAITING_FOR_METADATA = 'Waiting for metadata',
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
  CHANNELS_REPLICATED = 'Channels replicated',
  CERTIFICATES_REPLICATED = 'Certificates replicated',
  // ____
  CONNECTION_STARTED = 'Connecting process started',
  LOADING_MESSAGES = 'Loading messages',
  BACKEND_MODULES = 'Initialized backend modules',
  // ____
  TOR_1 = 'Handshaking with a relay',
  TOR_2 = 'Loading authority key certs',
  TOR_3 = 'Loaded enough directory info to build circuits',
  TOR_4 = 'Handshake finished with a relay to build circuits',
  TOR_5 = 'Establishing a Tor circuit',
}

export const TOR_BOOTSTRAP_COMPLETE = 'Bootstrapped 100% (done)'
