import { User } from '@quiet/state-manager'
import fs from 'fs'
import getPort from 'get-port'
import path from 'path'
import SocketIO from 'socket.io'
import logger from '../logger'
const log = logger('utils')

export interface Ports {
  socksPort: number
  libp2pHiddenService: number
  controlPort: number
  dataServer: number
  httpTunnelPort: number
}

export function createPaths(paths: string[]) {
  for (const path of paths) {
    if (!fs.existsSync(path)) {
      fs.mkdirSync(path, { recursive: true })
    }
  }
}

export function removeFilesFromDir(dirPath: string) {
  if (fs.existsSync(dirPath)) {
    log(`Removing ${dirPath}`)
    fs.rmdirSync(dirPath, { recursive: true })
  }
}

export const getFilesRecursively = (directory: string, arr: string[]) => {
  if (!fs.existsSync(directory)) return arr
  const filesInDirectory = fs.readdirSync(directory)
  for (const file of filesInDirectory) {
    const absolute = path.join(directory, file)
    if (fs.statSync(absolute).isDirectory()) {
      getFilesRecursively(absolute, arr)
    } else {
      arr.push(absolute)
    }
  }
}

export const removeFiles = (appPath: string, filename: string) => {
  if (!fs.existsSync(appPath)) return
  const IpfsAndOrbitDb = fs.readdirSync(appPath).filter(i => i.startsWith('Ipfs') || i.startsWith('OrbitDB'))
  const files = []
  IpfsAndOrbitDb.forEach((e) => {
    const directory = path.resolve(appPath, e)
    getFilesRecursively(directory, files)
  })
  files.forEach(e => {
    if (e.endsWith(filename)) {
      fs.unlinkSync(e)
    }
  })
}

export const getDirsRecursively = (directory: string, arr: string[]) => {
  if (!fs.existsSync(directory)) return arr
  const filesInDirectory = fs.readdirSync(directory)
  for (const file of filesInDirectory) {
    const absolute = path.join(directory, file)
    if (fs.statSync(absolute).isDirectory()) {
      arr.push(absolute)
      getDirsRecursively(absolute, arr)
    }
  }
}

export const removeDirs = (appPath: string, filename: string) => {
  if (!fs.existsSync(appPath)) return
  const IpfsAndOrbitDb = fs.readdirSync(appPath).filter(i => i.startsWith('Ipfs'))
  const dirs = []
  IpfsAndOrbitDb.forEach((e) => {
    const directory = path.resolve(appPath, e)
    getDirsRecursively(directory, dirs)
  })
  dirs.forEach(e => {
    if (e.endsWith(filename)) {
      fs.rmdirSync(e)
    }
  })
}

export const removeIpfsAndOrbitDbDirs = (appPath: string) => {
  if (!fs.existsSync(appPath)) return
  const ipfsDirs = fs.readdirSync(appPath).filter(i => i.startsWith('Ipfs'))
  const orbitDbDirs = fs.readdirSync(appPath).filter(i => i.startsWith('OrbitDB'))

  ipfsDirs.forEach((e) => {
    const absolute = path.join(appPath, e)
    if (fs.existsSync(absolute)) {
      fs.rmSync(absolute, { recursive: true, force: true });
    }
  })

  orbitDbDirs.forEach((e) => {
    const absolute = path.join(appPath, e)
    if (fs.existsSync(absolute)) {
      fs.rmSync(absolute, { recursive: true, force: true });
    }
  })
}

export function fetchAbsolute(fetch: Function): Function {
  return (baseUrl: string) => (url: string, ...otherParams) =>
    url.startsWith('/') ? fetch(baseUrl + url, ...otherParams) : fetch(url, ...otherParams)
}

export const getPorts = async (): Promise<Ports> => {
  const controlPort = await getPort()
  const socksPort = await getPort()
  const libp2pHiddenService = await getPort()
  const dataServer = await getPort()
  const httpTunnelPort = await getPort()
  return {
    socksPort,
    libp2pHiddenService,
    controlPort,
    dataServer,
    httpTunnelPort
  }
}

export class DummyIOServer extends SocketIO.Server {
  emit(event: string, ...args: any[]): boolean {
    log(`Emitting ${event} with args:`, args)
    return true
  }

  close() {
    log('Closing DummyIOServer')
  }
}

export const torBinForPlatform = (basePath?: string): string => {
  if (process.env.BACKEND === 'mobile') {
    return basePath
  }
  const ext = process.platform === 'win32' ? '.exe' : ''
  return path.join(torDirForPlatform(basePath), 'tor'.concat(ext))
}

export const torDirForPlatform = (basePath?: string): string => {
  let torPath
  if (!basePath) {
    basePath = path.join(process.cwd(), '..', '..', '3rd-party')
    torPath = path.join(basePath, 'tor', process.platform)
  } else {
    torPath = path.join(basePath, 'tor')
  }
  return torPath
}

export const createLibp2pAddress = (address: string, peerId: string) => {
  return `/dns4/${address}/tcp/443/wss/p2p/${peerId}`
}

export const createLibp2pListenAddress = (address: string) => {
  return `/dns4/${address}/tcp/443/wss`
}

export const getUsersAddresses = async (users: User[]): Promise<string[]> => {
  const peers = users.map(async (userData: User) => {
    return createLibp2pAddress(userData.onionAddress, userData.peerId)
  })

  return await Promise.all(peers)
}

/**
 * Compares given numbers
 *
 * @param tolerance In percentage (0.0 - 1.0)
 */
export const compare = (given: number, base: number, tolerance: number = 0) => {
  const margin = base * tolerance
  const min = base - margin
  const max = base + margin
  return given >= min && given <= max
}
