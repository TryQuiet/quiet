import { jest } from '@jest/globals'
import { memory } from '@libp2p/memory'
import { Test, TestingModule } from '@nestjs/testing'
import { randomUUID } from 'crypto'
import getPort from 'get-port'
import waitForExpect from 'wait-for-expect'

import { p2pAddressesToPairs } from '@quiet/common'
import {
  ChannelMessage,
  ChannelOperationStatus,
  Community,
  ConsumedChannelMessage,
  type DeviceInvitationDataV5,
  type DeviceLinkInvite,
  type InvitationDataV5,
  InvitationDataVersion,
  InvitationKind,
  type InvitationPair,
  type InviteResultWithSalt,
  MessageType,
  PublicChannel,
  type ResponseInvitePayload,
  SocketActions,
} from '@quiet/types'
import { AdmissionCoordinator } from '../../src/nest/admission/admission-coordinator.service'
import {
  AdmissionKind,
  AdmissionTransport,
  type CommunityAdmissionMetadata,
} from '../../src/nest/admission/admission.types'
import { SigChainService } from '../../src/nest/auth/sigchain.service'
import { RoleName } from '../../src/nest/auth/services/roles/roles'
import { CaptchaService } from '../../src/nest/captcha/captcha.service'
import { TestModule } from '../../src/nest/common/test.module'
import { QSS_ALLOWED, QSS_ENDPOINT, TOR_PASSWORD_PROVIDER } from '../../src/nest/const'
import { ConnectionsManagerModule } from '../../src/nest/connections-manager/connections-manager.module'
import { ConnectionsManagerService } from '../../src/nest/connections-manager/connections-manager.service'
import { ServiceState } from '../../src/nest/connections-manager/connections-manager.types'
import { JoinStatus } from '../../src/nest/libp2p/libp2p.auth'
import { Libp2pService, Libp2pState } from '../../src/nest/libp2p/libp2p.service'
import { Libp2pEvents } from '../../src/nest/libp2p/libp2p.types'
import { LocalDbService } from '../../src/nest/local-db/local-db.service'
import { QSSAuthConnectionManager } from '../../src/nest/qss/qss-auth-conn-manager.service'
import { QSSAuthConnStatus } from '../../src/nest/qss/qss.const'
import { QSSClient } from '../../src/nest/qss/qss.client'
import { QSSService } from '../../src/nest/qss/qss.service'
import { QSSSyncManager } from '../../src/nest/qss/qss-sync-manager.service'
import {
  CommunityOperationStatus,
  CommunitySignInMessage,
  LogEntrySyncMessage,
  LogEntrySyncResponseMessage,
  QSSOperationResult,
  WebsocketEvents,
} from '../../src/nest/qss/qss.types'
import { SocketService } from '../../src/nest/socket/socket.service'
import { ChannelStore } from '../../src/nest/storage/channels/channel.store'
import { OrbitDbService } from '../../src/nest/storage/orbitDb/orbitDb.service'
import { type LogUpdate } from '../../src/nest/storage/orbitDb/orbitdb.types'
import { StorageService } from '../../src/nest/storage/storage.service'
import { StorageEvents } from '../../src/nest/storage/storage.types'
import { Tor } from '../../src/nest/tor/tor.service'

const RUN_QSS_MODULE_INTEGRATION =
  process.env.QSS_MODULE_INTEGRATION === '1' || process.env.RUN_QSS_INTEGRATION_TESTS === 'true'
const QSS_INTEGRATION_ENDPOINT =
  process.env.QSS_INTEGRATION_ENDPOINT ?? process.env.QSS_ENDPOINT ?? 'http://localhost:3003'
const HCAPTCHA_TEST_TOKEN = '10000000-aaaa-bbbb-cccc-000000000001'
const maybeDescribe = RUN_QSS_MODULE_INTEGRATION ? describe : describe.skip
const ONION_ALPHABET = 'abcdefghijklmnopqrstuvwxyz234567'

interface QSSIntegrationPeer {
  name: string
  module: TestingModule
  connectionsManager: ConnectionsManagerService
  admissionCoordinator: AdmissionCoordinator
  qssService: QSSService
  qssClient: QSSClient
  qssAuthConnManager: QSSAuthConnectionManager
  qssSyncManager: QSSSyncManager
  sigChainService: SigChainService
  localDbService: LocalDbService
  libp2pService: Libp2pService
  storageService: StorageService
  orbitDbService: OrbitDbService
  captchaService: CaptchaService
  socketService: SocketService
  pendingPeerStoreUpdates: Set<Promise<void>>
  localP2pAddress?: string
}

interface CreatePeerOptions {
  useLocalP2pTransport?: boolean
}

interface OwnerFixture {
  owner: QSSIntegrationPeer
  teamId: string
  teamName: string
  community: Community
  inviteData: InvitationDataV5
}

interface OwnerFixtureOptions {
  beforeCreate?: (owner: QSSIntegrationPeer) => Promise<void> | void
  peerOptions?: CreatePeerOptions
}

interface CreatedTestChannel {
  channel: PublicChannel
  store: ChannelStore
}

const activePeers = new Set<QSSIntegrationPeer>()
let onionAddressSequence = 0

function healthUrl(endpoint: string): string {
  const parsed = new URL(endpoint)
  parsed.protocol = parsed.protocol === 'wss:' ? 'https:' : 'http:'
  parsed.pathname = '/health'
  parsed.search = ''
  parsed.hash = ''
  return parsed.toString()
}

async function assertQssIsReachable(endpoint: string): Promise<void> {
  try {
    const response = await fetch(healthUrl(endpoint))
    if (!response.ok) {
      throw new Error(`QSS health check failed with ${response.status} ${response.statusText}`)
    }
  } catch (e) {
    const reason = e instanceof Error ? e.message : String(e)
    throw new Error(
      `QSS integration tests require a running dockerized QSS server at ${endpoint}. ` +
        `Start QSS or set QSS_INTEGRATION_ENDPOINT to the local server URL. Health check error: ${reason}`
    )
  }
}

