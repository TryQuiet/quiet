import { jest } from '@jest/globals'

import { type DirResult } from 'tmp'
import crypto from 'crypto'
import net from 'net'
import { isPeerId } from '@libp2p/interface'
import { getReduxStoreFactory, prepareStore, Store } from '@quiet/state-manager'
import { createPeerId, createTmpDir, generateLibp2pPSK, removeFilesFromDir, tmpQuietDirPath } from '../common/utils'
import { type Community, type Identity } from '@quiet/types'
import { TestingModule, Test } from '@nestjs/testing'
import { FactoryGirl } from 'factory-girl'
import { TestModule } from '../common/test.module'
import { TOR_PASSWORD_PROVIDER, QUIET_DIR } from '../const'
import { Libp2pService } from '../libp2p/libp2p.service'
import { LocalDbModule } from '../local-db/local-db.module'
import { LocalDbService } from '../local-db/local-db.service'
import { SocketModule } from '../socket/socket.module'
import { ConnectionsManagerModule } from './connections-manager.module'
import { ConnectionsManagerService } from './connections-manager.service'
import { TorModule } from '../tor/tor.module'
import { Tor } from '../tor/tor.service'
import { TorControl } from '../tor/tor-control.service'
import { LocalDBKeys } from '../local-db/local-db.types'
import { CreatedLibp2pPeerId } from '../libp2p/libp2p.types'
import { peerIdFromString } from '@libp2p/peer-id'
import { createLogger } from '../common/logger'
import { SigChainModule } from '../auth/sigchain.service.module'
import { SigChainService } from '../auth/sigchain.service'
import { StorageModule } from '../storage/storage.module'
import { StorageService } from '../storage/storage.service'
import { ServiceState } from './connections-manager.types'

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
let handleChainUpdateSpy: jest.SpiedFunction<any>

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
      StorageModule,
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

  sigchainService = await module.resolve(SigChainService)
  handleChainUpdateSpy = jest.spyOn(sigchainService as any, 'handleChainUpdate').mockImplementation(() => {
    logger.debug('MOCK: handling chain update')
  })
  connectionsManagerService = await module.resolve(ConnectionsManagerService)
  localDbService = await module.resolve(LocalDbService)
  libp2pService = connectionsManagerService.libp2pService
  peerId = await createPeerId()
  tor = await module.resolve(Tor)
  tor.extraTorProcessParams['--DisableNetwork'] = '1'
  await tor.init()

  const torPassword = crypto.randomBytes(16).toString('hex')
  torControl = await module.resolve(TorControl)
  torControl.authString = 'AUTHENTICATE ' + torPassword + '\r\n'
  quietDir = await module.resolve(QUIET_DIR)

  const pskBase64 = generateLibp2pPSK().psk
  const chain = await sigchainService.createChain(false)
  await sigchainService.saveChain(chain.teamId!)
  await sigchainService.deleteChain(chain.teamId!, false)
  await localDbService.put(LocalDBKeys.PSK, pskBase64)
  await localDbService.put(LocalDBKeys.CURRENT_COMMUNITY_ID, community.id)
  await localDbService.setCommunity(community)
  await localDbService.setIdentity(userIdentity)
})

afterEach(async () => {
  handleChainUpdateSpy.mockReset()
  if (connectionsManagerService) {
    await connectionsManagerService.closeAllServices()
  }
  removeFilesFromDir(quietDir)
})

afterAll(async () => {
  await module.close()
})

