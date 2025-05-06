import { jest } from '@jest/globals'

import { type DirResult } from 'tmp'
import crypto from 'crypto'
import { type PeerId, isPeerId } from '@libp2p/interface'
import { getReduxStoreFactory, prepareStore, Store } from '@quiet/state-manager'
import {
  createPeerId,
  createTmpDir,
  removeFilesFromDir,
  tmpQuietDirPath,
  generateRandomOnionAddress,
} from '../common/utils'
import { NetworkStats, type Community, type Identity } from '@quiet/types'
import { TestingModule, Test } from '@nestjs/testing'
import { FactoryGirl } from 'factory-girl'
import { TestModule } from '../common/test.module'
import { TOR_PASSWORD_PROVIDER, QUIET_DIR } from '../const'
import { Libp2pModule } from '../libp2p/libp2p.module'
import { Libp2pService } from '../libp2p/libp2p.service'
import { LocalDbModule } from '../local-db/local-db.module'
import { LocalDbService } from '../local-db/local-db.service'
import { SocketModule } from '../socket/socket.module'
import { WebSockets } from '../websocketOverTor'
import { ConnectionsManagerModule } from './connections-manager.module'
import { ConnectionsManagerService } from './connections-manager.service'
import { TorModule } from '../tor/tor.module'
import { Tor } from '../tor/tor.service'
import { TorControl } from '../tor/tor-control.service'
import { LocalDBKeys } from '../local-db/local-db.types'
import { DateTime } from 'luxon'
import waitForExpect from 'wait-for-expect'
import { CreatedLibp2pPeerId, Libp2pEvents } from '../libp2p/libp2p.types'
import { sleep } from '../common/sleep'
import { peerIdFromString } from '@libp2p/peer-id'
import { createLibp2pAddress, filterValidAddresses } from '@quiet/common'
import { createLogger } from '../common/logger'
import { ServiceState } from './connections-manager.types'
import { SocketService } from '../socket/socket.service'
import { SigChainModule } from '../auth/sigchain.service.module'
import { SigChainService } from '../auth/sigchain.service'

const logger = createLogger('connectionsManager:test')

const MANY_PEERS_COUNT = 7
const MANY_PEERS_DIALS = MANY_PEERS_COUNT // keeping this separate because we may change this behavior again in the future and it reduces test rewriting

jest.setTimeout(100_000)

let tmpDir: DirResult
let tmpAppDataPath: string

let module: TestingModule
let connectionsManagerService: ConnectionsManagerService
let tor: Tor
let localDbService: LocalDbService
let libp2pService: Libp2pService
let quietDir: string
let store: Store
let factory: FactoryGirl
let community: Community
let userIdentity: Identity
let communityRootCa: string
let peerId: CreatedLibp2pPeerId
let torControl: TorControl
let sigchainService: SigChainService

beforeEach(async () => {
  jest.clearAllMocks()
  tmpDir = createTmpDir()
  tmpAppDataPath = tmpQuietDirPath(tmpDir.name)
  store = prepareStore().store
  factory = await getReduxStoreFactory(store)
  communityRootCa = 'rootCa'
  community = await factory.create('Community', {
    rootCa: communityRootCa,
  })
  userIdentity = await factory.create('Identity', {
    communityId: community.id,
    nickname: 'john',
  })

  module = await Test.createTestingModule({
    imports: [
      TestModule,
      ConnectionsManagerModule,
      LocalDbModule,
      SocketModule,
      Libp2pModule,
      TorModule,
      SigChainModule,
    ],
  })
    .overrideProvider(TOR_PASSWORD_PROVIDER)
    .useValue({
      torPassword: 'b5e447c10b0d99e7871636ee5e0839b5',
      torHashedPassword: '16:FCFFE21F3D9138906021FAADD9E49703CC41848A95F829E0F6E1BDBE63',
    })
    .compile()
  connectionsManagerService = await module.resolve(ConnectionsManagerService)
  localDbService = await module.resolve(LocalDbService)
  sigchainService = await module.resolve(SigChainService)
  libp2pService = connectionsManagerService.libp2pService
  peerId = await createPeerId()
  tor = await module.resolve(Tor)
  await tor.init()

  const torPassword = crypto.randomBytes(16).toString('hex')
  torControl = await module.resolve(TorControl)
  torControl.authString = 'AUTHENTICATE ' + torPassword + '\r\n'
  quietDir = await module.resolve(QUIET_DIR)

  const pskBase64 = Libp2pService.generateLibp2pPSK().psk
  await sigchainService.createChain(community.name!, 'john', false)
  await sigchainService.saveChain(community.name!)
  await sigchainService.deleteChain(community.name!, false)
  await localDbService.put(LocalDBKeys.PSK, pskBase64)
  await localDbService.put(LocalDBKeys.CURRENT_COMMUNITY_ID, community.id)
  await localDbService.setCommunity(community)
  await localDbService.setIdentity(userIdentity)
})

afterEach(async () => {
  if (connectionsManagerService) {
    await connectionsManagerService.closeAllServices()
  }
  removeFilesFromDir(quietDir)
})

afterAll(async () => {
  await module.close()
})

describe('Connections manager', () => {
  it('creates network', async () => {
    logger.info('creates network')
    const spyOnDestroyHiddenService = jest.spyOn(tor, 'destroyHiddenService')
    await connectionsManagerService.init()
    const network = await connectionsManagerService.getNetworkInfo()
    expect(network.hiddenService.onionAddress.split('.')[0]).toHaveLength(56)
    expect(network.hiddenService.privateKey).toHaveLength(99)
    const peerId = peerIdFromString(network.peerId.id)
    expect(isPeerId(peerId)).toBeTruthy()
    expect(await spyOnDestroyHiddenService.mock.results[0].value).toBeTruthy()
  })
})
