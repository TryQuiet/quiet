import path from 'path'
import os from 'os'

export enum Config {
  ZBAY_DIR = '.zbay',
  PEER_ID_FILENAME = 'peerIdKey',
  ORBIT_DB_DIR = 'OrbitDB',
  IPFS_REPO_PATH = 'ZbayChannels'
}

export const ZBAY_DIR_PATH = path.join(os.homedir(), Config.ZBAY_DIR)