function nextTestOnionAddress(): string {
  const sequence = onionAddressSequence++
  let encoded = ''
  let remainder = sequence
  do {
    encoded = `${ONION_ALPHABET[remainder % ONION_ALPHABET.length]}${encoded}`
    remainder = Math.floor(remainder / ONION_ALPHABET.length)
  } while (remainder > 0)
  return `${'a'.repeat(56 - encoded.length)}${encoded}.onion`
}

function stubTorProcessBoundary(tor: Tor, peerName: string): void {
  const onionsByPrivateKey = new Map<string, string>()

  jest.spyOn(tor, 'createNewHiddenService').mockImplementation(async () => {
    const onionAddress = nextTestOnionAddress()
    const privateKey = `ED25519-V3:${peerName}:${randomUUID()}`
    onionsByPrivateKey.set(privateKey, onionAddress)
    return { onionAddress, privateKey }
  })
  jest.spyOn(tor, 'destroyHiddenService').mockResolvedValue(true)
  jest.spyOn(tor, 'spawnHiddenService').mockImplementation(async ({ privKey }) => {
    const onionAddress = onionsByPrivateKey.get(privKey)
    if (onionAddress == null) {
      throw new Error(`No test Tor hidden service was generated for ${peerName}`)
    }
    return onionAddress
  })
  jest.spyOn(tor, 'isBootstrappingFinished').mockResolvedValue(true)
  tor.bootstrapped = true
}

async function createPeer(name: string, options: CreatePeerOptions = {}): Promise<QSSIntegrationPeer> {
  const module = await Test.createTestingModule({
    imports: [TestModule, ConnectionsManagerModule],
  })
    .overrideProvider(TOR_PASSWORD_PROVIDER)
    .useValue({ torPassword: '', torHashedPassword: '' })
    .overrideProvider(QSS_ALLOWED)
    .useValue(true)
    .overrideProvider(QSS_ENDPOINT)
    .useValue(QSS_INTEGRATION_ENDPOINT)
    .compile()

  const tor = module.get(Tor)
  stubTorProcessBoundary(tor, name)

  const peer: QSSIntegrationPeer = {
    name,
    module,
    connectionsManager: module.get(ConnectionsManagerService),
    admissionCoordinator: module.get(AdmissionCoordinator),
    qssService: module.get(QSSService),
    qssClient: module.get(QSSClient),
    qssAuthConnManager: module.get(QSSAuthConnectionManager),
    qssSyncManager: module.get(QSSSyncManager),
    sigChainService: module.get(SigChainService),
    localDbService: module.get(LocalDbService),
    libp2pService: module.get(Libp2pService),
    storageService: module.get(StorageService),
    orbitDbService: module.get(OrbitDbService),
    captchaService: module.get(CaptchaService),
    socketService: module.get(SocketService),
    pendingPeerStoreUpdates: new Set(),
  }
  activePeers.add(peer)

  if (options.useLocalP2pTransport === true) {
    const port = await getPort()
    const createInstance = peer.libp2pService.createInstance.bind(peer.libp2pService)
    jest.spyOn(peer.libp2pService, 'createInstance').mockImplementation(async params => {
      const peerId = params.peerId.peerId.toString()
      const localAddress = `/memory/${port}/p2p/${peerId}`
      peer.localP2pAddress = localAddress
      return await createInstance({
        ...params,
        listenAddresses: [`/memory/${port}`],
        localAddress,
        agent: undefined,
        transport: [memory()],
      })
    })
  }

  const updatePeerStore = peer.storageService.updatePeerStore.bind(peer.storageService)
  jest.spyOn(peer.storageService, 'updatePeerStore').mockImplementation(() => {
    const update = updatePeerStore()
    peer.pendingPeerStoreUpdates.add(update)
    void update.finally(() => peer.pendingPeerStoreUpdates.delete(update)).catch(() => undefined)
    return update
  })

  // SocketService.onModuleInit waits for a real frontend START event and Tor.onModuleInit
  // starts a real process. Initialize the backend services this harness actually drives.
  peer.qssSyncManager.onModuleInit()
  await peer.captchaService.onModuleInit()
  await peer.connectionsManager.onModuleInit()

  return peer
}

function provideCaptchaToken(peer: QSSIntegrationPeer): void {
  peer.socketService.emit(SocketActions.HCAPTCHA_FORM_RESPONSE, { token: HCAPTCHA_TEST_TOKEN })
  expect(peer.captchaService.hcaptchaToken).toBe(HCAPTCHA_TEST_TOKEN)
}

async function waitForQssSetup(peer: QSSIntegrationPeer): Promise<void> {
  await waitForExpect(async () => {
    expect((await peer.qssService.getQssInitStatus()).qssSetup).toBe(true)
  }, 60_000)
}

async function waitForAuthReady(peer: QSSIntegrationPeer, teamId: string): Promise<void> {
  await waitForExpect(() => {
    const authConnection = peer.qssAuthConnManager.getConnection(teamId)
    expect(authConnection).toBeDefined()
    expect(authConnection!.connStatus).toBe(QSSAuthConnStatus.CONNECTED)
    expect(authConnection!.joinStatus).toBe(JoinStatus.JOINED)
  }, 60_000)
}

async function waitForMemberRole(peer: QSSIntegrationPeer, teamId: string): Promise<void> {
  await waitForExpect(() => {
    const sigChain = peer.sigChainService.getChain(teamId)
    expect(sigChain.roles.amIMemberOfRole(RoleName.MEMBER)).toBe(true)
  }, 60_000)
}

async function waitForBackendLaunch(
  peer: QSSIntegrationPeer,
  teamId: string,
  expectedTransport?: AdmissionTransport
): Promise<void> {
  await waitForExpect(() => {
    expect(peer.connectionsManager.communityState).toBe(ServiceState.LAUNCHED)
    expect(peer.storageService.initialized).toBe(true)
    expect(peer.libp2pService.state).toBe(Libp2pState.Started)
  }, 60_000)
  await waitForQssSetup(peer)
  await waitForAuthReady(peer, teamId)
  await waitForMemberRole(peer, teamId)

  if (expectedTransport != null) {
    const community = (await peer.localDbService.getCurrentCommunity()) as
      (Community & CommunityAdmissionMetadata) | undefined
    expect(community?.admissionTransport).toBe(expectedTransport)
    expect((await peer.localDbService.getSigChain(teamId))?.serializedTeam).toBeInstanceOf(Uint8Array)
  }
}

