import { EventsType } from '@orbitdb/core'
import { jest } from '@jest/globals'
import { Test, TestingModule } from '@nestjs/testing'
import { randomBytes, randomUUID } from 'crypto'
import waitForExpect from 'wait-for-expect'

import {
  ChannelMessage,
  Community,
  CommunityOwnership,
  ConsumedChannelMessage,
  Identity,
  InvitationDataVersion,
  MessageType,
  PublicChannel,
} from '@quiet/types'
import { SigChainService } from '../../src/nest/auth/sigchain.service'
import { SigChainModule } from '../../src/nest/auth/sigchain.service.module'
import { RoleName } from '../../src/nest/auth/services/roles/roles'
import { CaptchaService } from '../../src/nest/captcha/captcha.service'
import { QSS_ALLOWED, QSS_ENDPOINT } from '../../src/nest/const'
import { TestModule } from '../../src/nest/common/test.module'
import { spawnLibp2pInstancesInMemory } from '../../src/nest/common/test-utils'
import { getInMemoryLibp2pInstanceParams } from '../../src/nest/common/utils'
import { IpfsFileManagerModule } from '../../src/nest/ipfs-file-manager/ipfs-file-manager.module'
import { IpfsModule } from '../../src/nest/ipfs/ipfs.module'
import { IpfsService } from '../../src/nest/ipfs/ipfs.service'
import { JoinStatus } from '../../src/nest/libp2p/libp2p.auth'
import { Libp2pService } from '../../src/nest/libp2p/libp2p.service'
import { Libp2pEvents, type Libp2pNodeParams } from '../../src/nest/libp2p/libp2p.types'
import { LocalDbService } from '../../src/nest/local-db/local-db.service'
import { QSSAuthConnectionManager } from '../../src/nest/qss/qss-auth-conn-manager.service'
import { QSSAuthConnStatus } from '../../src/nest/qss/qss.const'
import { QSSClient } from '../../src/nest/qss/qss.client'
import { QSSModule } from '../../src/nest/qss/qss.module'
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
import { PublicChannelMessagesService } from '../../src/nest/storage/channels/messages/public-channel-messages.service'
import { EncryptedMessage } from '../../src/nest/storage/channels/messages/messages.types'
import { MessagesAccessController } from '../../src/nest/storage/channels/messages/orbitdb/MessagesAccessController'
import { EventsWithStorage } from '../../src/nest/storage/orbitDb/eventsWithStorage'
import { OrbitDbService } from '../../src/nest/storage/orbitDb/orbitDb.service'
import { OrbitDbModule } from '../../src/nest/storage/orbitDb/orbitdb.module'

const RUN_QSS_MODULE_INTEGRATION =
  process.env.QSS_MODULE_INTEGRATION === '1' || process.env.RUN_QSS_INTEGRATION_TESTS === 'true'
const QSS_INTEGRATION_ENDPOINT =
  process.env.QSS_INTEGRATION_ENDPOINT ?? process.env.QSS_ENDPOINT ?? 'http://localhost:3003'
const HCAPTCHA_TEST_TOKEN = '10000000-aaaa-bbbb-cccc-000000000001'
const maybeDescribe = RUN_QSS_MODULE_INTEGRATION ? describe : describe.skip

type QssChannelStore = EventsType<EncryptedMessage>

interface QSSIntegrationPeer {
  name: string
  module: TestingModule
  qssService: QSSService
  qssClient: QSSClient
  qssAuthConnManager: QSSAuthConnectionManager
  qssSyncManager: QSSSyncManager
  sigChainService: SigChainService
  localDbService: LocalDbService
  libp2pService: Libp2pService
  ipfsService: IpfsService
  orbitDbService: OrbitDbService
  captchaService: CaptchaService
  publicChannelMessagesService: PublicChannelMessagesService
  messagesAccessController: MessagesAccessController
}

interface OwnerFixture {
  owner: QSSIntegrationPeer
  teamId: string
  teamName: string
  invite: { seed: string; salt: string }
  psk: string
  libp2pParams: Libp2pNodeParams
}

interface OwnerFixtureOptions {
  markStorageReadyBeforeConnect?: boolean
  beforeConnect?: (fixture: OwnerFixture) => Promise<void> | void
}