describe('Connections manager', () => {
  it('creates and persists a community with actual storage and libp2p while the Tor network is disabled', async () => {
    await localDbService.deleteCommunity(community.id)
    await connectionsManagerService['generatePorts']()
    const created = await connectionsManagerService.createCommunity({
      id: community.id,
      name: 'offline community',
      username: 'offline owner',
      useServer: false,
      tosAccepted: true,
    })
    const storage = await module.resolve(StorageService)
    expect(created).toBeDefined()
    expect(connectionsManagerService['communityState']).toBe(ServiceState.LAUNCHED)
    expect(storage['initialized']).toBe(true)
    expect(libp2pService.libp2pInstance?.status).toBe('started')
    expect(await localDbService.getCommunity(community.id)).toEqual(created!.community)
    expect(await storage.getIdentity(community.id)).toEqual(created!.identity)
    expect(created!.identity.networkInfo.hiddenService.onionAddress).toMatch(/^[a-z2-7]{56}\.onion$/)
    expect(tor.bootstrapped).toBe(false)
    expect(tor['registeredHiddenServices'].size).toBe(0)
    expect(tor['publishedHiddenServices'].size).toBe(0)
    expect(await torControl.getDetachedOnionServices()).toEqual(new Set())
  })

  it('releases failed creation and allows retry after a silent native Tor endpoint recovers', async () => {
    await localDbService.deleteCommunity(community.id)
    await connectionsManagerService['generatePorts']()
    const sockets = new Set<net.Socket>()
    const silentNativeTor = net.createServer(socket => {
      sockets.add(socket)
      socket.on('error', () => undefined)
      socket.once('close', () => sockets.delete(socket))
      socket.resume()
    })
    await new Promise<void>(resolve => silentNativeTor.listen(0, '127.0.0.1', resolve))
    const workingParams = torControl.torControlParams
    const payload = {
      id: community.id,
      name: 'recovered community',
      username: 'recovered owner',
      useServer: false,
      tosAccepted: true,
    }
    try {
      torControl.updateConnectionParams({
        ...workingParams,
        host: '127.0.0.1',
        port: (silentNativeTor.address() as net.AddressInfo).port,
      })
      await expect(connectionsManagerService.createCommunity(payload)).rejects.toThrow(
        'Timeout while waiting for Tor control to become available'
      )
      expect(await localDbService.getCommunity(community.id)).toBeUndefined()

      torControl.updateConnectionParams(workingParams)
      const created = await connectionsManagerService.createCommunity(payload)
      expect(created?.community.name).toBe(payload.name)
      expect(await localDbService.getCommunity(community.id)).toEqual(created!.community)
      expect(libp2pService.libp2pInstance?.status).toBe('started')
      expect(tor.bootstrapped).toBe(false)
    } finally {
      torControl.updateConnectionParams(workingParams)
      for (const socket of sockets) socket.destroy()
      await new Promise<void>(resolve => silentNativeTor.close(() => resolve()))
    }
  })

  it('gets a valid onion identity from Tor before bootstrap and releases the temporary service', async () => {
    const commands = jest.spyOn(torControl, 'sendCommand')
    const network = await connectionsManagerService.getNetworkInfo()
    expect(network.hiddenService.onionAddress.split('.')[0]).toHaveLength(56)
    expect(network.hiddenService.privateKey).toHaveLength(99)
    const peerId = peerIdFromString(network.peerId.id)
    expect(isPeerId(peerId)).toBeTruthy()
    expect(tor.bootstrapped).toBe(false)
    expect(commands.mock.calls.filter(([command]) => /^(ADD|DEL)_ONION\b/.test(command))).toEqual([
      ['ADD_ONION NEW:ED25519-V3 Port=80,127.0.0.1:1'],
    ])
    expect(await torControl.getDetachedOnionServices()).toEqual(new Set())

    // The temporary service must be gone so Tor can reuse the returned key immediately.
    const accepted = await torControl.sendCommand(
      `ADD_ONION ${network.hiddenService.privateKey} Flags=Detach Port=80,127.0.0.1:4343`
    )
    const serviceId = network.hiddenService.onionAddress.replace(/\.onion$/, '')
    expect(accepted.messages).toContain(`250-ServiceID=${serviceId}`)
    await torControl.sendCommand(`DEL_ONION ${serviceId}`)
  })
})