async function waitForP2pBackendLaunch(peer: QSSIntegrationPeer, teamId: string): Promise<void> {
  await waitForExpect(() => {
    expect(peer.connectionsManager.communityState).toBe(ServiceState.LAUNCHED)
    expect(peer.storageService.initialized).toBe(true)
    expect(peer.libp2pService.state).toBe(Libp2pState.Started)
  }, 60_000)
  await waitForMemberRole(peer, teamId)
  expect(peer.qssService.connected).toBe(false)
  expect((await peer.localDbService.getSigChain(teamId))?.serializedTeam).toBeInstanceOf(Uint8Array)
}

async function waitForDisconnected(peer: QSSIntegrationPeer, teamId: string): Promise<void> {
  await waitForExpect(() => {
    expect(peer.qssService.connected).toBe(false)
    expect(peer.qssAuthConnManager.getConnection(teamId)).toBeUndefined()
  }, 20_000)
}

async function pausePeerQss(peer: QSSIntegrationPeer, teamId: string): Promise<void> {
  peer.qssService.pause()
  await waitForDisconnected(peer, teamId)
}

async function resumePeerQss(peer: QSSIntegrationPeer, teamId: string): Promise<void> {
  await peer.qssService.resume()
  await waitForAuthReady(peer, teamId)
  await waitForMemberRole(peer, teamId)
}

async function requestMemberInvite(peer: QSSIntegrationPeer): Promise<InviteResultWithSalt> {
  return await new Promise((resolve, reject) => {
    peer.socketService.emit(
      SocketActions.VALIDATE_OR_CREATE_LONG_LIVED_LFA_INVITE,
      { id: undefined },
      (response: ResponseInvitePayload) => {
        if (response.newInvite == null) {
          reject(new Error('Backend did not create a long-lived member invitation'))
          return
        }
        resolve(response.newInvite)
      }
    )
  })
}

async function requestDeviceInvite(peer: QSSIntegrationPeer): Promise<DeviceLinkInvite> {
  return await new Promise((resolve, reject) => {
    peer.socketService.emit(SocketActions.CREATE_DEVICE_LINK, {}, (response?: DeviceLinkInvite) => {
      if (response == null) {
        reject(new Error('Backend did not create a device invitation'))
        return
      }
      resolve(response)
    })
  })
}

async function createOwnerFixture(prefix: string, options: OwnerFixtureOptions = {}): Promise<OwnerFixture> {
  const owner = await createPeer(`${prefix}-${randomUUID()}`, options.peerOptions)
  await options.beforeCreate?.(owner)
  provideCaptchaToken(owner)

  const teamName = `${prefix}-${randomUUID()}`
  const response = await owner.connectionsManager.createCommunity({
    id: randomUUID(),
    name: teamName,
    username: 'owner',
    useServer: true,
    tosAccepted: true,
  })
  if (response == null) {
    throw new Error('Backend did not create the owner community')
  }

  const community = (await owner.localDbService.getCommunity(response.id)) ?? response.community
  await waitForBackendLaunch(owner, community.teamId)
  const invite = await requestMemberInvite(owner)
  if (community.psk == null) {
    throw new Error('Backend-created community is missing its network PSK')
  }

  const inviteData: InvitationDataV5 = {
    kind: InvitationKind.Member,
    version: InvitationDataVersion.v5,
    pairs: p2pAddressesToPairs(community.peerList ?? []),
    psk: community.psk,
    authData: {
      communityName: community.name,
      seed: invite.seed,
      salt: invite.salt,
      teamId: community.teamId,
    },
    qssEnabled: true,
    qssEndpoint: QSS_INTEGRATION_ENDPOINT,
  }

  return {
    owner,
    teamId: community.teamId,
    teamName,
    community,
    inviteData,
  }
}

async function createInviteeFixture(
  ownerFixture: OwnerFixture,
  prefix: string,
  peerOptions: CreatePeerOptions = {}
): Promise<QSSIntegrationPeer> {
  const invitee = await createPeer(`${prefix}-${randomUUID()}`, peerOptions)
  const response = await invitee.connectionsManager.joinCommunity({
    id: randomUUID(),
    name: ownerFixture.teamName,
    username: prefix,
    inviteData: ownerFixture.inviteData,
  })
  if (response == null) {
    throw new Error('Backend did not prepare the invited community')
  }

  expect(invitee.sigChainService.activeChain.team).toBeNull()
  await invitee.connectionsManager.launchCommunity(response.id)
  await waitForBackendLaunch(invitee, ownerFixture.teamId, AdmissionTransport.QSS)
  return invitee
}

async function invitationPairForPeer(peer: QSSIntegrationPeer): Promise<InvitationPair> {
  const community = await peer.localDbService.getCurrentCommunity()
  if (community == null) {
    throw new Error(`${peer.name} does not have a current community`)
  }
  const identity = await peer.storageService.getIdentity(community.id)
  if (identity == null) {
    throw new Error(`${peer.name} does not have a stored identity`)
  }
  return {
    peerId: identity.networkInfo.peerId.id,
    onionAddress: identity.networkInfo.hiddenService.onionAddress.replace(/\.onion$/, ''),
  }
}

function requireLocalP2pAddress(peer: QSSIntegrationPeer): string {
  if (peer.localP2pAddress == null) {
    throw new Error(`${peer.name} was not configured with the local P2P transport`)
  }
  return peer.localP2pAddress
}

function peerKnowsDeviceInvite(peer: QSSIntegrationPeer, inviteId: DeviceLinkInvite['id']): boolean {
  try {
    return peer.sigChainService.activeChain.invites.getById(inviteId) != null
  } catch {
    return false
  }
}