interface InviteeFixtureOptions {
  beforeConnect?: (peer: QSSIntegrationPeer) => Promise<void> | void
  beforeStorageReady?: (peer: QSSIntegrationPeer) => Promise<void> | void
}

interface DeviceAdmissionPayload {
  teamId: string
  userId: string
  deviceId: string
  deviceAdmission: boolean
}

const activePeers = new Set<QSSIntegrationPeer>()

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

function testIdentity(communityId: string, userId: string): Identity {
  return {
    communityId,
    userId,
    networkInfo: {
      hiddenService: {
        onionAddress: `${randomUUID().replaceAll('-', '')}.onion`,
        privateKey: randomBytes(32).toString('base64'),
      },
      peerId: {
        id: randomUUID(),
        privKey: randomBytes(32).toString('base64'),
      },
    },
    joinTimestamp: null,
  }
}

async function createPeer(name: string): Promise<QSSIntegrationPeer> {
  const module = await Test.createTestingModule({
    imports: [TestModule, SigChainModule, IpfsFileManagerModule, IpfsModule, OrbitDbModule, QSSModule],
  })
    .overrideProvider(QSS_ALLOWED)
    .useValue(true)
    .overrideProvider(QSS_ENDPOINT)
    .useValue(QSS_INTEGRATION_ENDPOINT)
    .compile()

  const peer: QSSIntegrationPeer = {
    name,
    module,
    qssService: module.get(QSSService),
    qssClient: module.get(QSSClient),
    qssAuthConnManager: module.get(QSSAuthConnectionManager),
    qssSyncManager: module.get(QSSSyncManager),
    sigChainService: module.get(SigChainService),
    localDbService: module.get(LocalDbService),
    libp2pService: await module.resolve(Libp2pService),
    ipfsService: await module.resolve(IpfsService),
    orbitDbService: module.get(OrbitDbService),
    captchaService: module.get(CaptchaService),
    publicChannelMessagesService: module.get(PublicChannelMessagesService),
    messagesAccessController: module.get(MessagesAccessController),
  }
  activePeers.add(peer)

  peer.qssSyncManager.onModuleInit()
  await peer.localDbService.open()

  return peer
}

async function startPeerLibp2p(peer: QSSIntegrationPeer, params?: Libp2pNodeParams): Promise<Libp2pNodeParams> {
  if (params != null) {
    await peer.libp2pService.createInstance(params)
    return params
  }

  const [createdParams] = await spawnLibp2pInstancesInMemory([peer.module])
  return createdParams
}

async function startPeerDataStorage(peer: QSSIntegrationPeer): Promise<void> {
  await peer.ipfsService.createInstance()
  await peer.ipfsService.start()
  await peer.orbitDbService.create(peer.ipfsService.ipfsInstance!)
}

