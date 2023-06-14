import path from 'path'
import os from 'os'

export enum Config {
  QUIET_DIR = '.quiet',
  PEER_ID_FILENAME = 'peerIdKey',
  ORBIT_DB_DIR = 'OrbitDB',
  IPFS_REPO_PATH = 'QuietChannels'
}

export const QUIET_DIR_PATH = path.join(os.homedir(), Config.QUIET_DIR)

export const ORBIT_DB_DIR = 'ORBIT_DB_DIR'
export const QUIET_DIR = 'QUIET_DIR'
export const IPFS_REPO_PATCH = 'ipfsRepoPath'

export const CONFIG_OPTIONS = 'configOptions'
export const SERVER_IO_PROVIDER = 'serverIoProvider'

export const EXPRESS_PROVIDER = 'expressProvider'

export const LEVEL_DB = 'levelDb'

export const DB_PATH = 'DB_PATH'

export const SOCKS_PROXY_AGENT = 'socksProxyAgent'

export const ORBIT_DB_PROVIDER = 'orbitDbProvider'


export const COMMUNITY_PROVIDER  = 'communityProvider'

export const IPFS_PROVIDER  = 'communityProvider'

const initStorageParams: InitStorageParams = {
  communityId: payload.id,
  peerId: peerId,
  onionAddress: onionAddress,
  targetPort: ports.libp2pHiddenService,
  peers: payload.peers,
  certs: payload.certs
}

const libp2pParams: InitLibp2pParams = {
  peerId: params.peerId,
  address: params.onionAddress,
  addressPort: 443,
  targetPort: params.targetPort,
  bootstrapMultiaddrs: peers,
  certs: params.certs
}