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
    fs.rmdirSync(dirPath, { recursive: true })
  }
}

export function fetchAbsolute(fetch: Function): Function {
  return (baseUrl: string) => (url: string, ...otherParams) =>
    url.startsWith('/') ? fetch(baseUrl + url, ...otherParams) : fetch(url, ...otherParams)
}

export const getPorts = async (): Promise<Ports> => {
  const controlPort = await getPort({ port: 9151 })
  const socksPort = await getPort({ port: 9052 })
  const libp2pHiddenService = await getPort({ port: 7788 })
  const dataServer = await getPort({ port: 4677 })
  const httpTunnelPort = await getPort({ port: 9000 })
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
  const ext = process.platform === 'win32' ? '.exe' : ''
  return path.join(torDirForPlatform(basePath), 'tor'.concat(ext))
}

export const torDirForPlatform = (basePath?: string): string => {
  let torPath
  if (!basePath) {
    basePath = process.cwd()
    torPath = path.join(basePath, 'tor', process.platform)
  } else {
    torPath = path.join(basePath, 'tor')
  }
  return torPath
}

export const createLibp2pAddress = (address: string, port: number, peerId: string, wsType: 'ws' | 'wss') => {
  return `/dns4/${address}/tcp/${port}/${wsType}/p2p/${peerId}`
}

export const createLibp2pListenAddress = (address: string, port: number, wsType: 'ws' | 'wss') => {
  return `/dns4/${address}/tcp/${port}/${wsType}`
}