async function setCurrentCommunity(
  peer: QSSIntegrationPeer,
  community: Community,
  userId = peer.sigChainService.user.userId
): Promise<void> {
  await peer.localDbService.setCommunity(community)
  await peer.localDbService.setCurrentCommunityId(community.id)
  await peer.localDbService.setIdentity(testIdentity(community.id, userId))
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

async function waitForDisconnected(peer: QSSIntegrationPeer, teamId: string): Promise<void> {
  await waitForExpect(() => {
    expect(peer.qssService.connected).toBe(false)
    expect(peer.qssAuthConnManager.getConnection(teamId)).toBeUndefined()
  }, 20_000)
}

async function connectPeer(peer: QSSIntegrationPeer, teamId: string): Promise<void> {
  expect(await peer.qssService.connect(QSS_INTEGRATION_ENDPOINT)).toBe(QSSOperationResult.SUCCESS)
  await waitForAuthReady(peer, teamId)
  await waitForMemberRole(peer, teamId)
}

async function disconnectForDeterministicOfflineWindow(peer: QSSIntegrationPeer, teamId: string): Promise<void> {
  peer.qssClient.close()
  const serviceInternals = peer.qssService as unknown as {
    _clearReconnectTimer(resetDelay?: boolean): void
  }
  serviceInternals._clearReconnectTimer(true)
  await waitForDisconnected(peer, teamId)
}

async function createOwnerFixture(prefix: string, options: OwnerFixtureOptions = {}): Promise<OwnerFixture> {
  const owner = await createPeer(`${prefix}-${randomUUID()}`)
  const teamName = `${prefix}-${randomUUID()}`
  const ownerSigChain = await owner.sigChainService.createChain(true)
  const teamId = ownerSigChain.team!.id
  const invite = ownerSigChain.invites.createLongLivedUserInvite() as { seed: string; salt: string }
  ownerSigChain.lockbox.createInviteLockboxes(invite.seed, invite.salt)
  await owner.sigChainService.saveChain(teamId)

  const psk = randomBytes(32).toString('base64')
  await setCurrentCommunity(owner, {
    id: randomUUID(),
    name: teamName,
    ownership: CommunityOwnership.Owner,
    peerList: [],
    psk,
    teamId,
    qssEnabled: true,
    qssEndpoint: QSS_INTEGRATION_ENDPOINT,
    qssSetup: false,
  })

  const libp2pParams = await startPeerLibp2p(owner)
  await startPeerDataStorage(owner)
  const fixture = { owner, teamId, teamName, invite, psk, libp2pParams }
  await options.beforeConnect?.(fixture)

  if (options.markStorageReadyBeforeConnect ?? true) {
    owner.qssService.markTeamStorageReady(teamId)
  }
  owner.captchaService.hcaptchaToken = HCAPTCHA_TEST_TOKEN
  expect(await owner.qssService.connect(QSS_INTEGRATION_ENDPOINT)).toBe(QSSOperationResult.SUCCESS)
  await waitForQssSetup(owner)
  await waitForAuthReady(owner, teamId)
  await waitForMemberRole(owner, teamId)
  return fixture
}

async function createInviteeFixture(
  ownerFixture: OwnerFixture,
  prefix: string,
  options: InviteeFixtureOptions = {}
): Promise<QSSIntegrationPeer> {
  const invitee = await createPeer(`${prefix}-${randomUUID()}`)
  const { teamId, teamName, invite, psk } = ownerFixture

  await invitee.sigChainService.createChainFromInvite({ seed: invite.seed }, teamId, true)
  await setCurrentCommunity(invitee, {
    id: randomUUID(),
    name: teamName,
    ownership: CommunityOwnership.User,
    peerList: [],
    psk,
    teamId,
    qssEnabled: true,
    qssEndpoint: QSS_INTEGRATION_ENDPOINT,
    qssSetup: false,
    inviteData: {
      version: InvitationDataVersion.v5,
      pairs: [],
      psk,
      authData: {
        communityName: teamName,
        seed: invite.seed,
        salt: invite.salt,
        teamId,
      },
      qssEnabled: true,
      qssEndpoint: QSS_INTEGRATION_ENDPOINT,
    },
  })

  await startPeerLibp2p(invitee)
  await options.beforeConnect?.(invitee)
  await connectPeer(invitee, teamId)

  await startPeerDataStorage(invitee)
  await options.beforeStorageReady?.(invitee)
  invitee.qssService.markTeamStorageReady(teamId)
  return invitee
}

function createPublicChannel(fixture: OwnerFixture, prefix: string): PublicChannel {
  return {
    id: `${prefix}-${randomUUID()}`,
    name: `${prefix}-${randomUUID()}`,
    description: 'QSS protocol integration channel',
    owner: fixture.owner.sigChainService.user.userId,
    timestamp: Date.now(),
    public: true,
    teamId: fixture.teamId,
  }
}

async function openQssBackedChannel(peer: QSSIntegrationPeer, channel: PublicChannel): Promise<QssChannelStore> {
  const store = await peer.orbitDbService.open<QssChannelStore>(`channels.${channel.id}`, {
    type: 'events',
    Database: EventsWithStorage(),
    AccessController: peer.messagesAccessController.createAccessControllerFunc({
      write: ['*'],
      sigchainService: peer.sigChainService,
    }),
    sync: false,
  })
  OrbitDbService.updateMetadata(store, { teamId: channel.teamId })
  return store
}

async function addChannelMessage(
  peer: QSSIntegrationPeer,
  store: QssChannelStore,
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
  const encryptedMessage = await peer.publicChannelMessagesService.onSend(message, channel)
  return await store.add(encryptedMessage)
}

async function readChannelMessages(
  peer: QSSIntegrationPeer,
  store: QssChannelStore,
  channel: PublicChannel
): Promise<ConsumedChannelMessage[]> {
  const messages: ConsumedChannelMessage[] = []
  for await (const entry of store.iterator()) {
    if (entry.value == null) {
      continue
    }

    const message = await peer.publicChannelMessagesService.onConsume(entry.value, channel)
    if (message === false || message == null) {
      continue
    }
    expect(message.verified).toBe(true)
    messages.push(message)
  }
  return messages
}

async function waitForExactMessages(
  peer: QSSIntegrationPeer,
  store: QssChannelStore,
  channel: PublicChannel,
  expected: string[]
): Promise<void> {
  await waitForExpect(async () => {
    const actual = (await readChannelMessages(peer, store, channel)).map(message => message.message).sort()
    expect(actual).toEqual([...expected].sort())
  }, 60_000)
}

async function expectPendingSyncContains(peer: QSSIntegrationPeer, address: string, hash: string): Promise<void> {
  await waitForExpect(async () => {
    const pending = await peer.localDbService.getPendingQssLogSyncMessages()
    expect(pending[address] ?? []).toContain(hash)
  }, 10_000)
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

async function dialAndWaitForDeviceAdmission(
  linkedDevice: QSSIntegrationPeer,
  acceptingPeer: QSSIntegrationPeer
): Promise<DeviceAdmissionPayload> {
  let timeout: NodeJS.Timeout | undefined
  let admissionHandler: ((payload: DeviceAdmissionPayload) => void) | undefined
  const admission = new Promise<DeviceAdmissionPayload>((resolve, reject) => {
    admissionHandler = payload => resolve(payload)
    linkedDevice.libp2pService.once(Libp2pEvents.AUTH_JOINED, admissionHandler)
    timeout = setTimeout(() => reject(new Error('Device admission over libp2p timed out')), 60_000)
  })

  try {
    const dial = linkedDevice.libp2pService.dialPeer(acceptingPeer.libp2pService.localAddress, {
      throwOnError: true,
      redialOnError: false,
    })
    await Promise.race([dial, admission])
    await dial
    return await admission
  } finally {
    if (timeout != null) {
      clearTimeout(timeout)
    }
    if (admissionHandler != null) {
      linkedDevice.libp2pService.off(Libp2pEvents.AUTH_JOINED, admissionHandler)
    }
  }
}

async function cleanupPeer(peer: QSSIntegrationPeer): Promise<void> {
  const cleanupSteps: Array<() => Promise<unknown> | unknown> = [
    () => peer.qssService.close(),
    async () => await peer.orbitDbService.stop(),
    async () => await peer.ipfsService.stop(),
    async () => await peer.libp2pService.close(false),
    async () => await new Promise(resolve => setTimeout(resolve, 1_000)),
    async () => await peer.libp2pService.closeDatastore(),
    async () => await peer.localDbService.close(),
    async () => await peer.module.close(),
  ]

  for (const cleanup of cleanupSteps) {
    try {
      await cleanup()
    } catch {
      // Keep cleanup best-effort so the original test failure remains visible.
    }
  }
  activePeers.delete(peer)
}

maybeDescribe('QSS client protocol integration against dockerized QSS', () => {
  jest.setTimeout(420_000)

  beforeAll(async () => {
    await assertQssIsReachable(QSS_INTEGRATION_ENDPOINT)
  })

  afterEach(async () => {
    for (const peer of Array.from(activePeers).reverse()) {
      await cleanupPeer(peer)
    }
  })

  it('bootstraps an owner and preserves idempotency across the complete core websocket flow', async () => {
    let channel!: PublicChannel
    let ownerStore!: QssChannelStore
    let sendMessageSpy!: jest.SpiedFunction<QSSClient['sendMessage']>

    const fixture = await createOwnerFixture('qss-owner-boundary', {
      beforeConnect: async ownerFixture => {
        channel = createPublicChannel(ownerFixture, 'owner-boundary')
        ownerStore = await openQssBackedChannel(ownerFixture.owner, channel)
        sendMessageSpy = jest.spyOn(ownerFixture.owner.qssClient, 'sendMessage')
      },
    })
    const { owner, teamId } = fixture

    const text = 'owner sends a real public-channel message'
    const hash = await addChannelMessage(owner, ownerStore, channel, text)
    await owner.qssSyncManager.waitForLogEntrySyncAck(hash, 60_000)
    await waitForPendingSyncToDrain(owner, ownerStore.address, hash)
    await waitForExactMessages(owner, ownerStore, channel, [text])

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

  it('keeps offline writes in the DLQ until local storage is ready for replay', async () => {
    let channel!: PublicChannel
    let ownerStore!: QssChannelStore
    const fixture = await createOwnerFixture('qss-storage-gate', {
      markStorageReadyBeforeConnect: false,
      beforeConnect: async ownerFixture => {
        channel = createPublicChannel(ownerFixture, 'storage-gate')
        ownerStore = await openQssBackedChannel(ownerFixture.owner, channel)
      },
    })
    const { owner, teamId } = fixture
    const pullSpy = jest.spyOn(owner.qssSyncManager, 'pullLatestLogEntries')

    await disconnectForDeterministicOfflineWindow(owner, teamId)
    const hash = await addChannelMessage(owner, ownerStore, channel, 'offline write waits for storage')
    await expectPendingSyncContains(owner, ownerStore.address, hash)

    await connectPeer(owner, teamId)
    await owner.qssSyncManager.processDeadLetterQueue(teamId)
    await expectPendingSyncContains(owner, ownerStore.address, hash)
    expect(pullSpy).not.toHaveBeenCalled()

    owner.qssService.markTeamStorageReady(teamId)
    await waitForExpect(() => {
      expect(pullSpy).toHaveBeenCalledWith(teamId)
    }, 60_000)
    await waitForPendingSyncToDrain(owner, ownerStore.address, hash)
    await owner.qssSyncManager.waitForLogEntrySyncAck(hash, 60_000)
  })

  it('routes bidirectional fanout to the right stores and paginates by sync sequence', async () => {
    let channelA!: PublicChannel
    let channelB!: PublicChannel
    let ownerStoreA!: QssChannelStore
    let ownerStoreB!: QssChannelStore
    const fixture = await createOwnerFixture('qss-member-fanout', {
      beforeConnect: async ownerFixture => {
        channelA = createPublicChannel(ownerFixture, 'fanout-a')
        channelB = createPublicChannel(ownerFixture, 'fanout-b')
        ownerStoreA = await openQssBackedChannel(ownerFixture.owner, channelA)
        ownerStoreB = await openQssBackedChannel(ownerFixture.owner, channelB)
      },
    })
    const { owner, teamId } = fixture

    let inviteeStoreA!: QssChannelStore
    let inviteeStoreB!: QssChannelStore
    const invitee = await createInviteeFixture(fixture, 'qss-member', {
      beforeStorageReady: async peer => {
        inviteeStoreA = await openQssBackedChannel(peer, channelA)
        inviteeStoreB = await openQssBackedChannel(peer, channelB)
        expect(inviteeStoreA.address).toBe(ownerStoreA.address)
        expect(inviteeStoreB.address).toBe(ownerStoreB.address)
      },
    })

    const ownerSendSpy = jest.spyOn(owner.qssSyncManager, 'sendLogEntrySyncMessage')
    const inviteeSendSpy = jest.spyOn(invitee.qssSyncManager, 'sendLogEntrySyncMessage')
    const inviteeFanoutSpy = jest.fn()
    invitee.qssClient.on(WebsocketEvents.LOG_ENTRY_SYNC, inviteeFanoutSpy)

    const ownerText = 'owner message belongs only to channel A'
    const inviteeText = 'invitee message belongs only to channel B'
    const [ownerHash, inviteeHash] = await Promise.all([
      addChannelMessage(owner, ownerStoreA, channelA, ownerText),
      addChannelMessage(invitee, inviteeStoreB, channelB, inviteeText),
    ])

    await Promise.all([
      owner.qssSyncManager.waitForLogEntrySyncAck(ownerHash, 60_000),
      invitee.qssSyncManager.waitForLogEntrySyncAck(inviteeHash, 60_000),
    ])
    await waitForExactMessages(invitee, inviteeStoreA, channelA, [ownerText])
    await waitForExactMessages(owner, ownerStoreB, channelB, [inviteeText])
    await waitForExactMessages(owner, ownerStoreA, channelA, [ownerText])
    await waitForExactMessages(invitee, inviteeStoreB, channelB, [inviteeText])

    expect(ownerSendSpy).toHaveBeenCalledWith(expect.objectContaining({ hash: ownerHash }))
    expect(ownerSendSpy).not.toHaveBeenCalledWith(expect.objectContaining({ hash: inviteeHash }))
    expect(inviteeSendSpy).toHaveBeenCalledWith(expect.objectContaining({ hash: inviteeHash }))
    expect(inviteeSendSpy).not.toHaveBeenCalledWith(expect.objectContaining({ hash: ownerHash }))
    expect(inviteeFanoutSpy).toHaveBeenCalledWith(
      expect.objectContaining({ payload: expect.objectContaining({ hash: ownerHash }) })
    )

    const pageOne = await owner.qssSyncManager.pullLogEntries({
      teamId,
      userId: owner.sigChainService.user.userId,
      startSeq: 0,
      startTs: 0,
      limit: 1,
    })
    expect(pageOne).toMatchObject({
      status: CommunityOperationStatus.SUCCESS,
      payload: {
        entries: [expect.anything()],
        hasNextPage: true,
        resolvedStartSeq: 0,
        highestSyncSeq: expect.any(Number),
      },
    })

    const pageTwo = await owner.qssSyncManager.pullLogEntries({
      teamId,
      userId: owner.sigChainService.user.userId,
      startSeq: pageOne.payload.highestSyncSeq,
      startTs: 0,
      limit: 1,
    })
    expect(pageTwo.status).toBe(CommunityOperationStatus.SUCCESS)
    expect(pageTwo.payload.entries).toHaveLength(1)
    expect(pageTwo.payload.hasNextPage).toBe(false)
    expect(pageTwo.payload.highestSyncSeq).toBeGreaterThan(pageOne.payload.highestSyncSeq!)

    const finalPage = await owner.qssSyncManager.pullLogEntries({
      teamId,
      userId: owner.sigChainService.user.userId,
      startSeq: pageTwo.payload.highestSyncSeq,
      startTs: 0,
      limit: 1,
    })
    expect(finalPage.status).toBe(CommunityOperationStatus.SUCCESS)
    expect(finalPage.payload.entries).toHaveLength(0)
    expect(finalPage.payload.hasNextPage).toBe(false)

    invitee.qssClient.off(WebsocketEvents.LOG_ENTRY_SYNC, inviteeFanoutSpy)
  })

  it('catches up a reconnecting member and a late-joining member without observer-side uploads', async () => {
    let channel!: PublicChannel
    let ownerStore!: QssChannelStore
    const fixture = await createOwnerFixture('qss-history', {
      beforeConnect: async ownerFixture => {
        channel = createPublicChannel(ownerFixture, 'history')
        ownerStore = await openQssBackedChannel(ownerFixture.owner, channel)
      },
    })
    const { owner, teamId } = fixture

    let inviteeStore!: QssChannelStore
    const invitee = await createInviteeFixture(fixture, 'qss-reconnecting-member', {
      beforeStorageReady: async peer => {
        inviteeStore = await openQssBackedChannel(peer, channel)
      },
    })
    const observerSendSpy = jest.spyOn(invitee.qssSyncManager, 'sendLogEntrySyncMessage')

    await disconnectForDeterministicOfflineWindow(invitee, teamId)
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
    await waitForExactMessages(invitee, inviteeStore, channel, [])

    await connectPeer(invitee, teamId)
    await waitForExactMessages(invitee, inviteeStore, channel, expectedMessages)
    await waitForLastSyncSeqAtLeast(invitee, teamId, expectedSeq)

    let lateInviteeStore!: QssChannelStore
    const lateInvitee = await createInviteeFixture(fixture, 'qss-late-member', {
      beforeStorageReady: async peer => {
        lateInviteeStore = await openQssBackedChannel(peer, channel)
      },
    })
    await waitForExactMessages(lateInvitee, lateInviteeStore, channel, expectedMessages)
    await waitForLastSyncSeqAtLeast(lateInvitee, teamId, expectedSeq)
  })

  it('keeps both linked-device sessions authenticated and syncs history and live writes both ways', async () => {
    let channel!: PublicChannel
    let ownerStore!: QssChannelStore
    const fixture = await createOwnerFixture('qss-linked-device', {
      beforeConnect: async ownerFixture => {
        channel = createPublicChannel(ownerFixture, 'linked-device')
        ownerStore = await openQssBackedChannel(ownerFixture.owner, channel)
      },
    })
    const { owner, teamId, teamName, psk, libp2pParams } = fixture
    const ownerChain = owner.sigChainService.activeChain
    const ownerUserId = ownerChain.user.userId
    const ownerDeviceId = ownerChain.device.deviceId
    const deviceInvite = ownerChain.invites.createDeviceInvite()
    await owner.sigChainService.saveChain(teamId)

    const linkedDevice = await createPeer(`qss-linked-device-${randomUUID()}`)
    await linkedDevice.sigChainService.createChainFromDeviceInvite(
      {
        seed: deviceInvite.seed,
        userName: deviceInvite.userName,
        deviceName: 'QSS integration linked device',
        expectedTeamId: teamId,
        expectedUserId: deviceInvite.userId,
      },
      teamId,
      true
    )
    expect(linkedDevice.sigChainService.activeChain.isPendingDeviceAdmission).toBe(true)
    expect(linkedDevice.qssService.connected).toBe(false)

    await setCurrentCommunity(
      linkedDevice,
      {
        id: randomUUID(),
        name: teamName,
        ownership: CommunityOwnership.User,
        peerList: [owner.libp2pService.localAddress],
        psk,
        teamId,
        qssEnabled: true,
        qssEndpoint: QSS_INTEGRATION_ENDPOINT,
        qssSetup: true,
      },
      ownerUserId
    )

    const linkedDeviceParams = await getInMemoryLibp2pInstanceParams()
    linkedDeviceParams.psk = libp2pParams.psk
    await startPeerLibp2p(linkedDevice, linkedDeviceParams)
    const admission = await dialAndWaitForDeviceAdmission(linkedDevice, owner)
    const linkedChain = linkedDevice.sigChainService.activeChain

    expect(admission).toMatchObject({
      teamId,
      userId: ownerUserId,
      deviceId: linkedChain.device.deviceId,
      deviceAdmission: true,
    })
    expect(linkedChain.isPendingDeviceAdmission).toBe(false)
    expect(linkedChain.device.deviceId).not.toBe(ownerDeviceId)
    expect(linkedChain.team?.hasDevice(linkedChain.device.deviceId)).toBe(true)
    expect(linkedChain.team?.members(ownerUserId).devices).toHaveLength(2)
    await waitForExpect(() => {
      expect(owner.sigChainService.activeChain.team?.hasDevice(linkedChain.device.deviceId)).toBe(true)
      expect(owner.sigChainService.activeChain.team?.members(ownerUserId).devices).toHaveLength(2)
    }, 20_000)
    await linkedDevice.sigChainService.saveChain(teamId)

    const historicalText = 'linked device receives history before its QSS sign-in'
    const historicalHash = await addChannelMessage(owner, ownerStore, channel, historicalText)
    await owner.qssSyncManager.waitForLogEntrySyncAck(historicalHash, 60_000)

    await startPeerDataStorage(linkedDevice)
    const linkedDeviceStore = await openQssBackedChannel(linkedDevice, channel)
    expect(linkedDeviceStore.address).toBe(ownerStore.address)
    linkedDevice.qssService.markTeamStorageReady(teamId)
    await connectPeer(linkedDevice, teamId)
    await waitForExactMessages(linkedDevice, linkedDeviceStore, channel, [historicalText])

    await waitForAuthReady(owner, teamId)
    const ownerLiveText = 'owner remains live after linked device signs in'
    const ownerLiveHash = await addChannelMessage(owner, ownerStore, channel, ownerLiveText)
    await owner.qssSyncManager.waitForLogEntrySyncAck(ownerLiveHash, 60_000)
    await waitForExactMessages(linkedDevice, linkedDeviceStore, channel, [historicalText, ownerLiveText])

    const linkedDeviceText = 'linked device sends back to the original device'
    const linkedDeviceHash = await addChannelMessage(linkedDevice, linkedDeviceStore, channel, linkedDeviceText)
    await linkedDevice.qssSyncManager.waitForLogEntrySyncAck(linkedDeviceHash, 60_000)
    await waitForExactMessages(owner, ownerStore, channel, [historicalText, ownerLiveText, linkedDeviceText])
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