async function createPublicChannel(fixture: OwnerFixture, prefix: string): Promise<CreatedTestChannel> {
  const updates: LogUpdate[] = []
  const onPut = (update: LogUpdate): void => {
    updates.push(update)
  }
  fixture.owner.orbitDbService.outboundEvents.on('put', onPut)

  const response = await (async () => {
    try {
      return await fixture.owner.storageService.channels.handleCreateChannel({
        name: `${prefix}-${randomUUID()}`,
        description: 'QSS protocol integration channel',
        public: true,
        teamId: fixture.teamId,
      })
    } finally {
      fixture.owner.orbitDbService.outboundEvents.off('put', onPut)
    }
  })()

  expect(response.status).toBe(ChannelOperationStatus.SUCCESS)
  if (response.channel == null) {
    throw new Error('Backend did not return the created channel')
  }

  const repo = fixture.owner.storageService.channels.channelsRepos.get(response.channel.id)
  expect(repo?.subscribed).toBe(true)
  if (repo == null) {
    throw new Error(`Backend did not create a channel repository for ${response.channel.id}`)
  }

  const metadataUpdate = updates.find(update => {
    const payload = update.entry.payload as { key?: string }
    return payload.key === response.channel!.id
  })
  expect(metadataUpdate).toBeDefined()
  if (metadataUpdate != null) {
    await fixture.owner.qssSyncManager.waitForLogEntrySyncAck(metadataUpdate.hash, 60_000)
    await waitForPendingSyncToDrain(fixture.owner, metadataUpdate.addr, metadataUpdate.hash)
  }

  return { channel: response.channel, store: repo.store }
}

async function waitForReplicatedChannelStore(peer: QSSIntegrationPeer, channel: PublicChannel): Promise<ChannelStore> {
  let store: ChannelStore | undefined

  await waitForExpect(async () => {
    const replicatedChannel = await peer.storageService.channels.getChannel(channel.id)
    expect(replicatedChannel).toMatchObject(channel)
    const repo = peer.storageService.channels.channelsRepos.get(channel.id)
    expect(repo?.subscribed).toBe(true)
    store = repo?.store
    expect(store).toBeDefined()
  }, 60_000)

  return store!
}

async function addChannelMessage(
  peer: QSSIntegrationPeer,
  store: ChannelStore,
  channel: PublicChannel,
  text: string
): Promise<string> {
  const message: ChannelMessage = {
    id: randomUUID(),
    type: MessageType.Basic,
    message: text,
    createdAt: Date.now(),
    channelId: channel.id,
    userId: peer.sigChainService.user.userId,
  }

  let messageUpdate: LogUpdate | undefined
  const onPut = (update: LogUpdate): void => {
    const value = (update.entry.payload as { value?: { id?: string } }).value
    if (update.addr === store.getAddress() && value?.id === message.id) {
      messageUpdate = update
    }
  }
  peer.orbitDbService.outboundEvents.on('put', onPut)
  try {
    expect(await peer.storageService.channels.sendMessage(message)).toBe(true)
    await waitForExpect(() => expect(messageUpdate).toBeDefined(), 10_000)
  } finally {
    peer.orbitDbService.outboundEvents.off('put', onPut)
  }

  return messageUpdate!.hash
}

async function readChannelMessages(
  peer: QSSIntegrationPeer,
  channel: PublicChannel
): Promise<ConsumedChannelMessage[]> {
  const response = await peer.storageService.channels.getMessages(channel.id)
  expect(response).toBeDefined()
  expect(response?.isVerified).toBe(true)
  const messages = (response?.messages ?? []) as ConsumedChannelMessage[]
  for (const message of messages) {
    expect(message.verified).toBe(true)
  }
  return messages
}

async function waitForExactMessages(
  peer: QSSIntegrationPeer,
  channel: PublicChannel,
  expected: string[]
): Promise<void> {
  await waitForExpect(async () => {
    const actual = (await readChannelMessages(peer, channel)).map(message => message.message).sort()
    expect(actual).toEqual([...expected].sort())
  }, 60_000)
}

async function waitForPendingSyncToDrain(peer: QSSIntegrationPeer, address: string, hash: string): Promise<void> {
  await waitForExpect(async () => {
    const pending = await peer.localDbService.getPendingQssLogSyncMessages()
    expect(pending[address] ?? []).not.toContain(hash)
  }, 60_000)
}

async function waitForLastSyncSeqAtLeast(
  peer: QSSIntegrationPeer,
  teamId: string,
  minimumSeq: number
): Promise<number> {
  let observedSeq = 0
  await waitForExpect(async () => {
    observedSeq = (await peer.localDbService.getLastSyncSeq(teamId)) ?? 0
    expect(observedSeq).toBeGreaterThanOrEqual(minimumSeq)
  }, 60_000)
  return observedSeq
}

