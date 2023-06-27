import path from 'path'
import os from 'os'

export enum Config {
  QUIET_DIR = '.quiet',
  PEER_ID_FILENAME = 'peerIdKey',
  ORBIT_DB_DIR = 'OrbitDB',
  IPFS_REPO_PATH = 'QuietChannels',
}

export const QUIET_DIR_PATH = path.join(os.homedir(), Config.QUIET_DIR)
