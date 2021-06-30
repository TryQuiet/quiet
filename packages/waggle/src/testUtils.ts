import tmp from 'tmp'
import { SocksProxyAgent } from 'socks-proxy-agent'
import { Config } from './constants'
import { getPorts } from './utils'
import { Tor } from './torManager'
import { ConnectionsManager } from './libp2p/connectionsManager'
import path from 'path'
import PeerId from 'peer-id'
import { Libp2pType } from './libp2p/customLibp2p'
tmp.setGracefulCleanup()

export interface TmpDir {
  name: string
  removeCallback: () => {}
}

export const spawnTorProcess = async (zbayDirPath: string): Promise<Tor> => {
  const ports = await getPorts()
  const torPath = `${process.cwd()}/tor/tor`
  const libPath = `${process.cwd()}/tor`
  const tor = new Tor({
    appDataPath: zbayDirPath,
    torPath: torPath,
    controlPort: ports.controlPort,
    socksPort: ports.socksPort,
    options: {
      env: {
        LD_LIBRARY_PATH: libPath,
        HOME: zbayDirPath
      },
      detached: true
    }
  })
  return tor
}

export const createMinConnectionManager = (options = {}): ConnectionsManager => {
  return new ConnectionsManager({
    port: 1111,
    host: 'abcd.onion',
    agentHost: 'localhost',
    agentPort: 2222,
    io: null,
    options: {
      ...options
    }
  })
}

export const createLibp2p = (peerId: PeerId = null): Libp2pType => {
  return ConnectionsManager.createBootstrapNode({
    peerId,
    listenAddrs: ['/dns4/localhost/tcp/1111/ws'],
    bootstrapMultiaddrsList: ['/dns4/abcd.onion/tcp/1111/ws/p2p/QmfLUJcDSLVYnNqSPSRK4mKG8MGw51m9K2v59k3yq1C8s4'],
    agent: new SocksProxyAgent({ port: 1234, host: 'localhost' }),
    localAddr: `/dns4/localhost/tcp/1111/ws/p2p/${peerId.toB58String()}`
  })
}

export const createTmpDir = (): TmpDir => {
  return tmp.dirSync({ mode: 0o750, prefix: 'zbayTestTmp_', unsafeCleanup: true })
}

export const tmpZbayDirPath = (name: string): string => {
  return path.join(name, Config.ZBAY_DIR)
}