async function runInviteUnawarePeerRetryScenario(unawarePeerCount: number): Promise<void> {
  const fixture = await createOwnerFixture(`qss-device-peer-retry-${unawarePeerCount}`, {
    peerOptions: { useLocalP2pTransport: true },
  })
  const { owner, teamId, teamName, community } = fixture
  owner.libp2pService.pauseDialQueue()

  const unawarePeers: QSSIntegrationPeer[] = []
  for (let index = 0; index < unawarePeerCount; index += 1) {
    const peer = await createInviteeFixture(fixture, `invite-unaware-${index}`, {
      useLocalP2pTransport: true,
    })
    peer.libp2pService.pauseDialQueue()
    await pausePeerQss(peer, teamId)
    unawarePeers.push(peer)
  }

  const deviceInvite = await requestDeviceInvite(owner)
  expect(peerKnowsDeviceInvite(owner, deviceInvite.id)).toBe(true)
  for (const peer of unawarePeers) {
    expect(peerKnowsDeviceInvite(peer, deviceInvite.id)).toBe(false)
  }
  if (community.psk == null) {
    throw new Error('Backend-created community is missing its network PSK')
  }

  const acceptingPeers = [...unawarePeers, owner]
  const inviteData: DeviceInvitationDataV5 = {
    kind: InvitationKind.Device,
    version: InvitationDataVersion.v5,
    pairs: await Promise.all(acceptingPeers.map(invitationPairForPeer)),
    psk: community.psk,
    authData: {
      communityName: teamName,
      seed: deviceInvite.seed,
      teamId,
      userId: deviceInvite.userId,
      userName: deviceInvite.userName,
    },
    qssEnabled: false,
    qssEndpoint: QSS_INTEGRATION_ENDPOINT,
  }

  const linkedDevice = await createPeer(`p2p-retrying-device-${randomUUID()}`, {
    useLocalP2pTransport: true,
  })
  const coordinateSpy = jest.spyOn(linkedDevice.admissionCoordinator, 'coordinate')
  const linkResponse = await linkedDevice.connectionsManager.linkDevice({
    id: randomUUID(),
    inviteData,
    deviceName: 'Adversarial retry linked device',
  })
  if (linkResponse == null) {
    throw new Error('Backend did not prepare the P2P-linked device community')
  }

  const rejectedByPeerIds: string[] = []
  const rejectionListeners = unawarePeers.map(peer => {
    const peerId = requireLocalP2pAddress(peer).split('/p2p/')[1]
    const listener = (payload: unknown): void => {
      const eventType = (payload as { event?: { type?: string } }).event?.type
      if (['LOCAL_ERROR', 'REMOTE_ERROR', 'ERROR'].includes(eventType ?? '') && !rejectedByPeerIds.includes(peerId)) {
        rejectedByPeerIds.push(peerId)
      }
    }
    peer.libp2pService.on(Libp2pEvents.AUTH_DISCONNECTED, listener)
    return { peer, listener }
  })

  const launch = linkedDevice.connectionsManager.launchCommunity(linkResponse.id)
  await waitForExpect(() => {
    expect(linkedDevice.libp2pService.state).toBe(Libp2pState.Started)
    expect(linkedDevice.localP2pAddress).toBeDefined()
  }, 30_000)
  linkedDevice.libp2pService.pauseDialQueue()

  const authService = (
    linkedDevice.libp2pService as unknown as {
      authService?: {
        bufferedConnections: Array<{ peerId: { toString(): string } }>
        advanceToNextBufferedPeer(): Promise<void>
      }
    }
  ).authService
  if (authService == null) {
    throw new Error('Production libp2p auth service was not initialized')
  }
  const bufferedPeerIdsAtFailure: string[][] = []
  const advanceToNextBufferedPeer = authService.advanceToNextBufferedPeer.bind(authService)
  jest.spyOn(authService, 'advanceToNextBufferedPeer').mockImplementation(async () => {
    bufferedPeerIdsAtFailure.push(authService.bufferedConnections.map(connection => connection.peerId.toString()))
    await advanceToNextBufferedPeer()
  })

  for (const peer of acceptingPeers) {
    await linkedDevice.libp2pService.dialPeer(requireLocalP2pAddress(peer), {
      throwOnError: true,
      redialOnError: false,
    })
  }

  await launch
  await waitForP2pBackendLaunch(linkedDevice, teamId)
  const unawarePeerIds = unawarePeers.map(peer => requireLocalP2pAddress(peer).split('/p2p/')[1])
  const ownerPeerId = requireLocalP2pAddress(owner).split('/p2p/')[1]

  expect(rejectedByPeerIds).toEqual(unawarePeerIds)
  expect(bufferedPeerIdsAtFailure).toHaveLength(unawarePeerCount)
  for (let index = 0; index < unawarePeerCount; index += 1) {
    expect(bufferedPeerIdsAtFailure[index]).toEqual(
      expect.arrayContaining([...unawarePeerIds.slice(index + 1), ownerPeerId])
    )
  }
  expect(linkedDevice.libp2pService.connectedPeers.has(ownerPeerId)).toBe(true)
  expect(coordinateSpy).toHaveBeenCalledWith(
    expect.objectContaining({
      teamId,
      kind: AdmissionKind.DEVICE,
      preferredTransport: AdmissionTransport.P2P,
    }),
    expect.any(Object)
  )
  await expect(coordinateSpy.mock.results[0].value).resolves.toMatchObject({
    teamId,
    userId: deviceInvite.userId,
    transport: AdmissionTransport.P2P,
  })

  const linkedChain = linkedDevice.sigChainService.activeChain
  expect(linkedChain.isPendingDeviceAdmission).toBe(false)
  expect(linkedChain.team?.hasDevice(linkedChain.device.deviceId)).toBe(true)
  expect(owner.sigChainService.activeChain.team?.hasDevice(linkedChain.device.deviceId)).toBe(true)
  for (const peer of unawarePeers) {
    expect(peer.sigChainService.activeChain.team?.hasDevice(linkedChain.device.deviceId)).toBe(false)
  }

  for (const { peer, listener } of rejectionListeners) {
    peer.libp2pService.off(Libp2pEvents.AUTH_DISCONNECTED, listener)
  }
}

function cleanupError(peer: QSSIntegrationPeer, step: string, error: unknown): Error {
  const reason = error instanceof Error ? error.message : String(error)
  return new Error(`${peer.name}: ${step} failed: ${reason}`)
}

async function settlePendingPeerStoreUpdates(peer: QSSIntegrationPeer): Promise<void> {
  const deadline = Date.now() + 10_000

  while (peer.pendingPeerStoreUpdates.size > 0) {
    const remainingMs = deadline - Date.now()
    if (remainingMs <= 0) {
      throw new Error(`${peer.pendingPeerStoreUpdates.size} peer-store update(s) did not settle before teardown`)
    }

    let timeout: NodeJS.Timeout | undefined
    try {
      await Promise.race([
        Promise.allSettled([...peer.pendingPeerStoreUpdates]),
        new Promise<never>((_, reject) => {
          timeout = setTimeout(
            () => reject(new Error('Timed out waiting for production peer-store updates')),
            remainingMs
          )
        }),
      ])
    } finally {
      if (timeout != null) {
        clearTimeout(timeout)
      }
    }
  }
}

