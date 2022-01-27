import getPort from 'get-port'
import Libp2p from 'libp2p'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { Response } from 'node-fetch'
import path from 'path'
import PeerId from 'peer-id'
import tmp from 'tmp'
import { ConnectionsManagerOptions } from '../common/types'
import { Config } from '../constants'
import { ConnectionsManager } from '../libp2p/connectionsManager'
import { createCertificatesTestHelper } from '../libp2p/tests/client-server'
import { PermsData } from '@quiet/nectar'
import WebsocketsOverTor from '../libp2p/websocketOverTor'
import { Tor } from '../torManager'
import {
  createLibp2pAddress,
  createLibp2pListenAddress,
  DummyIOServer,
  getPorts,
  Ports,
  torBinForPlatform,
  torDirForPlatform
} from './utils'
import logger from '../logger'
const log = logger('test')

export const rootPermsData: PermsData = {
  certificate:
    'MIIBNjCB3AIBATAKBggqhkjOPQQDAjASMRAwDgYDVQQDEwdaYmF5IENBMCYYEzIwMjEwNjIyMDkzMDEwLjAyNVoYDzIwMzAwMTMxMjMwMDAwWjASMRAwDgYDVQQDEwdaYmF5IENBMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEV5a3Czy+L7IfVX0FpJtSF5mi0GWGrtPqv5+CFSDPrHXijsxWdPTobR1wk8uCLP4sAgUbs/bIleCxQy41kSSyOaMgMB4wDwYDVR0TBAgwBgEB/wIBAzALBgNVHQ8EBAMCAAYwCgYIKoZIzj0EAwIDSQAwRgIhAPOzksuipKyBALt/o8O/XwsrVSzfSHXdAR4dOWThQ1lbAiEAmKqjhsmf50kxWX0ekhbAeCTjcRApXhjnslmJkIFGF2o=+lmBImw3BMNjA0FTlK5iRmVC+w/T6M04Es+yiYL608vOhx2slnoyAwHjAPBgNVHRMECDAGAQH/AgEDMAsGA1UdDwQEAwIABjAKBggqhkjOPQQDAgNIADBFAiEA+0kIz0ny/PLVERTcL0+KCpsztyA6Zuwzj05VW5NMdx0CICgdzf0lg0/2Ksl1AjSPYsy2w+Hn09PGlBnD7TiExBpx',
  privKey:
    'MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgTvNuJL0blaYq6zmFS53WmmOfHshlqn+8wNHDzo4df5WgCgYIKoZIzj0DAQehRANCAARXlrcLPL4vsh9VfQWkm1IXmaLQZYau0+q/n4IVIM+sdeKOzFZ09OhtHXCTy4Is/iwCBRuz9siV4LFDLjWRJLI5+lmBImw3BMNjA0FTlK5iRmVC+w/T6M04Es+yiYL608vOhx2sln'
}

tmp.setGracefulCleanup()

export const testBootstrapMultiaddrs = [
  createLibp2pAddress('abcd.onion', 1111, 'QmfLUJcDSLVYnNqSPSRK4mKG8MGw51m9K2v59k3yq1C8s4', 'wss')
]

export const spawnTorProcess = async (quietDirPath: string, ports?: Ports): Promise<Tor> => {
  const _ports = ports || (await getPorts())
  const torPath = torBinForPlatform()
  const libPath = torDirForPlatform()
  const tor = new Tor({
    appDataPath: quietDirPath,
    torPath: torPath,
    controlPort: _ports.controlPort,
    socksPort: _ports.socksPort,
    httpTunnelPort: _ports.httpTunnelPort,
    options: {
      env: {
        LD_LIBRARY_PATH: libPath,
        HOME: quietDirPath
      },
      detached: true
    }
  })
  return tor
}

export const createMinConnectionManager = (
  options: ConnectionsManagerOptions
): ConnectionsManager => {
  if (!options.env?.appDataPath) throw new Error('Test connection manager is lacking appDataPath!')
  return new ConnectionsManager({
    agentHost: 'localhost',
    agentPort: 2222,
    httpTunnelPort: 3333,
    io: new DummyIOServer(),
    options: {
      bootstrapMultiaddrs: testBootstrapMultiaddrs,
      ...options
    }
  })
}

export const createLibp2p = async (peerId: PeerId): Promise<Libp2p> => {
  const port = await getPort()
  const virtPort = 443
  const pems = await createCertificatesTestHelper('address1.onion', 'address2.onion')

  return ConnectionsManager.createBootstrapNode({
    peerId,
    listenAddresses: [createLibp2pListenAddress('localhost', virtPort, 'wss')],
    bootstrapMultiaddrsList: testBootstrapMultiaddrs,
    agent: new HttpsProxyAgent({ port: 1234, host: 'localhost' }),
    localAddress: createLibp2pAddress('localhost', virtPort, peerId.toB58String(), 'wss'),
    transportClass: WebsocketsOverTor,
    cert: pems.userCert,
    key: pems.userKey,
    ca: [pems.ca],
    targetPort: port
  })
}

export const createTmpDir = (): tmp.DirResult => {
  return tmp.dirSync({ mode: 0o750, prefix: 'quietTestTmp_', unsafeCleanup: true })
}

export const tmpQuietDirPath = (name: string): string => {
  return path.join(name, Config.QUIET_DIR)
}

export class TorMock {
  // TODO: extend Tor to be sure that mocked api is correct
  public async spawnHiddenService({
    virtPort,
    targetPort,
    privKey
  }: {
    virtPort: number
    targetPort: number
    privKey: string
  }): Promise<any> {
    log('TorMock.spawnHiddenService', virtPort, targetPort, privKey)
    return 'mockedOnionAddress.onion'
  }

  public async createNewHiddenService(
    virtPort: number,
    targetPort: number
  ): Promise<{ onionAddress: string; privateKey: string }> {
    log('TorMock.createNewHiddenService', virtPort, targetPort)
    return {
      onionAddress: 'mockedOnionAddress',
      privateKey: 'mockedPrivateKey'
    }
  }

  protected readonly spawnTor = resolve => {
    log('TorMock.spawnTor')
    resolve()
  }

  public kill = async (): Promise<void> => {
    log('TorMock.kill')
  }
}

export class ResponseMock extends Response {
  _json: {}
  _status: number

  public init(respStatus: number, respJson?: {}) {
    this._json = respJson
    this._status = respStatus
    return this
  }

  // @ts-expect-error
  get status() {
    return this._status
  }

  public async json() {
    return this._json
  }
}
