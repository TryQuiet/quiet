import path from 'path'
import os from 'os'

export enum Config {
  QUIET_DIR = '.quiet',
  PEER_ID_FILENAME = 'peerIdKey',
  ORBIT_DB_DIR = 'OrbitDB',
  IPFS_REPO_PATH = 'Ipfs',
}

export enum TestConfig {
  QUIET_DIR = '.quiet-test-nest-backend',
  PEER_ID_FILENAME = 'peerIdKey-test-nest-backend',
  ORBIT_DB_DIR = 'OrbitDB-test-nest-backend',
  IPFS_REPO_PATH = 'Ipfs-test-nest-backend',
}

export const QUIET_DIR_PATH = path.join(os.homedir(), Config.QUIET_DIR)

export const TEST_QUIET_DIR_PATH = path.join(os.homedir(), TestConfig.QUIET_DIR)

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

export const COMMUNITY_PROVIDER = 'communityProvider'

export const IPFS_PROVIDER = 'ipfs-provider'

export const INIT_LIBP2P_PARAMS = 'libp2p-params'

export const TOR_CONTROL_PARAMS = 'tor-control-params'

// export const PEER_ID_PROVIDER = 'peer-id-provider'

export const LIB_P2P_PROVIDER = 'libp2p-provider'

export const AUTH_DATA_PROVIDER = 'auth-data-provider'

export const TOR_PARAMS_PROVIDER = 'TOR_PARAMS_PROVIDER'

export const TOR_PASSWORD_PROVIDER = 'TOR_PASSWORD_PROVIDER'

// export const PORTS_PROVIDER = 'PORTS_PROVIDER'