async function cleanupPeer(peer: QSSIntegrationPeer): Promise<Error[]> {
  const errors: Error[] = []
  const preStorageCleanupSteps: Array<() => Promise<unknown> | unknown> = [
    () => peer.qssService.close(),
    async () => await peer.connectionsManager.closeSocket(),
  ]
  for (const [index, cleanup] of preStorageCleanupSteps.entries()) {
    try {
      await cleanup()
    } catch (error) {
      errors.push(cleanupError(peer, `pre-storage cleanup ${index + 1}`, error))
    }
  }

  // Production profile listeners intentionally fire-and-forget peer-store refreshes.
  // Stop scheduling new refreshes and let the real in-flight calls settle before
  // closing OrbitDB and LevelDB underneath them.
  peer.storageService.removeAllListeners(StorageEvents.USER_PROFILES_STORED)
  try {
    await settlePendingPeerStoreUpdates(peer)
  } catch (error) {
    errors.push(cleanupError(peer, 'peer-store update drain', error))
  }

  const storageCleanupSteps: Array<() => Promise<unknown> | unknown> = [
    async () => await peer.storageService.stop(),
    async () => await peer.libp2pService.close(false),
    async () => await peer.libp2pService.closeDatastore(),
    async () => await peer.localDbService.close(),
  ]
  for (const [index, cleanup] of storageCleanupSteps.entries()) {
    try {
      await cleanup()
    } catch (error) {
      errors.push(cleanupError(peer, `storage cleanup ${index + 1}`, error))
    }
  }

  try {
    await peer.module.close()
  } catch (error) {
    errors.push(cleanupError(peer, 'Nest module close', error))
  }
  activePeers.delete(peer)
  return errors
}

maybeDescribe('QSS client protocol integration against dockerized QSS', () => {
  jest.setTimeout(420_000)

  beforeAll(async () => {
    await assertQssIsReachable(QSS_INTEGRATION_ENDPOINT)
  })

  afterEach(async () => {
    const cleanupErrors: Error[] = []
    for (const peer of Array.from(activePeers).reverse()) {
      cleanupErrors.push(...(await cleanupPeer(peer)))
    }
    jest.restoreAllMocks()
    if (cleanupErrors.length > 0) {
      throw new Error(`QSS integration teardown failed:\n${cleanupErrors.map(error => error.message).join('\n')}`)
    }
  })

  it('bootstraps an owner through the backend and preserves idempotency across the core websocket flow', async () => {
    let sendMessageSpy!: jest.SpiedFunction<QSSClient['sendMessage']>
    const fixture = await createOwnerFixture('qss-owner-boundary', {
      beforeCreate: owner => {
        sendMessageSpy = jest.spyOn(owner.qssClient, 'sendMessage')
      },
    })
    const { owner, teamId } = fixture
    const { channel, store } = await createPublicChannel(fixture, 'owner-boundary')

    const text = 'owner sends a real public-channel message'
    const hash = await addChannelMessage(owner, store, channel, text)
    await owner.qssSyncManager.waitForLogEntrySyncAck(hash, 60_000)
    await waitForPendingSyncToDrain(owner, store.getAddress(), hash)
    await waitForExactMessages(owner, channel, [text])

    await waitForExpect(() => {
      const events = sendMessageSpy.mock.calls.map((call: unknown[]) => call[0])
      for (const event of [
        WebsocketEvents.GET_CAPTCHA_SITE_KEY,
        WebsocketEvents.VERIFY_CAPTCHA,
        WebsocketEvents.GEN_PUB_KEYS,
        WebsocketEvents.CREATE_COMMUNITY,
        WebsocketEvents.AUTH_SYNC,
        WebsocketEvents.LOG_ENTRY_PULL,
        WebsocketEvents.LOG_ENTRY_SYNC,
      ]) {
        expect(events).toContain(event)
      }
    }, 60_000)

    const firstSyncCallIndex = sendMessageSpy.mock.calls.findIndex(
      ([event, message]) =>
        event === WebsocketEvents.LOG_ENTRY_SYNC && (message as LogEntrySyncMessage).payload.hash === hash
    )
    expect(firstSyncCallIndex).toBeGreaterThanOrEqual(0)
    const originalMessage = sendMessageSpy.mock.calls[firstSyncCallIndex][1] as LogEntrySyncMessage
    const originalAck = (await sendMessageSpy.mock.results[firstSyncCallIndex].value) as LogEntrySyncResponseMessage

    const duplicateAck = await owner.qssClient.sendMessage<LogEntrySyncResponseMessage>(
      WebsocketEvents.LOG_ENTRY_SYNC,
      originalMessage,
      true
    )
    expect(originalAck.status).toBe(CommunityOperationStatus.SUCCESS)
    expect(duplicateAck).toMatchObject({
      status: CommunityOperationStatus.SUCCESS,
      payload: originalAck.payload,
    })

    const hashPull = await owner.qssSyncManager.pullLogEntries({
      teamId,
      userId: owner.sigChainService.user.userId,
      startSeq: 0,
      startTs: 0,
      hash,
    })
    expect(hashPull.status).toBe(CommunityOperationStatus.SUCCESS)
    expect(hashPull.payload.entries).toHaveLength(1)
  })

  it('replays real channel writes after the backend reconnects to QSS', async () => {
    const fixture = await createOwnerFixture('qss-offline-replay')
    const { owner, teamId } = fixture
    const { channel, store } = await createPublicChannel(fixture, 'offline-replay')
    const reconnectSpy = jest.spyOn(owner.qssService, 'connect')
    const queueSpy = jest.spyOn(owner.localDbService, 'addPendingQssLogSyncMessage')

    owner.qssClient.close()
    expect(owner.qssService.connected).toBe(false)
    const hash = await addChannelMessage(owner, store, channel, 'offline write is replayed by the backend')

    await waitForExpect(() => {
      expect(queueSpy).toHaveBeenCalledWith(store.getAddress(), hash)
    }, 10_000)
    await waitForAuthReady(owner, teamId)
    await waitForMemberRole(owner, teamId)
    expect(reconnectSpy).toHaveBeenCalled()
    await waitForPendingSyncToDrain(owner, store.getAddress(), hash)
    await owner.qssSyncManager.waitForLogEntrySyncAck(hash, 60_000)
    await waitForExactMessages(owner, channel, ['offline write is replayed by the backend'])
    expect(owner.storageService.initialized).toBe(true)
  })

  it('routes bidirectional fanout to production channel stores and paginates by sync sequence', async () => {
    const fixture = await createOwnerFixture('qss-member-fanout')
    const { owner, teamId } = fixture
    const channelA = await createPublicChannel(fixture, 'fanout-a')
    const channelB = await createPublicChannel(fixture, 'fanout-b')
    const invitee = await createInviteeFixture(fixture, 'qss-member')
    const inviteeStoreA = await waitForReplicatedChannelStore(invitee, channelA.channel)
    const inviteeStoreB = await waitForReplicatedChannelStore(invitee, channelB.channel)
    expect(inviteeStoreA.getAddress()).toBe(channelA.store.getAddress())
    expect(inviteeStoreB.getAddress()).toBe(channelB.store.getAddress())

    const ownerSendSpy = jest.spyOn(owner.qssSyncManager, 'sendLogEntrySyncMessage')
    const inviteeSendSpy = jest.spyOn(invitee.qssSyncManager, 'sendLogEntrySyncMessage')
    const inviteeFanoutSpy = jest.fn()
    invitee.qssClient.on(WebsocketEvents.LOG_ENTRY_SYNC, inviteeFanoutSpy)

    const ownerText = 'owner message belongs only to channel A'
    const inviteeText = 'invitee message belongs only to channel B'
    const [ownerHash, inviteeHash] = await Promise.all([
      addChannelMessage(owner, channelA.store, channelA.channel, ownerText),
      addChannelMessage(invitee, inviteeStoreB, channelB.channel, inviteeText),
    ])

    await Promise.all([
      owner.qssSyncManager.waitForLogEntrySyncAck(ownerHash, 60_000),
      invitee.qssSyncManager.waitForLogEntrySyncAck(inviteeHash, 60_000),
    ])
    await waitForExactMessages(invitee, channelA.channel, [ownerText])
    await waitForExactMessages(owner, channelB.channel, [inviteeText])
    await waitForExactMessages(owner, channelA.channel, [ownerText])
    await waitForExactMessages(invitee, channelB.channel, [inviteeText])

    expect(ownerSendSpy).toHaveBeenCalledWith(expect.objectContaining({ hash: ownerHash }))
    expect(ownerSendSpy).not.toHaveBeenCalledWith(expect.objectContaining({ hash: inviteeHash }))
    expect(inviteeSendSpy).toHaveBeenCalledWith(expect.objectContaining({ hash: inviteeHash }))
    expect(inviteeSendSpy).not.toHaveBeenCalledWith(expect.objectContaining({ hash: ownerHash }))
    expect(inviteeFanoutSpy).toHaveBeenCalledWith(
      expect.objectContaining({ payload: expect.objectContaining({ hash: ownerHash }) })
    )

    const pageSequences: number[] = []
    let startSeq = 0
    let reachedTerminalPage = false
    for (let pageNumber = 0; pageNumber < 100; pageNumber += 1) {
      const page = await owner.qssSyncManager.pullLogEntries({
        teamId,
        userId: owner.sigChainService.user.userId,
        startSeq,
        startTs: 0,
        limit: 1,
      })
      expect(page.status).toBe(CommunityOperationStatus.SUCCESS)
      expect(page.payload.entries.length).toBeLessThanOrEqual(1)

      if (page.payload.entries.length === 0) {
        expect(page.payload.hasNextPage).toBe(false)
        reachedTerminalPage = true
        break
      }

      const highestSyncSeq = page.payload.highestSyncSeq
      expect(highestSyncSeq).toEqual(expect.any(Number))
      expect(highestSyncSeq).toBeGreaterThan(startSeq)
      pageSequences.push(highestSyncSeq!)
      startSeq = highestSyncSeq!

      if (!page.payload.hasNextPage) {
        const terminalPage = await owner.qssSyncManager.pullLogEntries({
          teamId,
          userId: owner.sigChainService.user.userId,
          startSeq,
          startTs: 0,
          limit: 1,
        })
        expect(terminalPage.status).toBe(CommunityOperationStatus.SUCCESS)
        expect(terminalPage.payload.entries).toHaveLength(0)
        expect(terminalPage.payload.hasNextPage).toBe(false)
        reachedTerminalPage = true
        break
      }
    }
    expect(reachedTerminalPage).toBe(true)
    expect(pageSequences.length).toBeGreaterThanOrEqual(2)

    for (const hash of [ownerHash, inviteeHash]) {
      const hashPull = await owner.qssSyncManager.pullLogEntries({
        teamId,
        userId: owner.sigChainService.user.userId,
        startSeq: 0,
        startTs: 0,
        hash,
      })
      expect(hashPull.status).toBe(CommunityOperationStatus.SUCCESS)
      expect(hashPull.payload.entries).toHaveLength(1)
    }

    invitee.qssClient.off(WebsocketEvents.LOG_ENTRY_SYNC, inviteeFanoutSpy)
  })

  it('catches up reconnecting and late members through the production launch and storage lifecycle', async () => {
    const fixture = await createOwnerFixture('qss-history')
    const { owner, teamId } = fixture
    const { channel, store: ownerStore } = await createPublicChannel(fixture, 'history')
    const invitee = await createInviteeFixture(fixture, 'qss-reconnecting-member')
    await waitForReplicatedChannelStore(invitee, channel)
    const observerSendSpy = jest.spyOn(invitee.qssSyncManager, 'sendLogEntrySyncMessage')

    await pausePeerQss(invitee, teamId)
    const expectedMessages = ['history entry one', 'history entry two']
    const hashes: string[] = []
    for (const text of expectedMessages) {
      const hash = await addChannelMessage(owner, ownerStore, channel, text)
      hashes.push(hash)
      await owner.qssSyncManager.waitForLogEntrySyncAck(hash, 60_000)
    }
    const expectedSeq = await waitForLastSyncSeqAtLeast(owner, teamId, 2)

    for (const hash of hashes) {
      expect(observerSendSpy).not.toHaveBeenCalledWith(expect.objectContaining({ hash }))
    }
    const observerPending = await invitee.localDbService.getPendingQssLogSyncMessages()
    expect(Object.values(observerPending).flat()).not.toEqual(expect.arrayContaining(hashes))
    await waitForExactMessages(invitee, channel, [])

    await resumePeerQss(invitee, teamId)
    await waitForExactMessages(invitee, channel, expectedMessages)
    await waitForLastSyncSeqAtLeast(invitee, teamId, expectedSeq)

    const lateInvitee = await createInviteeFixture(fixture, 'qss-late-member')
    await waitForReplicatedChannelStore(lateInvitee, channel)
    await waitForExactMessages(lateInvitee, channel, expectedMessages)
    await waitForLastSyncSeqAtLeast(lateInvitee, teamId, expectedSeq)
  })

  it('retries device admission with the invite creator after an invite-unaware peer rejects it', async () => {
    await runInviteUnawarePeerRetryScenario(1)
  })

  it('retries device admission across two invite-unaware peers before reaching the invite creator', async () => {
    await runInviteUnawarePeerRetryScenario(2)
  })

  it('links a device through the production coordinator and syncs history and live writes', async () => {
    const fixture = await createOwnerFixture('qss-linked-device')
    const { owner, teamId, teamName, community } = fixture
    const { channel, store: ownerStore } = await createPublicChannel(fixture, 'linked-device')
    const ownerChain = owner.sigChainService.activeChain
    const ownerUserId = ownerChain.user.userId
    const ownerDeviceId = ownerChain.device.deviceId
    const deviceInvite = await requestDeviceInvite(owner)

    const historicalText = 'linked device receives history after QSS admission'
    const historicalHash = await addChannelMessage(owner, ownerStore, channel, historicalText)
    await owner.qssSyncManager.waitForLogEntrySyncAck(historicalHash, 60_000)

    if (community.psk == null) {
      throw new Error('Backend-created community is missing its network PSK')
    }
    const inviteData: DeviceInvitationDataV5 = {
      kind: InvitationKind.Device,
      version: InvitationDataVersion.v5,
      pairs: p2pAddressesToPairs(community.peerList ?? []),
      psk: community.psk,
      authData: {
        communityName: teamName,
        seed: deviceInvite.seed,
        teamId,
        userId: deviceInvite.userId,
        userName: deviceInvite.userName,
      },
      qssEnabled: true,
      qssEndpoint: QSS_INTEGRATION_ENDPOINT,
    }

    const linkedDevice = await createPeer(`qss-linked-device-${randomUUID()}`)
    const coordinateSpy = jest.spyOn(linkedDevice.admissionCoordinator, 'coordinate')
    const linkResponse = await linkedDevice.connectionsManager.linkDevice({
      id: randomUUID(),
      inviteData,
      deviceName: 'QSS integration linked device',
    })
    if (linkResponse == null) {
      throw new Error('Backend did not prepare the linked device community')
    }

    expect(linkedDevice.sigChainService.activeChain.isPendingDeviceAdmission).toBe(true)
    expect(linkedDevice.qssService.connected).toBe(false)
    await linkedDevice.connectionsManager.launchCommunity(linkResponse.id)
    await waitForBackendLaunch(linkedDevice, teamId)

    expect(coordinateSpy).toHaveBeenCalledTimes(1)
    expect(coordinateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        communityId: linkResponse.id,
        teamId,
        expectedUserId: ownerUserId,
        kind: AdmissionKind.DEVICE,
        preferredTransport: AdmissionTransport.QSS,
      }),
      expect.objectContaining({
        startQss: expect.any(Function),
        startP2p: expect.any(Function),
      })
    )
    await expect(coordinateSpy.mock.results[0].value).resolves.toMatchObject({
      teamId,
      userId: ownerUserId,
      transport: AdmissionTransport.QSS,
    })
    expect((await linkedDevice.localDbService.getSigChain(teamId))?.serializedTeam).toBeInstanceOf(Uint8Array)

    const linkedChain = linkedDevice.sigChainService.activeChain
    expect(linkedChain.isPendingDeviceAdmission).toBe(false)
    expect(linkedChain.team?.id).toBe(teamId)
    expect(linkedChain.user.userId).toBe(ownerUserId)
    expect(linkedChain.device.deviceId).not.toBe(ownerDeviceId)
    expect(linkedChain.team?.hasDevice(linkedChain.device.deviceId)).toBe(true)
    expect(linkedChain.team?.members(ownerUserId).devices).toHaveLength(2)
    await waitForExpect(() => {
      expect(owner.sigChainService.activeChain.team?.hasDevice(linkedChain.device.deviceId)).toBe(true)
      expect(owner.sigChainService.activeChain.team?.members(ownerUserId).devices).toHaveLength(2)
    }, 60_000)

    const linkedDeviceStore = await waitForReplicatedChannelStore(linkedDevice, channel)
    expect(linkedDeviceStore.getAddress()).toBe(ownerStore.getAddress())
    await waitForExactMessages(linkedDevice, channel, [historicalText])

    const ownerLiveText = 'owner remains live after linked device signs in'
    const ownerLiveHash = await addChannelMessage(owner, ownerStore, channel, ownerLiveText)
    await owner.qssSyncManager.waitForLogEntrySyncAck(ownerLiveHash, 60_000)
    await waitForExactMessages(linkedDevice, channel, [historicalText, ownerLiveText])

    const linkedDeviceText = 'linked device sends back through its real channel store'
    const linkedDeviceHash = await addChannelMessage(linkedDevice, linkedDeviceStore, channel, linkedDeviceText)
    await linkedDevice.qssSyncManager.waitForLogEntrySyncAck(linkedDeviceHash, 60_000)
    await waitForExactMessages(owner, channel, [historicalText, ownerLiveText, linkedDeviceText])
    await waitForAuthReady(owner, teamId)
    await waitForAuthReady(linkedDevice, teamId)
  })

  it('returns a structured error when signing in to a community that does not exist', async () => {
    const peer = await createPeer(`qss-unknown-team-${randomUUID()}`)
    const sigChain = await peer.sigChainService.createChain(true)
    const sendMessageSpy = jest.spyOn(peer.qssClient, 'sendMessage')
    await peer.qssClient.createSocketAndConnect(QSS_INTEGRATION_ENDPOINT)

    const unknownTeamId = randomUUID()
    const result = await peer.qssService.signInToCommunity(unknownTeamId, sigChain)
    expect(result).toBe(QSSOperationResult.ERROR)

    const signInCall = sendMessageSpy.mock.calls.find(([event]) => event === WebsocketEvents.SIGN_IN_COMMUNITY)
    expect(signInCall).toBeDefined()
    expect(signInCall![1]).toMatchObject({
      status: CommunityOperationStatus.SENDING,
      payload: {
        userId: sigChain.user.userId,
        deviceId: sigChain.device.deviceId,
        teamId: unknownTeamId,
      },
    } satisfies Partial<CommunitySignInMessage>)
  })
})
